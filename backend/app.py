"""
ResuMatch AI - Production-Level Backend Application
A professional resume analysis service with AI-powered LaTeX resume builder
"""
import sys
import os

# Add src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

# Import application factory
from src.core.app_factory import create_app

# Create application instance
app = create_app()

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 ResuMatch AI Backend v2.0")
    print("=" * 60)
    print("📁 Clean architecture initialized")
    print("🔒 File validation enabled")
    print("🤖 AI analysis service ready")
    print("📝 LaTeX resume builder active")
    print("🎨 Multiple templates available")
    print("=" * 60)
    print("\n📡 API Endpoints:")
    print("   - POST /api/v1/analyze-resume     - Analyze resume")
    print("   - GET  /api/v1/templates          - List templates")
    print("   - POST /api/v1/latex/validate     - Validate LaTeX")
    print("   - POST /api/v1/latex/compile      - Compile to PDF")
    print("   - POST /api/v1/latex/generate     - Generate LaTeX")
    print("   - GET  /api/v1/latex/starter      - Get starter template")
    print("=" * 60)
    
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=True
    )
