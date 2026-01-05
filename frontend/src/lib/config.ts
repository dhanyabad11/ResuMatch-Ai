// API configuration and utilities
export const API_CONFIG = {
    baseURL: process.env.NEXT_PUBLIC_API_URL || "",
    headers: {
        "Content-Type": "application/json",
    },
    endpoints: {
        // Resume Analysis
        analyzeResume: "/api/v1/analyze-resume",
        extractText: "/api/v1/extract-text",
        healthCheck: "/",
        
        // LaTeX Editor
        latexValidate: "/api/v1/latex/validate",
        latexCompile: "/api/v1/latex/compile",
        latexFormat: "/api/v1/latex/format",
        latexGenerate: "/api/v1/latex/generate",
        latexSections: "/api/v1/latex/sections",
        latexStarter: "/api/v1/latex/starter",
        
        // AI LaTeX Enhancement
        aiImprove: "/api/v1/latex/ai/improve",
        aiBullets: "/api/v1/latex/ai/bullets",
        aiAtsCheck: "/api/v1/latex/ai/ats-check",
        aiSuggestSkills: "/api/v1/latex/ai/suggest-skills",
        aiImproveSection: "/api/v1/latex/ai/improve-section",
        
        // Templates
        templates: "/api/v1/templates",
        templatePreview: "/api/v1/templates/{id}/preview",
    },
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
    return `${API_CONFIG.baseURL}${endpoint}`;
};

// App configuration
export const APP_CONFIG = {
    name: process.env.NEXT_PUBLIC_APP_NAME || "ResuMatch AI",
    description:
        process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
        "AI-powered resume analysis and LaTeX resume builder",
    features: [
        "Resume Analysis",
        "LaTeX Editor",
        "AI Suggestions",
        "ATS Optimization",
        "Multiple Templates"
    ]
};
