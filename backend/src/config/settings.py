"""
Configuration settings for ResuMatch AI Backend
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Base configuration class"""
    
    # API Configuration
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    
    # Flask Configuration
    FLASK_ENV = os.getenv('FLASK_ENV', 'production')
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    # File Upload Configuration
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    ALLOWED_EXTENSIONS = {'pdf'}
    
    # CORS Configuration
    CORS_ORIGINS = [
        'https://resu-match-ai-three.vercel.app',
        'http://localhost:3000',
        'http://localhost:3001'
    ]
    
    # Gemini API Configuration
    GENERATION_CONFIG = {
        "temperature": 0.3,
        "top_p": 0.8,
        "top_k": 40,
        "max_output_tokens": 8192,
    }
    
    # Analysis Configuration
    MAX_RETRIES = 3
    RESUME_TEXT_LIMIT = 4000
    JOB_DESCRIPTION_LIMIT = 1500
    
    @classmethod
    def validate_config(cls):
        """Validate required configuration"""
        if not cls.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        return True

class DevelopmentConfig(Config):
    """Development configuration"""
    FLASK_DEBUG = True
    CORS_ORIGINS = ['*']  # Allow all origins in development

class ProductionConfig(Config):
    """Production configuration"""
    FLASK_DEBUG = False

# Configuration factory
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Get configuration based on environment"""
    env = os.getenv('FLASK_ENV', 'development')
    return config.get(env, config['default'])