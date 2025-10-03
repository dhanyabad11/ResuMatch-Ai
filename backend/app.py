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

# Create application instance
app = create_app()

if __name__ == '__main__':
    # Development server
    print("🚀 Starting ResuMatch AI Backend...")
    print("📁 Production-level structure initialized")
    print("🔒 File validation enabled")
    print("🤖 AI analysis service ready")
    print("=" * 50)
    
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=True
    )
