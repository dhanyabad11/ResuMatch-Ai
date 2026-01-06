"""
Application factory for ResuMatch AI
"""
from flask import Flask, jsonify
from flask_cors import CORS
import logging
from .exceptions import ResuMatchError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_app(config_name: str = 'development') -> Flask:
    """
    Application factory pattern for Flask app creation
    
    Args:
        config_name: Configuration environment ('development', 'production')
        
    Returns:
        Configured Flask application instance
    """
    app = Flask(__name__)
    
    # Load configuration
    from src.config.settings import get_config
    config = get_config()
    app.config.from_object(config)
    
    # Configure CORS
    CORS(app,
         origins=config.CORS_ORIGINS,
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
         allow_headers=['Content-Type', 'Authorization'],
         supports_credentials=True)
    
    # Register error handlers
    register_error_handlers(app)
    
    # Register blueprints
    register_blueprints(app)
    
    # Health check route
    @app.route('/')
    def health_check():
        return jsonify({
            "message": "ResuMatch AI Backend is running",
            "status": "healthy",
            "version": "2.0.0",
            "features": ["resume-analysis", "latex-editor", "ai-suggestions"]
        })
    
    logger.info("🚀 ResuMatch AI application created successfully")
    return app


def register_error_handlers(app: Flask):
    """Register custom error handlers"""
    
    @app.errorhandler(ResuMatchError)
    def handle_resumatch_error(error):
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response
    
    @app.errorhandler(404)
    def handle_not_found(error):
        return jsonify({
            "error": "NotFound",
            "message": "The requested resource was not found"
        }), 404
    
    @app.errorhandler(500)
    def handle_internal_error(error):
        logger.error(f"Internal server error: {error}")
        return jsonify({
            "error": "InternalServerError",
            "message": "An unexpected error occurred"
        }), 500


def register_blueprints(app: Flask):
    """Register all application blueprints"""
    try:
        # Resume analysis routes
        from src.routes.api_routes import api_bp
        app.register_blueprint(api_bp, url_prefix='/api/v1')
        
        # LaTeX editor routes
        from src.routes.latex_routes import latex_bp
        app.register_blueprint(latex_bp, url_prefix='/api/v1/latex')
        
        # Template routes
        from src.routes.template_routes import template_bp
        app.register_blueprint(template_bp, url_prefix='/api/v1/templates')
        
        logger.info("✅ All blueprints registered successfully")
        
    except ImportError as e:
        logger.error(f"Failed to import blueprints: {e}")
        raise
