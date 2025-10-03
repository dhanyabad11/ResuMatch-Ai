"""
ResuMatch AI - Production-Level Backend Application
A professional resume analysis service using AI
"""
from flask import Flask
from flask_cors import CORS
import sys
import os

# Add src directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.config.settings import get_config
from src.routes.api_routes import api_bp

def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Load configuration
    config = get_config()
    
    # Validate configuration
    try:
        config.validate_config()
    except ValueError as e:
        print(f"Configuration Error: {e}")
        sys.exit(1)
    
    # Configure Flask app
    app.config['MAX_CONTENT_LENGTH'] = config.MAX_CONTENT_LENGTH
    
    # Configure CORS
    CORS(app, 
         origins=config.CORS_ORIGINS,
         methods=['GET', 'POST', 'OPTIONS'],
         allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
         expose_headers=['Content-Type'],
         supports_credentials=True)
    
    # Handle preflight OPTIONS requests explicitly
    @app.before_request
    def handle_preflight():
        from flask import request, jsonify
        if request.method == "OPTIONS":
            response = jsonify({'status': 'ok'})
            response.headers.add("Access-Control-Allow-Origin", request.headers.get('Origin', '*'))
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response
    
    # Register blueprints
    app.register_blueprint(api_bp)
    
    # Error handlers
    @app.errorhandler(413)
    def file_too_large(error):
        return {
            "error": "File too large",
            "message": "File size exceeds 16MB limit. Please upload a smaller resume.",
            "max_size": "16MB"
        }, 413
    
    @app.errorhandler(404)
    def not_found(error):
        return {
            "error": "Endpoint not found",
            "message": "The requested endpoint does not exist",
            "available_endpoints": {
                "GET /": "Health check",
                "POST /analyze-resume": "Analyze resume with AI",
                "POST /extract-text": "Extract text from PDF only",
                "POST /validate-file": "Validate file upload"
            }
        }, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {
            "error": "Internal server error",
            "message": "An unexpected error occurred. Please try again later."
        }, 500
    
    return app

# Create application instance
app = create_app()

if __name__ == '__main__':
    # Development server
    print("🚀 Starting ResuMatch AI Backend...")
    print("📁 Production-level structure initialized")
    print("🔒 File validation enabled")
    print("🤖 AI analysis service ready")
    print("=" * 50)
    
    config = get_config()
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=config.FLASK_DEBUG
    )