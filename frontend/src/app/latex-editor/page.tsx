"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { getApiUrl, API_CONFIG } from "@/lib/config";
import LaTeXEditor from "@/components/LaTeXEditor";
import Link from "next/link";

interface Template {
    id: string;
    name: string;
    description: string;
}

export default function LatexEditorPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [showTemplateModal, setShowTemplateModal] = useState(true);
    const [initialCode, setInitialCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const response = await axios.get(getApiUrl(API_CONFIG.endpoints.templates));
            if (response.data?.templates) {
                setTemplates(response.data.templates);
            }
        } catch (err) {
            console.error("Failed to load templates:", err);
        }
    };

    const selectTemplate = async (templateId: string) => {
        setIsLoading(true);
        try {
            const response = await axios.get(getApiUrl(`/api/v1/templates/${templateId}/preview`));
            if (response.data?.latex_code) {
                setInitialCode(response.data.latex_code);
                setSelectedTemplate(templateId);
                setShowTemplateModal(false);
            }
        } catch (err) {
            console.error("Failed to load template preview:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const startBlank = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(getApiUrl(API_CONFIG.endpoints.latexStarter));
            if (response.data?.latex_code) {
                setInitialCode(response.data.latex_code);
                setShowTemplateModal(false);
            }
        } catch (err) {
            console.error("Failed to load starter template:", err);
            // Fallback to empty
            setInitialCode("");
            setShowTemplateModal(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
            {/* Crystal Clear Header */}
            <header className="fixed top-0 left-0 right-0 z-50">
                <div className="mx-4 mt-4">
                    <div className="glass-dark shadow-glass-lg rounded-2xl max-w-7xl mx-auto">
                        <div className="px-6 h-16 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/"
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M15 19l-7-7 7-7"
                                        />
                                    </svg>
                                    Back
                                </Link>
                                <div className="h-6 w-px bg-white/20"></div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                        <span className="text-white font-bold text-sm">📝</span>
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold text-white">
                                            LaTeX Resume Builder
                                        </h1>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowTemplateModal(true)}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all text-sm font-medium border border-white/10"
                                >
                                    🎨 Templates
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-24 px-4 pb-4" style={{ height: "100vh" }}>
                {showTemplateModal ? (
                    // Template Selection Modal
                    <div className="max-w-4xl mx-auto pt-8 animate-in">
                        <div className="glass-dark shadow-glass-lg rounded-3xl p-8 border border-white/10">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-medium mb-4">
                                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                                    Professional Templates
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-2">
                                    Choose Your Template
                                </h2>
                                <p className="text-gray-400">
                                    Select a professionally designed template to get started
                                </p>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4 mb-8">
                                {templates.map((template) => (
                                    <button
                                        key={template.id}
                                        onClick={() => selectTemplate(template.id)}
                                        disabled={isLoading}
                                        className={`group p-6 rounded-2xl border-2 transition-all text-left relative overflow-hidden ${
                                            selectedTemplate === template.id
                                                ? "border-indigo-500 bg-indigo-500/20"
                                                : "border-white/10 hover:border-indigo-500/50 bg-white/5 hover:bg-white/10"
                                        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        <div className="relative z-10">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <span className="text-white text-xl">
                                                    {template.id === "modern"
                                                        ? "✨"
                                                        : template.id === "minimal"
                                                        ? "◽"
                                                        : "📚"}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-white mb-2">
                                                {template.name}
                                            </h3>
                                            <p className="text-sm text-gray-400">
                                                {template.description}
                                            </p>
                                        </div>
                                        {selectedTemplate === template.id && (
                                            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                                                <svg
                                                    className="w-4 h-4 text-white"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M5 13l4 4L19 7"
                                                    />
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex-1 border-t border-white/10"></div>
                                <span className="text-gray-500 text-sm">or start fresh</span>
                                <div className="flex-1 border-t border-white/10"></div>
                            </div>

                            <button
                                onClick={startBlank}
                                disabled={isLoading}
                                className="w-full py-4 bg-white/10 hover:bg-white/15 text-white rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10 font-medium"
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                fill="none"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                            />
                                        </svg>
                                        Loading...
                                    </span>
                                ) : (
                                    <>📄 Start with Blank Template</>
                                )}
                            </button>
                        </div>

                        {/* Features Info */}
                        <div className="mt-8 grid md:grid-cols-3 gap-4">
                            <div className="glass-dark shadow-glass rounded-2xl p-5 border border-white/5">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-3">
                                    <span className="text-2xl">🤖</span>
                                </div>
                                <h3 className="font-semibold text-white mb-1">AI-Powered</h3>
                                <p className="text-sm text-gray-400">
                                    Get intelligent suggestions to improve your resume content
                                </p>
                            </div>
                            <div className="glass-dark shadow-glass rounded-2xl p-5 border border-white/5">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-3">
                                    <span className="text-2xl">📊</span>
                                </div>
                                <h3 className="font-semibold text-white mb-1">ATS Optimized</h3>
                                <p className="text-sm text-gray-400">
                                    Ensure your resume passes applicant tracking systems
                                </p>
                            </div>
                            <div className="glass-dark shadow-glass rounded-2xl p-5 border border-white/5">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mb-3">
                                    <span className="text-2xl">📥</span>
                                </div>
                                <h3 className="font-semibold text-white mb-1">PDF Export</h3>
                                <p className="text-sm text-gray-400">
                                    Download professional PDF ready for applications
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    // LaTeX Editor
                    <div className="h-full pt-2">
                        <LaTeXEditor initialCode={initialCode} />
                    </div>
                )}
            </main>
        </div>
    );
}
