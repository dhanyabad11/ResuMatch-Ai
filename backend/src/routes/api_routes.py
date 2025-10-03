"""
API routes for ResuMatch AI
"""
from flask import Blueprint, request, jsonify
from src.services.pdf_service import PDFProcessor
from src.services.ai_service import AIAnalyzer
from src.validators.file_validator import FileValidator

# Create blueprint for API routes
api_bp = Blueprint('api', __name__)

# Initialize services
pdf_processor = PDFProcessor()
ai_analyzer = AIAnalyzer()

@api_bp.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "message": "ResuMatch AI Backend is running!",
        "status": "healthy",
        "version": "2.0.0"
    })

@api_bp.route('/analyze-resume', methods=['POST'])
def analyze_resume():
    """
    Main endpoint for resume analysis
    Expects: multipart/form-data with 'resume' (PDF file) and optional 'job_description'
    """
    try:
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

@api_bp.route('/extract-text', methods=['POST'])
def extract_text_only():
    """
    Extract text from PDF without analysis
    Useful for debugging or text preview
    """
    try:
        if 'resume' not in request.files:
            return jsonify({
                "error": "No file provided",
                "message": "Please upload a PDF file"
            }), 400
        
        file = request.files['resume']
        
        # Validate file
        is_valid, validation_errors = FileValidator.validate_upload(file)
        if not is_valid:
            return FileValidator.create_error_response(validation_errors)
        
        # Extract text
        success, result = pdf_processor.extract_text_from_pdf(file)
        if not success:
            return jsonify({
                "error": "Text extraction failed",
                "message": result
            }), 400
        
        # Get statistics
        text_stats = pdf_processor.get_text_stats(result)
        
        return jsonify({
            "success": True,
            "text": result,
            "stats": text_stats,
            "file_name": file.filename
        })
        
    except Exception as e:
        print(f"Error in extract_text_only: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "message": "Failed to extract text from file"
        }), 500

@api_bp.route('/validate-file', methods=['POST'])
def validate_file_only():
    """
    Validate uploaded file without processing
    Useful for frontend file validation
    """
    try:
        if 'file' not in request.files:
            return jsonify({
                "valid": False,
                "message": "No file provided"
            }), 400
        
        file = request.files['file']
        
        # Validate file
        is_valid, validation_errors = FileValidator.validate_upload(file)
        
        if is_valid:
            return jsonify({
                "valid": True,
                "message": "File is valid",
                "file_name": file.filename
            })
        else:
            return jsonify({
                "valid": False,
                "errors": validation_errors,
                "message": "File validation failed"
            }), 400
            
    except Exception as e:
        print(f"Error in validate_file_only: {str(e)}")
        return jsonify({
            "valid": False,
            "message": "File validation error"
        }), 500