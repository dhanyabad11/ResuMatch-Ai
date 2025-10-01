from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import PyPDF2
import os
from dotenv import load_dotenv
import io

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Gemini API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-pro')

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

def analyze_resume_with_gemini(resume_text, job_description=""):
    """Analyze resume using Google Gemini API"""
    try:
        if job_description:
            prompt = f"""
            You are an expert ATS (Applicant Tracking System) and hiring manager. Analyze this resume against the job description and provide detailed feedback.

            JOB DESCRIPTION:
            {job_description}

            RESUME:
            {resume_text}

            Please provide a comprehensive analysis with:

            **OVERALL SCORE: X/10** (How likely is this resume to pass ATS and get shortlisted?)

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

            **OVERALL SCORE: X/10** (General resume effectiveness)

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
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error analyzing resume: {str(e)}"

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