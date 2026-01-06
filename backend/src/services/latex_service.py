"""
LaTeX Resume Service - Handles LaTeX code generation and compilation
"""
import re
import subprocess
import tempfile
import os
import shutil
from typing import Optional, Tuple, Dict, List, Union
from dataclasses import dataclass
from src.core.exceptions import LaTeXCompilationError
import logging

logger = logging.getLogger(__name__)


@dataclass
class ResumeSection:
    """Represents a section in a resume"""
    name: str
    content: str
    order: int = 0


@dataclass
class ResumeData:
    """Structured resume data"""
    name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    github: str = ""
    website: str = ""
    summary: str = ""
    experience: List[Dict] = None
    education: List[Dict] = None
    skills: List[str] = None
    projects: List[Dict] = None
    certifications: List[str] = None
    
    def __post_init__(self):
        self.experience = self.experience or []
        self.education = self.education or []
        self.skills = self.skills or []
        self.projects = self.projects or []
        self.certifications = self.certifications or []


class LaTeXService:
    """Service for LaTeX resume generation and compilation"""
    
    def __init__(self):
        self.latex_available = self._check_latex_installation()
        if not self.latex_available:
            logger.warning("LaTeX (pdflatex) not found. PDF generation will be unavailable.")
    
    def _check_latex_installation(self) -> bool:
        """Check if pdflatex is available on the system"""
        try:
            result = subprocess.run(
                ['pdflatex', '--version'],
                capture_output=True,
                timeout=5
            )
            return result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return False
    
    def validate_latex(self, latex_code: str) -> Tuple[bool, List[str]]:
        """
        Validate LaTeX code for common errors
        
        Args:
            latex_code: The LaTeX source code to validate
            
        Returns:
            Tuple of (is_valid, list of error messages)
        """
        errors = []
        
        # Check for document class
        if not re.search(r'\\documentclass', latex_code):
            errors.append("Missing \\documentclass declaration")
        
        # Check for begin/end document
        if not re.search(r'\\begin\{document\}', latex_code):
            errors.append("Missing \\begin{document}")
        if not re.search(r'\\end\{document\}', latex_code):
            errors.append("Missing \\end{document}")
        
        # Check balanced braces
        open_braces = latex_code.count('{')
        close_braces = latex_code.count('}')
        if open_braces != close_braces:
            errors.append(f"Unbalanced braces: {open_braces} opening, {close_braces} closing")
        
        # Check for common environments
        begin_envs = re.findall(r'\\begin\{(\w+)\}', latex_code)
        end_envs = re.findall(r'\\end\{(\w+)\}', latex_code)
        
        for env in begin_envs:
            if begin_envs.count(env) != end_envs.count(env):
                errors.append(f"Unbalanced environment: {env}")
        
        return len(errors) == 0, errors
    
    def compile_to_pdf(self, latex_code: str) -> Tuple[bool, Union[bytes, str]]:
        """
        Compile LaTeX code to PDF
        
        Args:
            latex_code: The LaTeX source code
            
        Returns:
            Tuple of (success, pdf_bytes or error_message)
        """
        if not self.latex_available:
            return False, "LaTeX compiler (pdflatex) is not available on this system"
        
        # Validate first
        is_valid, errors = self.validate_latex(latex_code)
        if not is_valid:
            return False, f"LaTeX validation failed: {'; '.join(errors)}"
        
        # Create temporary directory for compilation
        temp_dir = tempfile.mkdtemp()
        try:
            tex_file = os.path.join(temp_dir, 'resume.tex')
            pdf_file = os.path.join(temp_dir, 'resume.pdf')
            
            # Write LaTeX source
            with open(tex_file, 'w', encoding='utf-8') as f:
                f.write(latex_code)
            
            # Compile with pdflatex (run twice for references)
            for _ in range(2):
                result = subprocess.run(
                    ['pdflatex', '-interaction=nonstopmode', '-output-directory', temp_dir, tex_file],
                    capture_output=True,
                    timeout=60,
                    cwd=temp_dir
                )
            
            # Check if PDF was generated
            if os.path.exists(pdf_file):
                with open(pdf_file, 'rb') as f:
                    pdf_content = f.read()
                return True, pdf_content
            else:
                # Extract error from log
                log_file = os.path.join(temp_dir, 'resume.log')
                error_msg = "Compilation failed"
                if os.path.exists(log_file):
                    with open(log_file, 'r') as f:
                        log_content = f.read()
                        # Find error lines
                        error_lines = [l for l in log_content.split('\n') if l.startswith('!')]
                        if error_lines:
                            error_msg = error_lines[0]
                return False, error_msg
                
        except subprocess.TimeoutExpired:
            return False, "LaTeX compilation timed out"
        except Exception as e:
            logger.error(f"LaTeX compilation error: {e}")
            return False, str(e)
        finally:
            # Cleanup
            shutil.rmtree(temp_dir, ignore_errors=True)
    
    def generate_latex_from_data(self, data: ResumeData, template: str = 'modern') -> str:
        """
        Generate LaTeX code from structured resume data
        
        Args:
            data: ResumeData object with resume content
            template: Template style to use
            
        Returns:
            Generated LaTeX code
        """
        from src.templates.latex_templates import get_template
        template_generator = get_template(template)
        return template_generator.generate(data)
    
    def format_latex_code(self, latex_code: str) -> str:
        """
        Format and clean LaTeX code
        
        Args:
            latex_code: Raw LaTeX code
            
        Returns:
            Formatted LaTeX code
        """
        # Remove excessive blank lines
        lines = latex_code.split('\n')
        formatted_lines = []
        prev_blank = False
        
        for line in lines:
            is_blank = len(line.strip()) == 0
            if not (is_blank and prev_blank):
                formatted_lines.append(line)
            prev_blank = is_blank
        
        return '\n'.join(formatted_lines)
    
    def extract_sections(self, latex_code: str) -> List[ResumeSection]:
        """
        Extract sections from LaTeX resume code
        
        Args:
            latex_code: The LaTeX source code
            
        Returns:
            List of ResumeSection objects
        """
        sections = []
        # Find section commands
        pattern = r'\\section\*?\{([^}]+)\}(.*?)(?=\\section|\Z)'
        matches = re.findall(pattern, latex_code, re.DOTALL)
        
        for i, (name, content) in enumerate(matches):
            sections.append(ResumeSection(
                name=name.strip(),
                content=content.strip(),
                order=i
            ))
        
        return sections
