"""
Template API Routes
"""
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import logging

logger = logging.getLogger(__name__)

template_bp = Blueprint('templates', __name__)


@template_bp.route('/', methods=['GET'])
@cross_origin()
def list_templates():
    """
    List all available LaTeX resume templates
    
    Returns:
        - templates: list of template objects with id, name, description
    """
    try:
        from src.templates.latex_templates import get_all_templates
        templates = get_all_templates()
        
        return jsonify({
            "templates": templates,
            "count": len(templates)
        })
        
    except Exception as e:
        logger.error(f"Error listing templates: {e}")
        return jsonify({"error": str(e)}), 500


@template_bp.route('/<template_id>', methods=['GET'])
@cross_origin()
def get_template_info(template_id: str):
    """
    Get information about a specific template
    
    Path params:
        - template_id: Template identifier
    
    Returns:
        - template: Template object with details
    """
    try:
        from src.templates.latex_templates import get_template
        template = get_template(template_id)
        
        return jsonify({
            "id": template.name,
            "name": template.name.title(),
            "description": template.description
        })
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        logger.error(f"Error getting template: {e}")
        return jsonify({"error": str(e)}), 500


@template_bp.route('/<template_id>/preview', methods=['GET'])
@cross_origin()
def preview_template(template_id: str):
    """
    Get a preview of the template with sample data
    
    Path params:
        - template_id: Template identifier
    
    Returns:
        - latex_code: Preview LaTeX code
        - template: Template info
    """
    try:
        from src.templates.latex_templates import get_template
        from src.services.latex_service import ResumeData
        
        template = get_template(template_id)
        
        # Sample data for preview
        sample_data = ResumeData(
            name="John Doe",
            email="john.doe@example.com",
            phone="(555) 123-4567",
            location="San Francisco, CA",
            linkedin="https://linkedin.com/in/johndoe",
            github="https://github.com/johndoe",
            summary="Experienced software engineer with 5+ years of expertise in full-stack development.",
            experience=[
                {
                    "title": "Senior Software Engineer",
                    "company": "Tech Company Inc.",
                    "location": "San Francisco, CA",
                    "dates": "2022 - Present",
                    "responsibilities": [
                        "Led development of microservices architecture",
                        "Mentored junior developers",
                        "Improved system performance by 40%"
                    ]
                },
                {
                    "title": "Software Engineer",
                    "company": "Startup Co.",
                    "location": "New York, NY",
                    "dates": "2019 - 2022",
                    "responsibilities": [
                        "Developed RESTful APIs",
                        "Built React frontend applications"
                    ]
                }
            ],
            education=[
                {
                    "degree": "B.S. Computer Science",
                    "institution": "University of California, Berkeley",
                    "dates": "2015 - 2019",
                    "gpa": "3.8"
                }
            ],
            skills=["Python", "JavaScript", "React", "Node.js", "AWS", "Docker", "PostgreSQL"],
            projects=[
                {
                    "name": "Open Source Project",
                    "description": "Contributed to popular open source framework",
                    "technologies": ["Python", "FastAPI"]
                }
            ],
            certifications=["AWS Certified Solutions Architect", "Google Cloud Professional"]
        )
        
        latex_code = template.generate(sample_data)
        
        return jsonify({
            "latex_code": latex_code,
            "template": {
                "id": template.name,
                "name": template.name.title(),
                "description": template.description
            }
        })
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        logger.error(f"Error previewing template: {e}")
        return jsonify({"error": str(e)}), 500
