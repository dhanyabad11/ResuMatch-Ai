"""
AI LaTeX Integration Service
Uses AI to enhance and improve LaTeX resume code
"""
import google.generativeai as genai
import json
import re
import logging
from typing import Optional, Dict, List
from src.config.settings import get_config

logger = logging.getLogger(__name__)
config = get_config()


class AILaTeXService:
    """AI-powered LaTeX resume enhancement service"""
    
    def __init__(self):
        """Initialize the AI LaTeX service"""
        if not config.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=config.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(
            'models/gemini-2.5-flash',
            generation_config={
                "temperature": 0.3,
                "top_p": 0.8,
                "max_output_tokens": 8192,
            }
        )
    
    def improve_resume(self, latex_code: str, job_description: str = "") -> Dict:
        """
        Use AI to suggest improvements to the resume
        
        Args:
            latex_code: Current LaTeX resume code
            job_description: Optional job description for targeted suggestions
            
        Returns:
            Dictionary with suggestions and improved code
        """
        prompt = self._create_improvement_prompt(latex_code, job_description)
        
        try:
            response = self.model.generate_content(prompt)
            
            if response and response.text:
                return self._parse_improvement_response(response.text)
            else:
                return {"error": "No response from AI"}
                
        except Exception as e:
            logger.error(f"AI improvement error: {e}")
            return {"error": str(e)}
    
    def generate_bullet_points(self, 
                               role: str, 
                               company: str, 
                               responsibilities: str) -> List[str]:
        """
        Generate impactful bullet points for work experience
        
        Args:
            role: Job title
            company: Company name
            responsibilities: Description of responsibilities
            
        Returns:
            List of formatted bullet points
        """
        prompt = f"""Generate 3-5 impactful resume bullet points for the following role.
Use the XYZ formula: Accomplished [X] by [Y], resulting in [Z].
Include metrics and quantifiable results where possible.

Role: {role}
Company: {company}
Responsibilities: {responsibilities}

Return ONLY a JSON array of strings, no other text:
["Bullet point 1", "Bullet point 2", ...]
"""
        
        try:
            response = self.model.generate_content(prompt)
            if response and response.text:
                # Parse JSON array from response
                text = response.text.strip()
                # Find JSON array
                match = re.search(r'\[.*\]', text, re.DOTALL)
                if match:
                    return json.loads(match.group())
            return []
        except Exception as e:
            logger.error(f"Bullet point generation error: {e}")
            return []
    
    def improve_section(self, section_name: str, section_content: str) -> str:
        """
        Improve a specific section of the resume
        
        Args:
            section_name: Name of the section (e.g., "Experience", "Summary")
            section_content: Current content of the section
            
        Returns:
            Improved LaTeX content for the section
        """
        prompt = f"""Improve this resume {section_name} section for maximum impact.
Keep the LaTeX formatting intact.
Make it more professional, impactful, and ATS-friendly.
Use action verbs and quantify achievements where possible.

Current content:
{section_content}

Return ONLY the improved LaTeX code, no explanations.
"""
        
        try:
            response = self.model.generate_content(prompt)
            if response and response.text:
                return response.text.strip()
            return section_content
        except Exception as e:
            logger.error(f"Section improvement error: {e}")
            return section_content
    
    def check_ats_compatibility(self, latex_code: str) -> Dict:
        """
        Check LaTeX resume for ATS compatibility
        
        Args:
            latex_code: LaTeX resume code
            
        Returns:
            Dictionary with ATS score and recommendations
        """
        prompt = f"""Analyze this LaTeX resume for ATS (Applicant Tracking System) compatibility.

LaTeX Resume:
{latex_code[:3000]}

Return a JSON object with this structure:
{{
    "ats_score": number (0-100),
    "issues": ["issue 1", "issue 2", ...],
    "recommendations": ["recommendation 1", "recommendation 2", ...],
    "keyword_analysis": {{
        "found_keywords": ["keyword1", "keyword2"],
        "missing_common_keywords": ["keyword1", "keyword2"]
    }}
}}

Return ONLY the JSON object, no other text.
"""
        
        try:
            response = self.model.generate_content(prompt)
            if response and response.text:
                text = response.text.strip()
                # Find JSON object
                match = re.search(r'\{.*\}', text, re.DOTALL)
                if match:
                    return json.loads(match.group())
            return {"error": "Could not parse ATS analysis"}
        except Exception as e:
            logger.error(f"ATS check error: {e}")
            return {"error": str(e)}
    
    def suggest_skills(self, current_skills: List[str], job_description: str) -> List[str]:
        """
        Suggest additional skills based on job description
        
        Args:
            current_skills: List of skills already in resume
            job_description: Target job description
            
        Returns:
            List of suggested skills to add
        """
        prompt = f"""Based on this job description, suggest additional skills that should be added to the resume.
Only suggest skills that are commonly required for this type of role.
Do not suggest skills already listed.

Current skills: {', '.join(current_skills)}

Job Description:
{job_description[:1500]}

Return ONLY a JSON array of suggested skills:
["skill1", "skill2", ...]
"""
        
        try:
            response = self.model.generate_content(prompt)
            if response and response.text:
                text = response.text.strip()
                match = re.search(r'\[.*\]', text, re.DOTALL)
                if match:
                    return json.loads(match.group())
            return []
        except Exception as e:
            logger.error(f"Skill suggestion error: {e}")
            return []
    
    def _create_improvement_prompt(self, latex_code: str, job_description: str) -> str:
        """Create prompt for resume improvement"""
        base_prompt = f"""You are an expert resume writer and LaTeX professional.
Analyze this LaTeX resume and provide suggestions for improvement.

LaTeX Resume:
{latex_code[:4000]}
"""
        
        if job_description:
            base_prompt += f"""

Target Job Description:
{job_description[:1500]}

Tailor your suggestions to make this resume more relevant for this specific role.
"""
        
        base_prompt += """

Return a JSON object with this structure:
{
    "overall_score": number (0-100),
    "summary": "Brief overall assessment",
    "suggestions": [
        {
            "section": "Section name",
            "issue": "What's wrong",
            "improvement": "How to fix it",
            "priority": "high/medium/low"
        }
    ],
    "improved_sections": {
        "section_name": "Improved LaTeX code for that section"
    }
}

Return ONLY the JSON object.
"""
        return base_prompt
    
    def _parse_improvement_response(self, response_text: str) -> Dict:
        """Parse AI improvement response"""
        try:
            text = response_text.strip()
            # Remove markdown code blocks if present
            text = re.sub(r'```json\s*', '', text)
            text = re.sub(r'```\s*', '', text)
            # Find JSON object
            match = re.search(r'\{.*\}', text, re.DOTALL)
            if match:
                return json.loads(match.group())
            return {"error": "Could not parse improvement suggestions"}
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}")
            return {"error": "Invalid JSON response from AI"}
