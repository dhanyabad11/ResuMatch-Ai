// API configuration and utilities
export const API_CONFIG = {
    baseURL: process.env.NEXT_PUBLIC_API_URL || "",
    endpoints: {
        analyzeResume: "/analyze-resume",
        extractText: "/extract-text",
        healthCheck: "/",
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
        "AI-powered resume analysis to help you stand out from the crowd",
};
