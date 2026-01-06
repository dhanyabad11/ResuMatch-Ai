"""
LaTeX Editor API Routes
"""
from flask import Blueprint, request, jsonify, send_file
from flask_cors import cross_origin
import io
import logging

logger = logging.getLogger(__name__)

latex_bp = Blueprint('latex', __name__)

# Initialize services
try:
    from src.services.latex_service import LaTeXService, ResumeData
    from src.services.ai_latex_service import AILaTeXService
    latex_service = LaTeXService()
    ai_latex_service = AILaTeXService()
    logger.info("LaTeX and AI LaTeX services initialized")
except Exception as e:
    logger.error(f"Failed to initialize LaTeX service: {e}")
    latex_service = None
    ai_latex_service = None


@latex_bp.route('/validate', methods=['POST'])
@cross_origin()
def validate_latex():
    """
    Validate LaTeX code
    
    Request body:
        - latex_code: string
    
    Returns:
        - is_valid: boolean
        - errors: list of error messages
    """
    try:
        data = request.get_json()
        if not data or 'latex_code' not in data:
            return jsonify({
                "error": "Missing latex_code in request body"
            }), 400
        
        latex_code = data['latex_code']
        
        if latex_service is None:
            return jsonify({"error": "LaTeX service unavailable"}), 500
        
        is_valid, errors = latex_service.validate_latex(latex_code)
        
        return jsonify({
            "is_valid": is_valid,
            "errors": errors
        })
        
    except Exception as e:
        logger.error(f"Validation error: {e}")
        return jsonify({"error": str(e)}), 500


@latex_bp.route('/compile', methods=['POST'])
@cross_origin()
def compile_latex():
    """
    Compile LaTeX code to PDF
    
    Request body:
        - latex_code: string
    
    Returns:
        - PDF file or error message
    """
    try:
        data = request.get_json()
        if not data or 'latex_code' not in data:
            return jsonify({
                "error": "Missing latex_code in request body"
            }), 400
        
        latex_code = data['latex_code']
        
        if latex_service is None:
            return jsonify({"error": "LaTeX service unavailable"}), 500
        
        success, result = latex_service.compile_to_pdf(latex_code)
        
        if success:
            # Return PDF as downloadable file
            return send_file(
                io.BytesIO(result),
                mimetype='application/pdf',
                as_attachment=True,
                download_name='resume.pdf'
            )
        else:
            return jsonify({
                "error": "Compilation failed",
                "message": result
            }), 400
            
    except Exception as e:
        logger.error(f"Compilation error: {e}")
        return jsonify({"error": str(e)}), 500


@latex_bp.route('/format', methods=['POST'])
@cross_origin()
def format_latex():
    """
    Format LaTeX code
    
    Request body:
        - latex_code: string
    
    Returns:
        - formatted_code: string
    """
    try:
        data = request.get_json()
        if not data or 'latex_code' not in data:
            return jsonify({
                "error": "Missing latex_code in request body"
            }), 400
        
        latex_code = data['latex_code']
        
        if latex_service is None:
            return jsonify({"error": "LaTeX service unavailable"}), 500
        
        formatted = latex_service.format_latex_code(latex_code)
        
        return jsonify({
            "formatted_code": formatted
        })
        
    except Exception as e:
        logger.error(f"Format error: {e}")
        return jsonify({"error": str(e)}), 500


@latex_bp.route('/generate', methods=['POST'])
@cross_origin()
def generate_from_data():
    """
    Generate LaTeX code from structured resume data
    
    Request body:
        - data: Resume data object
        - template: Template name (optional, default: 'modern')
    
    Returns:
        - latex_code: Generated LaTeX code
    """
    try:
        data = request.get_json()
        if not data or 'data' not in data:
            return jsonify({
                "error": "Missing resume data in request body"
            }), 400
        
        resume_data = data['data']
        template_name = data.get('template', 'modern')
        
        if latex_service is None:
            return jsonify({"error": "LaTeX service unavailable"}), 500
        
        # Convert dict to ResumeData
        resume = ResumeData(
            name=resume_data.get('name', ''),
            email=resume_data.get('email', ''),
            phone=resume_data.get('phone', ''),
            location=resume_data.get('location', ''),
            linkedin=resume_data.get('linkedin', ''),
            github=resume_data.get('github', ''),
            website=resume_data.get('website', ''),
            summary=resume_data.get('summary', ''),
            experience=resume_data.get('experience', []),
            education=resume_data.get('education', []),
            skills=resume_data.get('skills', []),
            projects=resume_data.get('projects', []),
            certifications=resume_data.get('certifications', [])
        )
        
        latex_code = latex_service.generate_latex_from_data(resume, template_name)
        
        return jsonify({
            "latex_code": latex_code,
            "template": template_name
        })
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Generation error: {e}")
        return jsonify({"error": str(e)}), 500


@latex_bp.route('/sections', methods=['POST'])
@cross_origin()
def extract_sections():
    """
    Extract sections from LaTeX resume code
    
    Request body:
        - latex_code: string
    
    Returns:
        - sections: list of section objects
    """
    try:
        data = request.get_json()
        if not data or 'latex_code' not in data:
            return jsonify({
                "error": "Missing latex_code in request body"
            }), 400
        
        latex_code = data['latex_code']
        
        if latex_service is None:
            return jsonify({"error": "LaTeX service unavailable"}), 500
        
        sections = latex_service.extract_sections(latex_code)
        
        return jsonify({
            "sections": [
                {"name": s.name, "content": s.content, "order": s.order}
                for s in sections
            ]
        })
        
    except Exception as e:
        logger.error(f"Section extraction error: {e}")
        return jsonify({"error": str(e)}), 500


@latex_bp.route('/starter', methods=['GET'])
@cross_origin()
def get_starter():
    """
    Get starter LaTeX template for new users
    
    Returns:
        - latex_code: Starter template code
    """
    try:
        from src.templates.latex_templates import get_starter_template
        return jsonify({
            "latex_code": get_starter_template()
        })
    except Exception as e:
        logger.error(f"Error getting starter template: {e}")
        return jsonify({"error": str(e)}), 500


# ============================================
# AI-Powered LaTeX Enhancement Endpoints
# ============================================

@latex_bp.route('/ai/improve', methods=['POST'])
@cross_origin()
def ai_improve_resume():
    """
    Use AI to suggest improvements to the resume
    
    Request body:
        - latex_code: string
        - job_description: string (optional)
    
    Returns:
        - suggestions and improved code
    """
    try:
        data = request.get_json()
        if not data or 'latex_code' not in data:
            return jsonify({"error": "Missing latex_code"}), 400
        
        if ai_latex_service is None:
            return jsonify({"error": "AI service unavailable"}), 500
        
        result = ai_latex_service.improve_resume(
            data['latex_code'],
            data.get('job_description', '')
        )
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"AI improve error: {e}")
        return jsonify({"error": str(e)}), 500


@latex_bp.route('/ai/bullets', methods=['POST'])
@cross_origin()
def ai_generate_bullets():
    """
    Generate impactful bullet points for work experience
    
    Request body:
        - role: string
        - company: string
        - responsibilities: string
    
    Returns:
        - bullets: list of strings
    """
    try:
        data = request.get_json()
        required = ['role', 'company', 'responsibilities']
        if not data or not all(k in data for k in required):
            return jsonify({"error": f"Missing required fields: {required}"}), 400
        
        if ai_latex_service is None:
            return jsonify({"error": "AI service unavailable"}), 500
        
        bullets = ai_latex_service.generate_bullet_points(
            data['role'],
            data['company'],
            data['responsibilities']
        )
        
        return jsonify({"bullets": bullets})
        
    except Exception as e:
        logger.error(f"AI bullets error: {e}")
        return jsonify({"error": str(e)}), 500


@latex_bp.route('/ai/ats-check', methods=['POST'])
@cross_origin()
def ai_ats_check():
    """
    Check resume for ATS compatibility
    
    Request body:
        - latex_code: string
    
    Returns:
        - ATS analysis results
    """
    try:
        data = request.get_json()
        if not data or 'latex_code' not in data:
            return jsonify({"error": "Missing latex_code"}), 400
        
        if ai_latex_service is None:
            return jsonify({"error": "AI service unavailable"}), 500
        
        result = ai_latex_service.check_ats_compatibility(data['latex_code'])
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"ATS check error: {e}")
        return jsonify({"error": str(e)}), 500


@latex_bp.route('/ai/suggest-skills', methods=['POST'])
@cross_origin()
def ai_suggest_skills():
    """
    Suggest additional skills based on job description
    
    Request body:
        - current_skills: list of strings
        - job_description: string
    
    Returns:
        - suggested_skills: list of strings
    """
    try:
        data = request.get_json()
        if not data or 'job_description' not in data:
            return jsonify({"error": "Missing job_description"}), 400
        
        if ai_latex_service is None:
            return jsonify({"error": "AI service unavailable"}), 500
        
        skills = ai_latex_service.suggest_skills(
            data.get('current_skills', []),
            data['job_description']
        )
        
        return jsonify({"suggested_skills": skills})
        
    except Exception as e:
        logger.error(f"Skill suggestion error: {e}")
        return jsonify({"error": str(e)}), 500


@latex_bp.route('/ai/improve-section', methods=['POST'])
@cross_origin()
def ai_improve_section():
    """
    Improve a specific section of the resume
    
    Request body:
        - section_name: string
        - section_content: string
    
    Returns:
        - improved_content: string
    """
    try:
        data = request.get_json()
        if not data or 'section_name' not in data or 'section_content' not in data:
            return jsonify({"error": "Missing section_name or section_content"}), 400
        
        if ai_latex_service is None:
            return jsonify({"error": "AI service unavailable"}), 500
        
        improved = ai_latex_service.improve_section(
            data['section_name'],
            data['section_content']
        )
        
        return jsonify({"improved_content": improved})
        
    except Exception as e:
        logger.error(f"Section improvement error: {e}")
        return jsonify({"error": str(e)}), 500
