"""
PDF processing service for ResuMatch AI
"""
import PyPDF2
import io
from typing import Optional, Tuple
from src.validators.file_validator import FileValidator

class PDFProcessor:
    """Handles PDF text extraction and validation"""
    
    @staticmethod
    def extract_text_from_pdf(pdf_file) -> Tuple[bool, str]:
        """
        Extract text from uploaded PDF file
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
            cleaned_text = PDFProcessor._clean_text(text)
            
            return True, cleaned_text
            
        except Exception as e:
            error_msg = str(e)
            if "PDF" in error_msg:
                return False, "Invalid or corrupted PDF file. Please upload a valid PDF resume."
            else:
                return False, f"Error processing PDF: {error_msg}"
    
    @staticmethod
    def _clean_text(text: str) -> str:
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
    
    @staticmethod
    def get_text_stats(text: str) -> dict:
        """Get statistics about extracted text"""
        if not text:
            return {"character_count": 0, "word_count": 0, "line_count": 0}
        
        return {
            "character_count": len(text),
            "word_count": len(text.split()),
            "line_count": len(text.split('\n')),
            "has_contact_info": any(keyword in text.lower() for keyword in ['email', '@', 'phone', 'linkedin']),
            "has_experience": any(keyword in text.lower() for keyword in ['experience', 'work', 'employment', 'job']),
            "has_education": any(keyword in text.lower() for keyword in ['education', 'degree', 'university', 'college']),
            "has_skills": any(keyword in text.lower() for keyword in ['skills', 'technical', 'programming', 'software'])
        }