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

def create_app():
    """Application factory pattern"""
    app = Flask(__name__)

    # Simple CORS configuration
    CORS(app,
         origins=['https://resu-match-ai-three.vercel.app', 'https://*.vercel.app'],
         methods=['GET', 'POST', 'OPTIONS'],
         allow_headers=['Content-Type', 'Authorization'],
         supports_credentials=True)

    # Basic health check route
    @app.route('/')
    def health_check():
        return {
            "message": "ResuMatch AI Backend is running",
            "status": "healthy",
            "version": "1.0.0"
        }

    # Try to import and register API routes
    try:
        from src.routes.api_routes import api_bp
        app.register_blueprint(api_bp)
        print("API routes registered successfully")
    except Exception as e:
        print(f"Warning: Could not load API routes: {e}")
        @app.route('/analyze-resume', methods=['POST'])
        def fallback_analyze():
            return {
                "error": "Service temporarily unavailable",
                "message": "Please try again later"
            }, 503

    return app

# Create app instance
app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            return response
    
    # Add CORS headers to all responses
    @app.after_request
    def after_request(response):
        from flask import request
        origin = request.headers.get('Origin')
        
        # Always allow the specific Vercel domain
        if origin == 'https://resu-match-ai-three.vercel.app':
            response.headers['Access-Control-Allow-Origin'] = origin
        elif origin and any(allowed in origin for allowed in ['vercel.app', 'localhost']):
            response.headers['Access-Control-Allow-Origin'] = origin
        else:
            response.headers['Access-Control-Allow-Origin'] = '*'
            
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Requested-With'
        response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
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