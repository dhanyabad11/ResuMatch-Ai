#!/usr/bin/env python3
import sys
sys.path.insert(0, '/Users/dhanyabad/code2/ResuMatch-Ai/backend')

from src.services.ai_service import AIAnalyzer

# Test the AI service
analyzer = AIAnalyzer()
print("AI Analyzer initialized successfully")

test_resume = """
John Doe
Software Engineer

EXPERIENCE:
- 5 years of Python development
- Built web applications using Flask
"""

print("Testing analysis...")
result = analyzer.analyze_resume(test_resume, "")
print(f"Result type: {type(result)}")
print(f"Result: {result}")
