"""
Core module - Contains base classes and application factory
"""
from .app_factory import create_app
from .exceptions import ResuMatchError, ValidationError, AIServiceError, PDFProcessingError

__all__ = [
    'create_app',
    'ResuMatchError',
    'ValidationError', 
    'AIServiceError',
    'PDFProcessingError'
]
