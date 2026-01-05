"""
Custom exceptions for ResuMatch AI
"""

class ResuMatchError(Exception):
    """Base exception for ResuMatch application"""
    def __init__(self, message: str, status_code: int = 500, details: dict = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}
    
    def to_dict(self) -> dict:
        return {
            "error": self.__class__.__name__,
            "message": self.message,
            "details": self.details
        }


class ValidationError(ResuMatchError):
    """Raised when input validation fails"""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, status_code=400, details=details)


class AIServiceError(ResuMatchError):
    """Raised when AI service encounters an error"""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, status_code=500, details=details)


class PDFProcessingError(ResuMatchError):
    """Raised when PDF processing fails"""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, status_code=400, details=details)


class LaTeXCompilationError(ResuMatchError):
    """Raised when LaTeX compilation fails"""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, status_code=400, details=details)


class TemplateNotFoundError(ResuMatchError):
    """Raised when a template is not found"""
    def __init__(self, template_id: str):
        super().__init__(
            f"Template '{template_id}' not found",
            status_code=404,
            details={"template_id": template_id}
        )
