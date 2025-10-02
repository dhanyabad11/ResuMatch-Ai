from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import PyPDF2
import os
from dotenv import load_dotenv
import io
import time
from typing import Optional

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Gemini API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

# Configure generation settings for better reliability
generation_config = {
    "temperature": 0.3,
    "top_p": 0.8,
    "top_k": 40,
    "max_output_tokens": 8192,
}

model = genai.GenerativeModel(
    'gemini-2.5-flash',
    generation_config=generation_config
)

def extract_text_from_pdf(pdf_file):
    """Extract text from uploaded PDF file"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_file.read()))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        return f"Error extracting text: {str(e)}"

def analyze_resume_with_gemini(resume_text, job_description="", max_retries=3):
    """Analyze resume using Google Gemini API with timeout and retry logic"""
    
    for attempt in range(max_retries):
        try:
            if job_description:
                prompt = f"""
            You are an expert ATS (Applicant Tracking System) and hiring manager. Analyze this resume against the job description and provide detailed feedback.

            JOB DESCRIPTION:
            {job_description}

            RESUME:
            {resume_text}

            Please provide a comprehensive analysis with:

            **OVERALL ATS SCORE: X/100** (How likely is this resume to pass ATS and get shortlisted?)
            Score Guide: 85-100 = Excellent, 70-84 = Good, 55-69 = Fair, 40-54 = Needs Work, 0-39 = Major Issues

            **ATS COMPATIBILITY ANALYSIS:**
            - ATS-friendly formatting score
            - Keyword density and relevance
            - Section organization effectiveness
            - File structure compatibility

            **JOB MATCH ANALYSIS:**
            - Skills alignment percentage
            - Missing critical keywords from job description
            - Experience level match
            - Industry-specific terminology usage

            **KEYWORD OPTIMIZATION:**
            - List of important keywords from job description that are MISSING
            - Keywords that are well-represented
            - Suggested keyword placement strategies

            **SPECIFIC IMPROVEMENTS:**
            - Top 3 immediate changes to make
            - Skills/technologies to emphasize more
            - Sections that need strengthening
            - Quantifiable achievements to add

            **ATS OPTIMIZATION TIPS:**
            - Formatting improvements
            - Section reordering suggestions
            - Content restructuring recommendations

            Be specific, actionable, and focus on getting this resume past ATS systems and into human hands.
            """
            else:
                prompt = f"""
                You are an expert resume reviewer and ATS specialist. Analyze this resume for general optimization:

                RESUME:
                {resume_text}

                Please provide:

                **OVERALL ATS SCORE: X/100** (General resume effectiveness and ATS compatibility)
                Score Guide: 85-100 = Excellent, 70-84 = Good, 55-69 = Fair, 40-54 = Needs Work, 0-39 = Major Issues

                **ATS COMPATIBILITY:**
                - Formatting and structure assessment
                - Common ATS parsing issues
                - Recommended format improvements

                **CONTENT ANALYSIS:**
                - Skills presentation effectiveness
                - Experience descriptions quality
                - Achievement quantification
                - Professional summary strength

                **IMPROVEMENT RECOMMENDATIONS:**
                - Top 5 specific changes to make
                - Missing sections or information
                - Better ways to present experience
                - Industry best practices to implement

                **GENERAL OPTIMIZATION:**
                - Keyword strategy suggestions
                - Content organization improvements
                - Professional presentation tips

                Focus on making this resume more competitive and ATS-friendly.
                """
        
            # Generate content with timeout handling
            response = model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            error_msg = str(e)
            print(f"Attempt {attempt + 1} failed: {error_msg}")
            
            # Handle specific timeout errors
            if "504" in error_msg or "timeout" in error_msg.lower() or "deadline" in error_msg.lower():
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
    try:
        # Check if file is uploaded
        if 'resume' not in request.files:
            return jsonify({"error": "No resume file uploaded"}), 400
        
        resume_file = request.files['resume']
        job_description = request.form.get('job_description', '')
        
        if resume_file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Check file type
        if not resume_file.filename.lower().endswith('.pdf'):
            return jsonify({"error": "Only PDF files are supported"}), 400
        
        # Extract text from PDF
        resume_text = extract_text_from_pdf(resume_file)
        
        if resume_text.startswith("Error"):
            return jsonify({"error": resume_text}), 500
        
        # Analyze with Gemini
        analysis_result = analyze_resume_with_gemini(resume_text, job_description)
        
        return jsonify({
            "success": True,
            "analysis": analysis_result,
            "extracted_text": resume_text[:500] + "..." if len(resume_text) > 500 else resume_text
        })
    
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route('/extract-text', methods=['POST'])
def extract_text():
    """Extract text from PDF without analysis"""
    try:
        if 'resume' not in request.files:
            return jsonify({"error": "No resume file uploaded"}), 400
        
        resume_file = request.files['resume']
        
        if resume_file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not resume_file.filename.lower().endswith('.pdf'):
            return jsonify({"error": "Only PDF files are supported"}), 400
        
        text = extract_text_from_pdf(resume_file)
        
        if text.startswith("Error"):
            return jsonify({"error": text}), 500
        
        return jsonify({
            "success": True,
            "extracted_text": text
        })
    
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)