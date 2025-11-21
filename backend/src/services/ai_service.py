"""
AI analysis service using Google Gemini API
"""
import google.generativeai as genai
import time
import os
from typing import Optional
from src.config.settings import get_config

config = get_config()

class AIAnalyzer:
    """Handles AI-powered resume analysis using Google Gemini"""
    
    def __init__(self):
        """Initialize the AI analyzer"""
        # Configure Gemini API
        if not config.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=config.GEMINI_API_KEY)
        
        # Initialize model with configuration
        self.model = genai.GenerativeModel(
            'models/gemini-2.5-flash',
            generation_config=config.GENERATION_CONFIG
        )
    
    def analyze_resume(self, resume_text: str, job_description: str = "", max_retries: int = None) -> dict:
        """
        Analyze resume using Google Gemini API with retry logic
        
        Args:
            resume_text: Extracted text from resume PDF
            job_description: Optional job description for targeted analysis
            max_retries: Maximum number of retry attempts
            
        Returns:
            Dictionary containing analysis results or error message
        """
        if max_retries is None:
            max_retries = config.MAX_RETRIES
        
        # Validate inputs
        if not resume_text or len(resume_text.strip()) < 50:
            return {"error": "Resume content is too short or empty. Please upload a complete resume."}
        
        print(f"Starting AI analysis with {len(resume_text)} characters of resume text")
        if job_description:
            print(f"Job description provided: {len(job_description)} characters")
        
        # Truncate inputs to limits
        resume_text = resume_text[:config.RESUME_TEXT_LIMIT]
        job_description = job_description[:config.JOB_DESCRIPTION_LIMIT] if job_description else ""
        
        # Choose appropriate prompt
        prompt = self._create_prompt(resume_text, job_description)
        
        # Attempt analysis with retries
        for attempt in range(max_retries):
            try:
                print(f"Generating analysis, attempt {attempt + 1}")
                response = self.model.generate_content(prompt)
                
                if response and response.text:
                    print(f"Analysis completed successfully on attempt {attempt + 1}")
                    result = self._post_process_response(response.text)
                    print(f"Post-process result type: {type(result)}")
                    return result
                else:
                    raise Exception("Empty response from AI model")
                    
            except Exception as e:
                error_msg = str(e)
                print(f"Attempt {attempt + 1} failed: {error_msg}")
                print(f"Error type: {type(e).__name__}")
                
                # Handle specific error types
                if self._should_retry(error_msg, attempt, max_retries):
                    wait_time = (attempt + 1) * 2  # Exponential backoff: 2s, 4s, 6s
                    print(f"Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                    continue
                else:
                    result = self._handle_error(error_msg, attempt, max_retries)
                    print(f"Returning error dict: {result}")
                    return {"error": result}
        
        print("Returning final error dict")
        return {"error": "Unable to process resume after multiple attempts. Please try again later."}
    
    def _create_prompt(self, resume_text: str, job_description: str) -> str:
        """Create appropriate prompt based on whether job description is provided"""
        
        base_prompt = """You are an expert ATS (Applicant Tracking System) optimizer and career coach. 
Analyze the provided resume and return a JSON object with the following structure:
{
    "ats_score": number (0-100),
    "fit_analysis": "string (markdown supported)",
    "improvement_tips": ["string", "string", ...]
}

IMPORTANT: Return ONLY the raw JSON object. Do not include markdown formatting like ```json ... ```.
"""
        
        if job_description and len(job_description.strip()) > 10:
            return f"""{base_prompt}
Analyze this resume against the job description.

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}

INSTRUCTIONS:
1. "ats_score": Evaluate how well the resume matches the job description.
2. "fit_analysis": detailed analysis of how the candidate fits the role. Use markdown for formatting (bolding, lists).
   - Mention matching skills.
   - Mention experience alignment.
   - Mention missing critical keywords.
3. "improvement_tips": A list of concise, actionable tips to improve the ATS score. 
   - Focus on specific keywords to add.
   - Focus on formatting changes.
   - Focus on quantifying achievements.

Return ONLY valid JSON.
"""
        
        else:
            return f"""{base_prompt}
Analyze this resume for general ATS best practices.

RESUME:
{resume_text}

INSTRUCTIONS:
1. "ats_score": Evaluate the resume's general ATS friendliness and strength.
2. "fit_analysis": detailed analysis of the resume's strength. Use markdown.
   - Evaluate skills presentation.
   - Evaluate experience descriptions.
   - Evaluate formatting and structure.
3. "improvement_tips": A list of concise, actionable tips to improve the ATS score.
   - Focus on general best practices.
   - Focus on formatting.
   - Focus on impact and metrics.

Return ONLY valid JSON.
"""
    
    def _should_retry(self, error_msg: str, attempt: int, max_retries: int) -> bool:
        """Determine if we should retry based on error type"""
        if attempt >= max_retries - 1:
            return False
        
        # Retry on timeout/quota errors
        retry_keywords = ["504", "timeout", "deadline", "resourceexhausted", "quota"]
        return any(keyword in error_msg.lower() for keyword in retry_keywords)
    
    def _handle_error(self, error_msg: str, attempt: int, max_retries: int) -> str:
        """Handle different types of errors with appropriate messages"""
        error_lower = error_msg.lower()
        
        if "quota" in error_lower or "limit" in error_lower:
            return "Error: AI service quota exceeded. Please try again in a few minutes."
        
        elif "api" in error_lower and "key" in error_lower:
            return "Error: AI service configuration issue. Please contact support."
        
        elif "504" in error_msg or "timeout" in error_lower or "deadline" in error_lower:
            return "Error: AI service is experiencing high demand. Please try again in a few moments."
        
        else:
            if attempt >= max_retries - 1:
                return f"Error: Unable to analyze resume after {max_retries} attempts. Please try again later."
            else:
                return f"Error: {error_msg}"
    
    def _post_process_response(self, response_text: str) -> dict:
        """Clean and format the AI response"""
        import json
        import re
        
        if not response_text:
            return {"error": "Empty response from AI service."}
        
        try:
            # Try to find JSON block if it's wrapped in markdown code blocks
            json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                # If no code block, try to find the first { and last }
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                else:
                    json_str = response_text
            
            return json.loads(json_str)
            
        except json.JSONDecodeError:
            print(f"Failed to parse JSON response: {response_text}")
            # Fallback for failed JSON parsing
            return {
                "ats_score": 0,
                "fit_analysis": "Error parsing analysis results. However, here is the raw output:\n\n" + response_text,
                "improvement_tips": ["Could not parse specific improvements."]
            }