"""
LaTeX Templates for Resume Generation
Python 3.9 compatible version - uses string concatenation instead of f-strings with backslashes
"""
from abc import ABC, abstractmethod
from typing import Dict, List
from src.services.latex_service import ResumeData


class BaseTemplate(ABC):
    """Base class for LaTeX resume templates"""
    
    @property
    @abstractmethod
    def name(self) -> str:
        pass
    
    @property
    @abstractmethod
    def description(self) -> str:
        pass
    
    @abstractmethod
    def generate(self, data: ResumeData) -> str:
        pass
    
    def escape_latex(self, text: str) -> str:
        """Escape special LaTeX characters"""
        if not text:
            return ""
        replacements = [
            ('\\', '\\textbackslash{}'),
            ('&', '\\&'),
            ('%', '\\%'),
            ('$', '\\$'),
            ('#', '\\#'),
            ('_', '\\_'),
            ('{', '\\{'),
            ('}', '\\}'),
            ('~', '\\textasciitilde{}'),
            ('^', '\\textasciicircum{}'),
        ]
        for old, new in replacements:
            text = text.replace(old, new)
        return text


class ModernTemplate(BaseTemplate):
    """Modern professional resume template"""
    
    @property
    def name(self) -> str:
        return "modern"
    
    @property
    def description(self) -> str:
        return "A clean, modern resume template with a professional look"
    
    def generate(self, data: ResumeData) -> str:
        header = r'''\documentclass[11pt,a4paper]{article}

% Packages
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage[margin=0.75in]{geometry}
\usepackage{enumitem}
\usepackage{hyperref}
\usepackage{xcolor}
\usepackage{titlesec}

% Colors
\definecolor{primary}{RGB}{0, 79, 144}
\definecolor{secondary}{RGB}{100, 100, 100}

% Section formatting
\titleformat{\section}{\large\bfseries\color{primary}}{}{0em}{}[\titlerule]
\titlespacing{\section}{0pt}{10pt}{5pt}

% Hyperlink setup
\hypersetup{
    colorlinks=true,
    linkcolor=primary,
    urlcolor=primary
}

% Remove paragraph indentation
\setlength{\parindent}{0pt}

\begin{document}

% Header
\begin{center}
'''
        name_line = "    {\\LARGE\\bfseries " + self.escape_latex(data.name) + "}\\\\[5pt]\n"
        contact_line = "    " + self._generate_contact_line(data) + "\n"
        
        middle = r'''\end{center}

'''
        summary = self._generate_summary(data)
        experience = self._generate_experience(data)
        education = self._generate_education(data)
        skills = self._generate_skills(data)
        projects = self._generate_projects(data)
        certifications = self._generate_certifications(data)
        
        footer = r'''
\end{document}
'''
        return header + name_line + contact_line + middle + summary + experience + education + skills + projects + certifications + footer
    
    def _generate_contact_line(self, data: ResumeData) -> str:
        items = []
        if data.email:
            items.append("\\href{mailto:" + data.email + "}{" + self.escape_latex(data.email) + "}")
        if data.phone:
            items.append(self.escape_latex(data.phone))
        if data.location:
            items.append(self.escape_latex(data.location))
        if data.linkedin:
            items.append("\\href{" + data.linkedin + "}{LinkedIn}")
        if data.github:
            items.append("\\href{" + data.github + "}{GitHub}")
        if data.website:
            items.append("\\href{" + data.website + "}{Portfolio}")
        return ' $|$ '.join(items)
    
    def _generate_summary(self, data: ResumeData) -> str:
        if not data.summary:
            return ""
        return "\\section*{Professional Summary}\n" + self.escape_latex(data.summary) + "\n\n"
    
    def _generate_experience(self, data: ResumeData) -> str:
        if not data.experience:
            return ""
        
        items = []
        for exp in data.experience:
            title = self.escape_latex(exp.get('title', ''))
            company = self.escape_latex(exp.get('company', ''))
            location = self.escape_latex(exp.get('location', ''))
            dates = self.escape_latex(exp.get('dates', ''))
            responsibilities = exp.get('responsibilities', [])
            
            resp_items = '\n'.join(["    \\item " + self.escape_latex(r) for r in responsibilities])
            
            item = "\\textbf{" + title + "} \\hfill " + dates + "\\\\\n"
            item += "\\textit{" + company + "} \\hfill " + location + "\n"
            item += "\\begin{itemize}[leftmargin=*,noitemsep]\n"
            item += resp_items + "\n"
            item += "\\end{itemize}\n"
            items.append(item)
        
        return "\\section*{Experience}\n" + ''.join(items) + "\n"
    
    def _generate_education(self, data: ResumeData) -> str:
        if not data.education:
            return ""
        
        items = []
        for edu in data.education:
            degree = self.escape_latex(edu.get('degree', ''))
            institution = self.escape_latex(edu.get('institution', ''))
            dates = self.escape_latex(edu.get('dates', ''))
            gpa = edu.get('gpa', '')
            
            gpa_text = ' (GPA: ' + gpa + ')' if gpa else ''
            item = "\\textbf{" + degree + "}" + gpa_text + " \\hfill " + dates + "\\\\\n"
            item += "\\textit{" + institution + "}\\\\[5pt]\n"
            items.append(item)
        
        return "\\section*{Education}\n" + ''.join(items) + "\n"
    
    def _generate_skills(self, data: ResumeData) -> str:
        if not data.skills:
            return ""
        
        skills_text = ', '.join([self.escape_latex(s) for s in data.skills])
        return "\\section*{Skills}\n" + skills_text + "\n\n"
    
    def _generate_projects(self, data: ResumeData) -> str:
        if not data.projects:
            return ""
        
        items = []
        for proj in data.projects:
            name = self.escape_latex(proj.get('name', ''))
            description = self.escape_latex(proj.get('description', ''))
            tech = proj.get('technologies', [])
            tech_text = " \\textit{(" + ', '.join([self.escape_latex(t) for t in tech]) + ")}" if tech else ""
            
            item = "\\textbf{" + name + "}" + tech_text + ": " + description + "\\\\[3pt]\n"
            items.append(item)
        
        return "\\section*{Projects}\n" + ''.join(items) + "\n"
    
    def _generate_certifications(self, data: ResumeData) -> str:
        if not data.certifications:
            return ""
        
        items = '\n'.join(["\\item " + self.escape_latex(c) for c in data.certifications])
        return "\\section*{Certifications}\n\\begin{itemize}[leftmargin=*,noitemsep]\n" + items + "\n\\end{itemize}\n"


class MinimalTemplate(BaseTemplate):
    """Minimal clean resume template"""
    
    @property
    def name(self) -> str:
        return "minimal"
    
    @property
    def description(self) -> str:
        return "A minimalist resume template with clean typography"
    
    def generate(self, data: ResumeData) -> str:
        header = r'''\documentclass[11pt,a4paper]{article}

\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[margin=1in]{geometry}
\usepackage{enumitem}
\usepackage{hyperref}

\setlength{\parindent}{0pt}
\pagestyle{empty}

\begin{document}

'''
        name_line = "{\\Large\\bfseries " + self.escape_latex(data.name) + "}\\\\[5pt]\n"
        contact_line = self.escape_latex(data.email) + " $\\cdot$ " + self.escape_latex(data.phone)
        if data.location:
            contact_line += " $\\cdot$ " + self.escape_latex(data.location)
        contact_line += "\n\n\\hrule\n\\vspace{10pt}\n\n"
        
        body = self._generate_body(data)
        
        footer = r'''
\end{document}
'''
        return header + name_line + contact_line + body + footer
    
    def _generate_body(self, data: ResumeData) -> str:
        sections = []
        
        if data.summary:
            sections.append("\\textbf{Summary}\\\\[3pt]\n" + self.escape_latex(data.summary) + "\\\\[10pt]")
        
        if data.experience:
            exp_items = []
            for exp in data.experience:
                title = self.escape_latex(exp.get('title', ''))
                company = self.escape_latex(exp.get('company', ''))
                dates = self.escape_latex(exp.get('dates', ''))
                exp_items.append(title + " at " + company + " \\hfill " + dates)
            sections.append("\\textbf{Experience}\\\\[3pt]\n" + '\\\\[3pt]\n'.join(exp_items) + '\\\\[10pt]')
        
        if data.education:
            edu_items = []
            for edu in data.education:
                degree = self.escape_latex(edu.get('degree', ''))
                institution = self.escape_latex(edu.get('institution', ''))
                dates = self.escape_latex(edu.get('dates', ''))
                edu_items.append(degree + ", " + institution + " \\hfill " + dates)
            sections.append("\\textbf{Education}\\\\[3pt]\n" + '\\\\[3pt]\n'.join(edu_items) + '\\\\[10pt]')
        
        if data.skills:
            skills_text = ', '.join([self.escape_latex(s) for s in data.skills])
            sections.append("\\textbf{Skills}\\\\[3pt]\n" + skills_text)
        
        return '\n\n'.join(sections)


class AcademicTemplate(BaseTemplate):
    """Academic CV template with detailed sections"""
    
    @property
    def name(self) -> str:
        return "academic"
    
    @property
    def description(self) -> str:
        return "A comprehensive academic CV template suitable for research positions"
    
    def generate(self, data: ResumeData) -> str:
        header = r'''\documentclass[11pt,a4paper]{article}

\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[margin=1in]{geometry}
\usepackage{enumitem}
\usepackage{hyperref}
\usepackage{titlesec}

\titleformat{\section}{\large\bfseries}{}{0em}{}[\hrule]
\titlespacing{\section}{0pt}{12pt}{6pt}

\setlength{\parindent}{0pt}
\pagestyle{empty}

\begin{document}

\begin{center}
'''
        name_line = "{\\LARGE\\bfseries " + self.escape_latex(data.name) + "}\\\\[10pt]\n"
        contact = self.escape_latex(data.email) + " $|$ " + self.escape_latex(data.phone)
        if data.location:
            contact += " $|$ " + self.escape_latex(data.location)
        contact_line = contact + "\n\\end{center}\n\n"
        
        sections = self._generate_sections(data)
        
        footer = r'''
\end{document}
'''
        return header + name_line + contact_line + sections + footer
    
    def _generate_sections(self, data: ResumeData) -> str:
        sections = []
        
        if data.education:
            items = []
            for edu in data.education:
                degree = self.escape_latex(edu.get('degree', ''))
                institution = self.escape_latex(edu.get('institution', ''))
                dates = self.escape_latex(edu.get('dates', ''))
                items.append("\\textbf{" + degree + "}\\\\" + institution + " \\hfill " + dates + "\\\\[5pt]")
            sections.append("\\section*{Education}\n" + '\n'.join(items))
        
        if data.experience:
            items = []
            for exp in data.experience:
                title = self.escape_latex(exp.get('title', ''))
                company = self.escape_latex(exp.get('company', ''))
                dates = self.escape_latex(exp.get('dates', ''))
                items.append("\\textbf{" + title + "}, " + company + " \\hfill " + dates + "\\\\[5pt]")
            sections.append("\\section*{Research Experience}\n" + '\n'.join(items))
        
        if data.skills:
            skills_text = ', '.join([self.escape_latex(s) for s in data.skills])
            sections.append("\\section*{Technical Skills}\n" + skills_text)
        
        if data.projects:
            items = []
            for proj in data.projects:
                name = self.escape_latex(proj.get('name', ''))
                desc = self.escape_latex(proj.get('description', ''))
                items.append("\\textbf{" + name + "}: " + desc + "\\\\[3pt]")
            sections.append("\\section*{Publications \\& Projects}\n" + '\n'.join(items))
        
        return '\n\n'.join(sections)


# Template registry
TEMPLATES: Dict[str, BaseTemplate] = {
    'modern': ModernTemplate(),
    'minimal': MinimalTemplate(),
    'academic': AcademicTemplate(),
}


def get_template(template_name: str) -> BaseTemplate:
    """Get a template by name"""
    template = TEMPLATES.get(template_name)
    if not template:
        raise ValueError("Template '" + template_name + "' not found. Available: " + str(list(TEMPLATES.keys())))
    return template


def get_all_templates() -> List[Dict]:
    """Get list of all available templates"""
    return [
        {
            "id": t.name,
            "name": t.name.title(),
            "description": t.description
        }
        for t in TEMPLATES.values()
    ]


def get_starter_template() -> str:
    """Get a starter LaTeX template for users to begin editing"""
    return r'''\documentclass[11pt,a4paper]{article}

% Packages
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[margin=0.75in]{geometry}
\usepackage{enumitem}
\usepackage{hyperref}
\usepackage{xcolor}
\usepackage{titlesec}

% Colors
\definecolor{primary}{RGB}{0, 79, 144}

% Section formatting
\titleformat{\section}{\large\bfseries\color{primary}}{}{0em}{}[\titlerule]
\titlespacing{\section}{0pt}{10pt}{5pt}

\setlength{\parindent}{0pt}
\pagestyle{empty}

\begin{document}

% =============================================
% HEADER - Your Name and Contact Information
% =============================================
\begin{center}
    {\LARGE\bfseries Your Name}\\[5pt]
    \href{mailto:your.email@example.com}{your.email@example.com} $|$ 
    (123) 456-7890 $|$ 
    City, State $|$
    \href{https://linkedin.com/in/yourprofile}{LinkedIn} $|$
    \href{https://github.com/yourusername}{GitHub}
\end{center}

% =============================================
% PROFESSIONAL SUMMARY
% =============================================
\section*{Professional Summary}
Experienced professional with expertise in [your field]. Strong background in [key skills]. 
Passionate about [your interests/goals].

% =============================================
% EXPERIENCE
% =============================================
\section*{Experience}

\textbf{Job Title} \hfill Month Year -- Present\\
\textit{Company Name} \hfill City, State
\begin{itemize}[leftmargin=*,noitemsep]
    \item Accomplished X by implementing Y, resulting in Z
    \item Led team of N people to deliver project ahead of schedule
    \item Improved process efficiency by X\% through automation
\end{itemize}

\textbf{Previous Job Title} \hfill Month Year -- Month Year\\
\textit{Previous Company} \hfill City, State
\begin{itemize}[leftmargin=*,noitemsep]
    \item Developed and maintained key features
    \item Collaborated with cross-functional teams
\end{itemize}

% =============================================
% EDUCATION
% =============================================
\section*{Education}

\textbf{Degree Name} \hfill Year\\
\textit{University Name} \hfill City, State\\
Relevant coursework: Course 1, Course 2, Course 3

% =============================================
% SKILLS
% =============================================
\section*{Skills}

\textbf{Programming:} Python, JavaScript, TypeScript, Java\\
\textbf{Frameworks:} React, Node.js, Flask, Django\\
\textbf{Tools:} Git, Docker, AWS, Linux

% =============================================
% PROJECTS
% =============================================
\section*{Projects}

\textbf{Project Name} \textit{(Python, React)}\\
Description of the project and its impact.

\textbf{Another Project} \textit{(TypeScript, Node.js)}\\
Description of this project.

\end{document}
'''
