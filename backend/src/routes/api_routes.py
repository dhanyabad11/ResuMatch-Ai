"""
API routes for ResuMatch AI
"""
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from werkzeug.utils import secure_filename
import logging

from ..services.pdf_service import PDFProcessor
from ..services.ai_service import AIAnalyzer
from ..validators.file_validator import FileValidator

# Create blueprint for API routes
api_bp = Blueprint('api', __name__)

# Initialize services
pdf_processor = PDFProcessor()
ai_analyzer = AIAnalyzer()

@api_bp.route('/')
@cross_origin()
def health_check():
    """Health check endpoint"""
    return jsonify({
        "message": "ResuMatch AI Backend is running!",
        "status": "healthy",
        "version": "1.0.1",
        "cors": "enabled"
    })

@api_bp.route('/analyze-resume', methods=['POST', 'OPTIONS'])
@cross_origin()
def analyze_resume():
    """
    Main endpoint for resume analysis
    Expects: multipart/form-data with 'resume' (PDF file) and optional 'job_description'
    """
    try:
        # Handle preflight request
        if request.method == 'OPTIONS':
            return '', 200
        # Get uploaded file
        if 'resume' not in request.files:
            return jsonify({
                "error": "No resume file provided",
                "message": "Please upload a resume in PDF format"
            }), 400
        
        file = request.files['resume']
        job_description = request.form.get('job_description', '').strip()
        
        # Validate file
        is_valid, validation_errors = FileValidator.validate_upload(file)
        if not is_valid:
            return FileValidator.create_error_response(validation_errors)
        
        # Extract text from PDF
        success, result = pdf_processor.extract_text_from_pdf(file)
        if not success:
            return jsonify({
                "error": "Failed to process resume",
                "message": result,
                "details": "Please ensure you're uploading a valid, non-encrypted PDF resume"
            }), 400
        
        resume_text = result
        
        # Get text statistics for logging
        text_stats = pdf_processor.get_text_stats(resume_text)
        print(f"PDF processed successfully: {text_stats}")
        
        # Perform AI analysis
        analysis_result = ai_analyzer.analyze_resume(resume_text, job_description)
        
        # Check if analysis failed
        if analysis_result.startswith("Error:"):
            return jsonify({
                "error": "Analysis failed",
                "message": analysis_result,
                "details": "Please try again or contact support if the problem persists"
            }), 500
        
        # Return successful analysis
        return jsonify({
            "success": True,
            "analysis": analysis_result,
            "metadata": {
                "file_name": file.filename,
                "text_stats": text_stats,
                "has_job_description": bool(job_description),
                "job_description_length": len(job_description) if job_description else 0
            }
        })
        
    except Exception as e:
        print(f"Unexpected error in analyze_resume: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "message": "An unexpected error occurred while processing your resume",
            "details": "Please try again later or contact support"
        }), 500

@api_bp.route('/extract-text', methods=['POST', 'OPTIONS'])
@cross_origin()
def extract_text():
    """
    Extract text from uploaded PDF without AI analysis
    Expects: multipart/form-data with 'resume' (PDF file)
    """
    try:
        # Handle preflight request
        if request.method == 'OPTIONS':
            return '', 200
            
        # Get uploaded file
        if 'resume' not in request.files:
            return jsonify({
                "error": "No resume file provided",
                "message": "Please upload a resume in PDF format"
            }), 400
        
        file = request.files['resume']
        
        # Validate file
        is_valid, validation_errors = FileValidator.validate_upload(file)
        if not is_valid:
            return jsonify({
                "error": "File validation failed",
                "message": validation_errors[0] if validation_errors else "Invalid file",
                "details": validation_errors
            }), 400
        
        # Extract text using PDF processor
        file.seek(0)  # Reset file pointer
        success, result = pdf_processor.extract_text_from_pdf(file)
        
        if not success:
            return jsonify({
                "error": "Text extraction failed",
                "message": result,
                "details": "Unable to extract text from the uploaded PDF"
            }), 500
        
        return jsonify({
            "success": True,
            "extracted_text": result,
            "message": "Text extracted successfully"
        }), 200
    
    except Exception as e:
        logger.error(f"Error in extract_text endpoint: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "message": "An unexpected error occurred during text extraction",
            "details": "Please try again later or contact support"
        }), 500

@api_bp.route('/validate-file', methods=['POST', 'OPTIONS'])
@cross_origin()
def validate_file():
    """
    Validate uploaded file without processing
    Expects: multipart/form-data with 'resume' (PDF file)
    """
    try:
        # Handle preflight request
        if request.method == 'OPTIONS':
            return '', 200
            
        # Get uploaded file
        if 'resume' not in request.files:
            return jsonify({
                "error": "No resume file provided",
                "message": "Please upload a resume in PDF format"
            }), 400
        
        file = request.files['resume']
        
        # Validate file
        is_valid, validation_errors = FileValidator.validate_upload(file)
        
        if not is_valid:
            return jsonify({
                "success": False,
                "valid": False,
                "error": "File validation failed",
                "message": validation_errors[0] if validation_errors else "Invalid file",
                "details": validation_errors
            }), 400
        
        return jsonify({
            "success": True,
            "valid": True,
            "message": "File is valid and ready for processing",
            "filename": secure_filename(file.filename)
        }), 200
    
    except Exception as e:
        logger.error(f"Error in validate_file endpoint: {str(e)}")
        return jsonify({
            "success": False,
            "valid": False,
            "error": "Internal server error",
            "message": "An unexpected error occurred during file validation",
            "details": "Please try again later or contact support"
        }), 500