from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import PyPDF2
import os
from dotenv import load_dotenv
import io
import time
import json
from typing import Optional, Tuple

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure CORS to allow your Vercel domain with all necessary headers
CORS(app, 
     origins=['https://resu-match-ai-three.vercel.app', 'http://localhost:3000'],
     methods=['GET', 'POST', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
     expose_headers=['Content-Type'],
     supports_credentials=True)

# Configure Gemini API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

"""
ResuMatch AI - Production-Level Backend Application
A professional resume analysis service using AI
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import PyPDF2
import os
from dotenv import load_dotenv
import io
import time
from typing import Optional, Tuple
from werkzeug.utils import secure_filename

# Load environment variables
load_dotenv()

# Configuration
class Config:
    """Application configuration"""
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    FLASK_ENV = os.getenv('FLASK_ENV', 'production')
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    ALLOWED_EXTENSIONS = {'pdf'}
    CORS_ORIGINS = [
        'https://resu-match-ai-three.vercel.app',
        'http://localhost:3000',
        'http://localhost:3001'
    ]
    GENERATION_CONFIG = {
        "temperature": 0.3,
        "top_p": 0.8,
        "top_k": 40,
        "max_output_tokens": 8192,
    }
    MAX_RETRIES = 3
    RESUME_TEXT_LIMIT = 4000
    JOB_DESCRIPTION_LIMIT = 1500

# File Validation Class
class FileValidator:
    """Handles file validation for uploads"""
    
    ALLOWED_EXTENSIONS = {'pdf'}
    RESUME_KEYWORDS = [
        'experience', 'education', 'skills', 'work', 'employment',
        'university', 'college', 'degree', 'bachelor', 'master',
        'project', 'achievement', 'responsibility', 'job', 'career',
        'professional', 'technical', 'qualification', 'certificate'
    ]
    
    @staticmethod
    def allowed_file(filename):
        """Check if file extension is allowed"""
        if not filename:
            return False
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in FileValidator.ALLOWED_EXTENSIONS
    
    @staticmethod
    def validate_file_size(file_size, max_size=16*1024*1024):
        """Validate file size (default 16MB)"""
        return file_size <= max_size
    
    @staticmethod
    def is_resume_content(text_content):
        """Check if the extracted text appears to be a resume"""
        if not text_content or len(text_content.strip()) < 100:
            return False
        
        text_lower = text_content.lower()
        keyword_count = sum(1 for keyword in FileValidator.RESUME_KEYWORDS 
                          if keyword in text_lower)
        
        # Should have at least 3 resume-related keywords
        return keyword_count >= 3
    
    @staticmethod
    def validate_upload(file):
        """Complete file validation pipeline"""
        errors = []
        
        if not file:
            errors.append("No file provided")
            return False, errors
        
        if not file.filename:
            errors.append("No file selected")
            return False, errors
        
        # Check file extension
        if not FileValidator.allowed_file(file.filename):
            errors.append("Please upload a PDF file only")
            return False, errors
        
        # Read file content for validation
        file_content = file.read()
        file.seek(0)  # Reset file pointer
        
        # Check file size
        if not FileValidator.validate_file_size(len(file_content)):
            errors.append("File size exceeds 16MB limit")
            return False, errors
        
        return True, []

# Initialize Flask app
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = Config.MAX_CONTENT_LENGTH

# Configure CORS
CORS(app, 
     origins=Config.CORS_ORIGINS,
     methods=['GET', 'POST', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
     expose_headers=['Content-Type'],
     supports_credentials=True)

# Validate configuration
if not Config.GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is required")

# Configure Gemini API
genai.configure(api_key=Config.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash', generation_config=Config.GENERATION_CONFIG)
generation_config = {
    "temperature": 0.3,
    "top_p": 0.8,
    "top_k": 40,
    "max_output_tokens": 2048,  # Reduced for faster response
}

model = genai.GenerativeModel(
    'gemini-2.5-flash',
    generation_config=generation_config
)

# Handle preflight OPTIONS requests explicitly
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({'status': 'ok'})
        response.headers.add("Access-Control-Allow-Origin", request.headers.get('Origin', '*'))
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

def extract_text_from_pdf(pdf_file) -> Tuple[bool, str]:
    """
    Extract text from uploaded PDF file with validation
    Returns: (success: bool, result: str) - result is either text or error message
    """
    try:
        # Read file content
        file_content = pdf_file.read()
        pdf_file.seek(0)  # Reset file pointer
        
        # Create PDF reader
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        
        # Check if PDF is encrypted
        if pdf_reader.is_encrypted:
            return False, "Cannot process encrypted PDF files. Please upload an unencrypted version."
        
        # Extract text from all pages
        text = ""
        page_count = len(pdf_reader.pages)
        
        if page_count == 0:
            return False, "PDF file appears to be empty or corrupted."
        
        for page_num, page in enumerate(pdf_reader.pages):
            try:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            except Exception as e:
                print(f"Warning: Could not extract text from page {page_num + 1}: {str(e)}")
                continue
        
        # Validate extracted text
        if not text.strip():
            return False, "Could not extract text from PDF. The file might be image-based or corrupted."
        
        # Check if content appears to be a resume
        if not FileValidator.is_resume_content(text):
            return False, "This doesn't appear to be a resume. Please upload a valid resume document."
        
        # Clean and normalize text
        cleaned_text = clean_text(text)
        return True, cleaned_text
        
    except Exception as e:
        error_msg = str(e)
        if "PDF" in error_msg:
            return False, "Invalid or corrupted PDF file. Please upload a valid PDF resume."
        else:
            return False, f"Error processing PDF: {error_msg}"

def clean_text(text: str) -> str:
    """Clean and normalize extracted text"""
    if not text:
        return ""
    
    # Remove excessive whitespace and normalize line breaks
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    cleaned_text = '\n'.join(lines)
    
    # Remove common PDF artifacts
    artifacts = ['/ne+', '/♀nednd', '/gtb', '��', '\x00', '\ufeff']
    for artifact in artifacts:
        cleaned_text = cleaned_text.replace(artifact, '')
    
    return cleaned_text

def analyze_resume_with_gemini(resume_text, job_description="", max_retries=3):
    """Analyze resume using Google Gemini API with timeout and retry logic"""
    
    # Debug: Check if API key is configured
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("ERROR: GEMINI_API_KEY not found in environment variables")
        return "Error: API configuration missing. Please check server setup."
    
    print(f"Starting analysis with {len(resume_text)} characters of resume text")
    if job_description:
        print(f"Job description provided: {len(job_description)} characters")
    
    for attempt in range(max_retries):
        try:
            if job_description:
                prompt = f"""Analyze this resume against the job description and provide a detailed ATS assessment:

RESUME: {resume_text[:4000]}

JOB DESCRIPTION: {job_description[:1500]}

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
1. [Specific technical skill to add/highlight]
2. [Resume formatting or structure improvement]
3. [Content enhancement with examples]
4. [ATS keyword optimization]
5. [Professional presentation improvement]

**ATS OPTIMIZATION GUIDE:**
- Formatting improvements for better parsing
- Keyword integration strategies
- Section organization recommendations
- Contact information optimization

**OVERALL ASSESSMENT:**
Brief summary of candidacy strength and key areas for improvement."""
            else:
                prompt = f"""Analyze this resume and provide a comprehensive ATS assessment:

RESUME: {resume_text[:4000]}

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
1. [Technical skills enhancement]
2. [Experience description improvement]
3. [Formatting and structure fix]
4. [Keyword optimization]
5. [Professional presentation upgrade]
6. [Additional relevant improvement]

**ATS OPTIMIZATION RECOMMENDATIONS:**
- Specific formatting changes for better parsing
- Strategic keyword integration
- Content restructuring suggestions
- Professional summary enhancement

**INDUSTRY-SPECIFIC ADVICE:**
Tailored recommendations based on apparent career focus and industry standards."""            # Generate content (remove unsupported request_options)
            print(f"Generating content, attempt {attempt + 1}")
            response = model.generate_content(prompt)
            print(f"Analysis completed successfully on attempt {attempt + 1}")
            return response.text
            
        except Exception as e:
            error_msg = str(e)
            print(f"Attempt {attempt + 1} failed: {error_msg}")
            print(f"Error type: {type(e).__name__}")
            
            # Handle specific timeout errors
            if ("504" in error_msg or "timeout" in error_msg.lower() or 
                "deadline" in error_msg.lower() or "ResourceExhausted" in error_msg):
                if attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 2  # Exponential backoff: 2s, 4s, 6s
                    print(f"Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                    continue
                else:
                    return "Error: The AI service is experiencing high demand. Please try again in a few moments."
            
            # Handle other API errors
            elif "quota" in error_msg.lower() or "limit" in error_msg.lower():
                return "Error: API quota exceeded. Please try again later."
            
            elif "api" in error_msg.lower() and "key" in error_msg.lower():
                return "Error: API configuration issue. Please contact support."
            
            else:
                # For the last attempt or unknown errors, return the actual error
                if attempt == max_retries - 1:
                    return f"Error analyzing resume: Unable to process after {max_retries} attempts. Please try again."
                continue
    
    return "Error: Maximum retry attempts exceeded. Please try again later."

@app.route('/')
def health_check():
    return jsonify({"message": "ResuMatch AI Backend is running!"})

@app.route('/analyze-resume', methods=['POST'])
def analyze_resume():
    """
    Analyze uploaded resume with comprehensive validation and error handling
    """
    try:
        # Validate file upload
        if 'resume' not in request.files:
            return jsonify({
                "success": False,
                "error": "No resume file uploaded. Please select a PDF file."
            }), 400
        
        resume_file = request.files['resume']
        job_description = request.form.get('job_description', '').strip()
        
        # Validate file using FileValidator
        is_valid, validation_errors = FileValidator.validate_upload(resume_file)
        if not is_valid:
            return jsonify({
                "success": False,
                "error": validation_errors[0] if validation_errors else "Invalid file"
            }), 400
        
        print(f"Processing file: {resume_file.filename} ({len(resume_file.read())} bytes)")
        resume_file.seek(0)  # Reset file pointer after size check
        
        # Extract text from PDF with validation
        success, result = extract_text_from_pdf(resume_file)
        if not success:
            return jsonify({
                "success": False,
                "error": result
            }), 400
        
        resume_text = result
        print(f"Extracted {len(resume_text)} characters from PDF")
        
        # Analyze with Gemini AI
        try:
            analysis_result = analyze_resume_with_gemini(resume_text, job_description)
            
            # Check if analysis was successful
            if analysis_result.startswith("Error"):
                return jsonify({
                    "success": False,
                    "error": analysis_result
                }), 500
            
            return jsonify({
                "success": True,
                "analysis": analysis_result,
                "metadata": {
                    "filename": resume_file.filename,
                    "text_length": len(resume_text),
                    "has_job_description": bool(job_description),
                    "processing_time": "< 30 seconds"
                },
                "extracted_text_preview": resume_text[:300] + "..." if len(resume_text) > 300 else resume_text
            }), 200
            
        except Exception as ai_error:
            print(f"AI analysis error: {str(ai_error)}")
            return jsonify({
                "success": False,
                "error": "Analysis failed. The AI service might be temporarily unavailable. Please try again.",
                "details": str(ai_error) if Config.DEBUG else None
            }), 500
    
    except Exception as e:
        print(f"Unexpected error in analyze_resume: {str(e)}")
        return jsonify({
            "success": False,
            "error": "An unexpected error occurred. Please try again.",
            "details": str(e) if Config.DEBUG else None
        }), 500

@app.route('/extract-text', methods=['POST'])
def extract_text():
    """
    Extract text from PDF without AI analysis - useful for preview/debugging
    """
    try:
        # Validate file upload
        if 'resume' not in request.files:
            return jsonify({
                "success": False,
                "error": "No resume file uploaded. Please select a PDF file."
            }), 400
        
        resume_file = request.files['resume']
        
        # Validate file using FileValidator
        is_valid, validation_errors = FileValidator.validate_upload(resume_file)
        if not is_valid:
            return jsonify({
                "success": False,
                "error": validation_errors[0] if validation_errors else "Invalid file"
            }), 400
        
        # Extract text from PDF with validation
        success, result = extract_text_from_pdf(resume_file)
        if not success:
            return jsonify({
                "success": False,
                "error": result
            }), 400
        
        extracted_text = result
        
        return jsonify({
            "success": True,
            "extracted_text": extracted_text,
            "metadata": {
                "filename": resume_file.filename,
                "text_length": len(extracted_text),
                "word_count": len(extracted_text.split()),
                "is_resume": FileValidator.is_resume_content(extracted_text)
            }
        }), 200
    
    except Exception as e:
        print(f"Error in extract_text: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Failed to extract text from PDF. Please ensure the file is not corrupted.",
            "details": str(e) if Config.DEBUG else None
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)