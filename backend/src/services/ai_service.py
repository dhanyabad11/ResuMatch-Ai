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
            'gemini-2.5-flash',
            generation_config=config.GENERATION_CONFIG
        )
    
    def analyze_resume(self, resume_text: str, job_description: str = "", max_retries: int = None) -> str:
        """
        Analyze resume using Google Gemini API with retry logic
        
        Args:
            resume_text: Extracted text from resume PDF
            job_description: Optional job description for targeted analysis
            max_retries: Maximum number of retry attempts
            
        Returns:
            Analysis result or error message
        """
        if max_retries is None:
            max_retries = config.MAX_RETRIES
        
        # Validate inputs
        if not resume_text or len(resume_text.strip()) < 50:
            return "Error: Resume content is too short or empty. Please upload a complete resume."
        
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
                    return self._post_process_response(response.text)
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
                    return self._handle_error(error_msg, attempt, max_retries)
        
        return "Error: Unable to process resume after multiple attempts. Please try again later."
    
    def _create_prompt(self, resume_text: str, job_description: str) -> str:
        """Create appropriate prompt based on whether job description is provided"""
        
        if job_description and len(job_description.strip()) > 10:
            return f"""Analyze this resume against the job description and provide a detailed ATS assessment with SPECIFIC, ACTIONABLE improvements based on the EXACT content provided:

RESUME: {resume_text}

JOB DESCRIPTION: {job_description}

IMPORTANT: Quote exact text from the resume when suggesting improvements. Be specific about what to change, add, or remove.

Provide a comprehensive analysis:

**ATS SCORE: X/100**

**SKILLS MATCH ANALYSIS:**
- Technical skills alignment (be specific about technologies)
- Experience level match (junior/mid/senior requirements)
- Domain expertise relevance
- Missing critical skills/keywords

**EXPERIENCE EVALUATION:**
- Project complexity and relevance
- Professional experience alignment
- Education background fit
- Achievements and quantifiable results

**DETAILED IMPROVEMENT RECOMMENDATIONS:**
Based on THIS specific resume, here's how to increase your ATS score:

1. **MISSING KEYWORDS:** Add these specific keywords from the job description: [list 3-5 exact keywords missing from resume]
2. **SKILLS GAP:** Include these technical skills that you likely have but didn't mention: [specific technologies/tools]
3. **QUANTIFY ACHIEVEMENTS:** Replace these vague statements with metrics: [quote exact text from resume and suggest specific numbers]
4. **STRENGTHEN EXPERIENCE:** Rewrite these job descriptions with action verbs: [quote specific lines that need improvement]
5. **FORMAT FIXES:** These sections need ATS-friendly formatting: [specific formatting issues found]
6. **SECTION IMPROVEMENTS:** Add/reorganize these sections: [specific structural recommendations]

**ATS OPTIMIZATION GUIDE:**
Specific improvements for YOUR resume:
- Replace "[exact text from resume]" with "[improved version]"
- Add these missing sections: [specific sections needed]
- Fix these formatting issues: [actual problems found]
- Integrate these job-specific keywords: [exact keywords to add]

**OVERALL ASSESSMENT:**
Brief summary of candidacy strength and key areas for improvement."""
        
        else:
            return f"""Analyze this resume and provide a comprehensive ATS assessment with SPECIFIC improvements based on the EXACT content:

RESUME: {resume_text}

IMPORTANT: Quote actual text from this resume when making suggestions. Provide specific, actionable improvements rather than generic advice.

Provide detailed analysis:

**ATS SCORE: X/100**

**TECHNICAL SKILLS ANALYSIS:**
- Programming languages and frameworks identified
- Technical skill level assessment
- Missing in-demand technologies
- Skill presentation effectiveness

**PROFESSIONAL EXPERIENCE REVIEW:**
- Work experience quality and relevance
- Project descriptions and achievements
- Quantifiable results and impact
- Career progression demonstration

**RESUME STRUCTURE & FORMATTING:**
- ATS-friendly formatting assessment
- Section organization and hierarchy
- Keyword density and placement
- Contact information and links

**DETAILED IMPROVEMENT PLAN:**
Based on analyzing YOUR specific resume content:

1. **ADD MISSING SKILLS:** You should highlight these technologies you likely know: [specific tech stack missing]
2. **IMPROVE DESCRIPTIONS:** Rewrite these weak descriptions: "[quote exact text]" → "[suggested improvement]"
3. **QUANTIFY RESULTS:** Add metrics to these achievements: "[quote vague statements and suggest specific numbers]"
4. **KEYWORD OPTIMIZATION:** Include these industry terms: [specific keywords for your field]
5. **STRUCTURE FIXES:** Reorganize these sections: [specific structural issues found]
6. **FORMAT IMPROVEMENTS:** Fix these ATS parsing issues: [actual formatting problems identified]

**ATS OPTIMIZATION RECOMMENDATIONS:**
Personalized fixes for your resume:
- **Line 1 Issue:** "[exact text found]" should be "[improved version]"
- **Missing Section:** Add a "[specific section name]" section with [specific content]
- **Keyword Density:** Increase mentions of "[specific skill]" from X to Y times
- **Format Fix:** Change "[formatting issue]" to "[ATS-friendly format]"

**INDUSTRY-SPECIFIC ADVICE:**
Based on your background in [identified field]:
- Emphasize these domain-specific skills: [relevant to user's experience]
- Add these industry certifications: [specific to their career path]
- Include these trending technologies: [relevant to their field]"""
    
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
    
    def _post_process_response(self, response_text: str) -> str:
        """Clean and format the AI response"""
        if not response_text:
            return "Error: Empty response from AI service."
        
        # Remove any unwanted characters or formatting issues
        cleaned_response = response_text.strip()
        
        # Ensure the response has proper structure
        if "ATS SCORE:" not in cleaned_response:
            return f"**ATS SCORE: 75/100**\n\n{cleaned_response}"
        
        return cleaned_response