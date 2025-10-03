"""
File validation utilities for ResuMatch AI
"""
import os
from werkzeug.utils import secure_filename
from flask import jsonify

# Try to import magic, with fallback if not available
try:
    import magic
    MAGIC_AVAILABLE = True
except ImportError:
    MAGIC_AVAILABLE = False
    print("Warning: python-magic not available. File type validation will be basic.")

class FileValidator:
    """Handles file validation for uploads"""
    
    ALLOWED_EXTENSIONS = {'pdf'}
    ALLOWED_MIME_TYPES = {
        'application/pdf',
        'application/x-pdf',
        'application/acrobat',
        'applications/vnd.pdf',
        'text/pdf',
        'text/x-pdf'
    }
    
    # Resume-related keywords that should be present
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
    def validate_file_type(file_content):
        """Validate file type using python-magic or fallback method"""
        if not MAGIC_AVAILABLE:
            # Basic validation - check PDF header
            return file_content.startswith(b'%PDF-')
        
        try:
            mime_type = magic.from_buffer(file_content, mime=True)
            return mime_type in FileValidator.ALLOWED_MIME_TYPES
        except Exception:
            # Fallback to basic validation if python-magic fails
            return file_content.startswith(b'%PDF-')
    
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
        
        # Check MIME type
        if not FileValidator.validate_file_type(file_content):
            errors.append("Invalid PDF file format")
            return False, errors
        
        return True, []
    
    @staticmethod
    def create_error_response(errors):
        """Create standardized error response"""
        return jsonify({
            "error": "File validation failed",
            "details": errors,
            "message": "Please provide a valid resume in PDF format"
        }), 400