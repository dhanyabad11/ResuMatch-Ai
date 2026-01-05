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
            const response = await axios.get(
                getApiUrl(`/api/v1/templates/${templateId}/preview`)
            );
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="bg-black/30 backdrop-blur-sm border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="text-white/70 hover:text-white transition-colors"
                        >
                            ← Back
                        </Link>
                        <h1 className="text-xl font-bold text-white">
                            📝 LaTeX Resume Builder
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowTemplateModal(true)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm"
                        >
                            🎨 Change Template
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4" style={{ height: "calc(100vh - 73px)" }}>
                {showTemplateModal ? (
                    // Template Selection Modal
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Choose a Template
                            </h2>
                            <p className="text-gray-400 mb-6">
                                Select a template to start building your professional resume
                            </p>

                            <div className="grid md:grid-cols-3 gap-4 mb-6">
                                {templates.map((template) => (
                                    <button
                                        key={template.id}
                                        onClick={() => selectTemplate(template.id)}
                                        disabled={isLoading}
                                        className={`p-6 rounded-xl border-2 transition-all text-left ${
                                            selectedTemplate === template.id
                                                ? "border-purple-500 bg-purple-900/30"
                                                : "border-gray-600 hover:border-gray-500 bg-gray-700/50"
                                        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            {template.name}
                                        </h3>
                                        <p className="text-sm text-gray-400">{template.description}</p>
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex-1 border-t border-gray-700"></div>
                                <span className="text-gray-500 text-sm">or</span>
                                <div className="flex-1 border-t border-gray-700"></div>
                            </div>

                            <button
                                onClick={startBlank}
                                disabled={isLoading}
                                className="mt-6 w-full py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <span className="animate-spin">⏳</span>
                                ) : (
                                    <>
                                        📄 Start with Blank Template
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Features Info */}
                        <div className="mt-8 grid md:grid-cols-3 gap-4">
                            <div className="bg-gray-800/50 rounded-xl p-4 border border-white/5">
                                <div className="text-2xl mb-2">🤖</div>
                                <h3 className="font-semibold text-white mb-1">AI-Powered</h3>
                                <p className="text-sm text-gray-400">
                                    Get intelligent suggestions to improve your resume
                                </p>
                            </div>
                            <div className="bg-gray-800/50 rounded-xl p-4 border border-white/5">
                                <div className="text-2xl mb-2">📊</div>
                                <h3 className="font-semibold text-white mb-1">ATS Optimized</h3>
                                <p className="text-sm text-gray-400">
                                    Ensure your resume passes applicant tracking systems
                                </p>
                            </div>
                            <div className="bg-gray-800/50 rounded-xl p-4 border border-white/5">
                                <div className="text-2xl mb-2">📥</div>
                                <h3 className="font-semibold text-white mb-1">PDF Export</h3>
                                <p className="text-sm text-gray-400">
                                    Download professional PDF ready for applications
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    // LaTeX Editor
                    <div className="h-full">
                        <LaTeXEditor initialCode={initialCode} />
                    </div>
                )}
            </main>
        </div>
    );
}
