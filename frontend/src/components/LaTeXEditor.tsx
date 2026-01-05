"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import axios from "axios";
import { getApiUrl, API_CONFIG } from "@/lib/config";

interface LaTeXEditorProps {
    initialCode?: string;
    onCodeChange?: (code: string) => void;
}

interface ValidationResult {
    is_valid: boolean;
    errors: string[];
}

interface AIImproveResult {
    overall_score?: number;
    summary?: string;
    suggestions?: Array<{
        section: string;
        issue: string;
        improvement: string;
        priority: string;
    }>;
    improved_sections?: Record<string, string>;
    error?: string;
}

interface ATSCheckResult {
    ats_score?: number;
    issues?: string[];
    recommendations?: string[];
    keyword_analysis?: {
        found_keywords: string[];
        missing_common_keywords: string[];
    };
    error?: string;
}

export default function LaTeXEditor({ initialCode, onCodeChange }: LaTeXEditorProps) {
    const [code, setCode] = useState(initialCode || "");
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isCompiling, setIsCompiling] = useState(false);
    const [isImproving, setIsImproving] = useState(false);
    const [isCheckingATS, setIsCheckingATS] = useState(false);
    const [aiResult, setAiResult] = useState<AIImproveResult | null>(null);
    const [atsResult, setAtsResult] = useState<ATSCheckResult | null>(null);
    const [jobDescription, setJobDescription] = useState("");
    const [showJobInput, setShowJobInput] = useState(false);
    const [activeTab, setActiveTab] = useState<"editor" | "suggestions" | "ats">("editor");
    const [error, setError] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Load starter template on mount if no initial code
    useEffect(() => {
        if (!initialCode && !code) {
            loadStarterTemplate();
        }
    }, []);

    // Debounced validation
    useEffect(() => {
        const timer = setTimeout(() => {
            if (code.length > 50) {
                validateCode();
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [code]);

    const loadStarterTemplate = async () => {
        try {
            const response = await axios.get(getApiUrl(API_CONFIG.endpoints.latexStarter));
            if (response.data?.latex_code) {
                setCode(response.data.latex_code);
                onCodeChange?.(response.data.latex_code);
            }
        } catch (err) {
            console.error("Failed to load starter template:", err);
        }
    };

    const validateCode = async () => {
        if (!code.trim()) return;
        setIsValidating(true);
        try {
            const response = await axios.post(getApiUrl(API_CONFIG.endpoints.latexValidate), {
                latex_code: code,
            });
            setValidation(response.data);
        } catch (err) {
            console.error("Validation error:", err);
        } finally {
            setIsValidating(false);
        }
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newCode = e.target.value;
        setCode(newCode);
        onCodeChange?.(newCode);
    };

    const formatCode = async () => {
        try {
            const response = await axios.post(getApiUrl(API_CONFIG.endpoints.latexFormat), {
                latex_code: code,
            });
            if (response.data?.formatted_code) {
                setCode(response.data.formatted_code);
                onCodeChange?.(response.data.formatted_code);
            }
        } catch (err) {
            setError("Failed to format code");
        }
    };

    const compileToPDF = async () => {
        setIsCompiling(true);
        setError("");
        try {
            const response = await axios.post(
                getApiUrl(API_CONFIG.endpoints.latexCompile),
                { latex_code: code },
                { responseType: "blob" }
            );

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "resume.pdf");
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.data) {
                // Response might be JSON with error message
                const text = await err.response.data.text();
                try {
                    const json = JSON.parse(text);
                    setError(json.message || json.error || "Compilation failed");
                } catch {
                    setError("LaTeX compilation failed. Check your code for errors.");
                }
            } else {
                setError("Failed to compile PDF");
            }
        } finally {
            setIsCompiling(false);
        }
    };

    const improveWithAI = async () => {
        setIsImproving(true);
        setError("");
        setAiResult(null);
        try {
            const response = await axios.post(getApiUrl(API_CONFIG.endpoints.aiImprove), {
                latex_code: code,
                job_description: jobDescription,
            });
            setAiResult(response.data);
            setActiveTab("suggestions");
        } catch (err) {
            setError("AI improvement failed");
        } finally {
            setIsImproving(false);
        }
    };

    const checkATS = async () => {
        setIsCheckingATS(true);
        setError("");
        setAtsResult(null);
        try {
            const response = await axios.post(getApiUrl(API_CONFIG.endpoints.aiAtsCheck), {
                latex_code: code,
            });
            setAtsResult(response.data);
            setActiveTab("ats");
        } catch (err) {
            setError("ATS check failed");
        } finally {
            setIsCheckingATS(false);
        }
    };

    const insertAtCursor = (text: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newCode = code.substring(0, start) + text + code.substring(end);
        setCode(newCode);
        onCodeChange?.(newCode);

        // Restore cursor position
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + text.length, start + text.length);
        }, 0);
    };

    const applyImprovedSection = (sectionName: string, improvedCode: string) => {
        // Simple replacement - in real implementation would be more sophisticated
        insertAtCursor(improvedCode);
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            {/* Crystal Clear Toolbar */}
            <div className="flex items-center justify-between p-4 bg-slate-800/80 backdrop-blur-sm border-b border-white/10">
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadStarterTemplate}
                        className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-all font-medium flex items-center gap-2 border border-white/5"
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
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                        </svg>
                        New
                    </button>
                    <button
                        onClick={formatCode}
                        className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-all font-medium flex items-center gap-2 border border-white/5"
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
                                d="M4 6h16M4 12h16m-7 6h7"
                            />
                        </svg>
                        Format
                    </button>
                    <div className="h-6 w-px bg-white/10 mx-1"></div>
                    <button
                        onClick={compileToPDF}
                        disabled={isCompiling || !validation?.is_valid}
                        className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-lg transition-all font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/25"
                    >
                        {isCompiling ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                                Compiling...
                            </>
                        ) : (
                            <>
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
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                    />
                                </svg>
                                Download PDF
                            </>
                        )}
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {/* Validation Status */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                        {isValidating ? (
                            <span className="text-yellow-400 text-sm flex items-center gap-2">
                                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
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
                                Validating...
                            </span>
                        ) : validation ? (
                            validation.is_valid ? (
                                <span className="text-emerald-400 text-sm flex items-center gap-1.5">
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
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    Valid LaTeX
                                </span>
                            ) : (
                                <span className="text-red-400 text-sm flex items-center gap-1.5">
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
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                    {validation.errors.length} error(s)
                                </span>
                            )
                        ) : (
                            <span className="text-gray-500 text-sm">Ready</span>
                        )}
                    </div>

                    <div className="h-6 w-px bg-white/10"></div>

                    <button
                        onClick={() => setShowJobInput(!showJobInput)}
                        className={`px-4 py-2 text-sm rounded-lg transition-all font-medium flex items-center gap-2 ${
                            showJobInput
                                ? "bg-purple-600 text-white"
                                : "bg-white/10 hover:bg-white/20 border border-white/5"
                        }`}
                    >
                        🎯 Target Job
                    </button>
                    <button
                        onClick={improveWithAI}
                        disabled={isImproving}
                        className="px-4 py-2 text-sm bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:from-gray-600 disabled:to-gray-600 rounded-lg transition-all font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/25"
                    >
                        {isImproving ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                                Analyzing...
                            </>
                        ) : (
                            <>🤖 AI Improve</>
                        )}
                    </button>
                    <button
                        onClick={checkATS}
                        disabled={isCheckingATS}
                        className="px-4 py-2 text-sm bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:from-gray-600 disabled:to-gray-600 rounded-lg transition-all font-semibold flex items-center gap-2 shadow-lg shadow-amber-500/25"
                    >
                        {isCheckingATS ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                                Checking...
                            </>
                        ) : (
                            <>📊 ATS Check</>
                        )}
                    </button>
                </div>
            </div>

            {/* Job Description Input */}
            {showJobInput && (
                <div className="p-4 bg-purple-900/30 border-b border-purple-500/30">
                    <label className="block text-sm text-purple-200 mb-2 font-medium">
                        🎯 Target Job Description
                    </label>
                    <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the job description here for tailored AI suggestions..."
                        className="w-full h-24 p-3 bg-slate-800/80 border border-purple-500/30 rounded-xl text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="p-4 bg-red-900/30 border-b border-red-500/30 text-red-200 text-sm flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <svg
                            className="w-5 h-5 text-red-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    {error}
                </div>
            )}

            {/* Tabs */}
            <div className="flex bg-slate-800/50 border-b border-white/10">
                <button
                    onClick={() => setActiveTab("editor")}
                    className={`px-6 py-3 text-sm font-semibold transition-all relative ${
                        activeTab === "editor" ? "text-white" : "text-gray-400 hover:text-white"
                    }`}
                >
                    <span className="flex items-center gap-2">
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                        </svg>
                        Editor
                    </span>
                    {activeTab === "editor" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("suggestions")}
                    className={`px-6 py-3 text-sm font-semibold transition-all relative ${
                        activeTab === "suggestions"
                            ? "text-white"
                            : "text-gray-400 hover:text-white"
                    }`}
                >
                    <span className="flex items-center gap-2">
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
                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                        </svg>
                        AI Suggestions
                    </span>
                    {aiResult && !aiResult.error && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-emerald-500 rounded-full">
                            New
                        </span>
                    )}
                    {activeTab === "suggestions" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-green-500"></div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("ats")}
                    className={`px-6 py-3 text-sm font-semibold transition-all relative ${
                        activeTab === "ats" ? "text-white" : "text-gray-400 hover:text-white"
                    }`}
                >
                    <span className="flex items-center gap-2">
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
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                        </svg>
                        ATS Score
                    </span>
                    {atsResult && !atsResult.error && (
                        <span
                            className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                (atsResult.ats_score ?? 0) >= 80
                                    ? "bg-emerald-500"
                                    : (atsResult.ats_score ?? 0) >= 60
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                            }`}
                        >
                            {atsResult.ats_score}
                        </span>
                    )}
                    {activeTab === "ats" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500"></div>
                    )}
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
                {activeTab === "editor" && (
                    <div className="h-full flex">
                        {/* LaTeX Snippets Sidebar */}
                        <div className="w-52 bg-slate-800/50 border-r border-white/10 p-3 overflow-y-auto">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                                Quick Insert
                            </h3>
                            <div className="space-y-1">
                                <SnippetButton
                                    label="📑 Section"
                                    onClick={() => insertAtCursor("\\section*{Section Name}\n\n")}
                                />
                                <SnippetButton
                                    label="📋 Item List"
                                    onClick={() =>
                                        insertAtCursor(
                                            "\\begin{itemize}[leftmargin=*,noitemsep]\n    \\item Item 1\n    \\item Item 2\n\\end{itemize}\n"
                                        )
                                    }
                                />
                                <SnippetButton
                                    label="💼 Experience"
                                    onClick={() =>
                                        insertAtCursor(
                                            "\\textbf{Job Title} \\hfill Month Year -- Present\\\\\n\\textit{Company Name} \\hfill City, State\n\\begin{itemize}[leftmargin=*,noitemsep]\n    \\item Accomplished X by Y, resulting in Z\n\\end{itemize}\n\n"
                                        )
                                    }
                                />
                                <SnippetButton
                                    label="🎓 Education"
                                    onClick={() =>
                                        insertAtCursor(
                                            "\\textbf{Degree Name} \\hfill Year\\\\\n\\textit{University Name} \\hfill City, State\n\n"
                                        )
                                    }
                                />
                                <SnippetButton
                                    label="🚀 Project"
                                    onClick={() =>
                                        insertAtCursor(
                                            "\\textbf{Project Name} \\textit{(Tech Stack)}\\\\\nDescription of the project and its impact.\n\n"
                                        )
                                    }
                                />
                                <div className="h-px bg-white/10 my-2"></div>
                                <SnippetButton
                                    label="Bold"
                                    onClick={() => insertAtCursor("\\textbf{}")}
                                />
                                <SnippetButton
                                    label="Italic"
                                    onClick={() => insertAtCursor("\\textit{}")}
                                />
                                <SnippetButton
                                    label="Link"
                                    onClick={() => insertAtCursor("\\href{URL}{Link Text}")}
                                />
                                <SnippetButton
                                    label="Separator |"
                                    onClick={() => insertAtCursor(" $|$ ")}
                                />
                                <SnippetButton
                                    label="Right Align →"
                                    onClick={() => insertAtCursor(" \\hfill ")}
                                />
                            </div>
                        </div>

                        {/* Code Editor */}
                        <div className="flex-1 relative bg-slate-950">
                            <textarea
                                ref={textareaRef}
                                value={code}
                                onChange={handleCodeChange}
                                spellCheck={false}
                                className="w-full h-full p-5 bg-transparent text-gray-100 font-mono text-sm leading-relaxed resize-none focus:outline-none selection:bg-indigo-500/30"
                                placeholder="Start typing your LaTeX code here..."
                            />
                        </div>
                    </div>
                )}

                {activeTab === "suggestions" && (
                    <div className="h-full overflow-y-auto p-6 bg-slate-800/30">
                        {!aiResult ? (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                                    <span className="text-4xl">🤖</span>
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    AI Resume Improvement
                                </h3>
                                <p className="text-gray-400 max-w-md mx-auto">
                                    Click &quot;AI Improve&quot; to get personalized suggestions for
                                    your resume
                                </p>
                            </div>
                        ) : aiResult.error ? (
                            <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-5">
                                <p className="text-red-300">{aiResult.error}</p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {/* Overall Score */}
                                {aiResult.overall_score !== undefined && (
                                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-semibold text-lg">Overall Score</h3>
                                            <div
                                                className={`text-3xl font-bold ${
                                                    aiResult.overall_score >= 80
                                                        ? "text-emerald-400"
                                                        : aiResult.overall_score >= 60
                                                        ? "text-amber-400"
                                                        : "text-red-400"
                                                }`}
                                            >
                                                {aiResult.overall_score}
                                                <span className="text-lg text-gray-500">/100</span>
                                            </div>
                                        </div>
                                        {aiResult.summary && (
                                            <p className="text-gray-300 text-sm leading-relaxed">
                                                {aiResult.summary}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Suggestions */}
                                {aiResult.suggestions && aiResult.suggestions.length > 0 && (
                                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                                        <h3 className="font-semibold text-lg mb-4">
                                            Improvement Suggestions
                                        </h3>
                                        <div className="space-y-3">
                                            {aiResult.suggestions.map((suggestion, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`p-4 rounded-xl border-l-4 ${
                                                        suggestion.priority === "high"
                                                            ? "border-red-500 bg-red-500/10"
                                                            : suggestion.priority === "medium"
                                                            ? "border-amber-500 bg-amber-500/10"
                                                            : "border-blue-500 bg-blue-500/10"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-xs uppercase font-bold tracking-wider text-gray-400">
                                                            {suggestion.section}
                                                        </span>
                                                        <span
                                                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                                suggestion.priority === "high"
                                                                    ? "bg-red-500 text-white"
                                                                    : suggestion.priority ===
                                                                      "medium"
                                                                    ? "bg-amber-500 text-white"
                                                                    : "bg-blue-500 text-white"
                                                            }`}
                                                        >
                                                            {suggestion.priority}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-300 mb-2">
                                                        <span className="text-gray-500">
                                                            Issue:
                                                        </span>{" "}
                                                        {suggestion.issue}
                                                    </p>
                                                    <p className="text-sm text-emerald-300">
                                                        <span className="text-emerald-500">
                                                            Fix:
                                                        </span>{" "}
                                                        {suggestion.improvement}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Improved Sections */}
                                {aiResult.improved_sections &&
                                    Object.keys(aiResult.improved_sections).length > 0 && (
                                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                                            <h3 className="font-semibold text-lg mb-4">
                                                Improved Code Snippets
                                            </h3>
                                            <div className="space-y-3">
                                                {Object.entries(aiResult.improved_sections).map(
                                                    ([section, code]) => (
                                                        <div
                                                            key={section}
                                                            className="bg-slate-900/80 rounded-xl p-4 border border-white/5"
                                                        >
                                                            <div className="flex items-center justify-between mb-3">
                                                                <span className="text-sm font-semibold text-white">
                                                                    {section}
                                                                </span>
                                                                <button
                                                                    onClick={() =>
                                                                        applyImprovedSection(
                                                                            section,
                                                                            code
                                                                        )
                                                                    }
                                                                    className="text-xs px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-lg font-medium transition-all"
                                                                >
                                                                    Apply
                                                                </button>
                                                            </div>
                                                            <pre className="text-xs text-gray-400 overflow-x-auto font-mono">
                                                                {code}
                                                            </pre>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "ats" && (
                    <div className="h-full overflow-y-auto p-6 bg-slate-800/30">
                        {!atsResult ? (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                                    <span className="text-4xl">📊</span>
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    ATS Compatibility Check
                                </h3>
                                <p className="text-gray-400 max-w-md mx-auto">
                                    Click &quot;ATS Check&quot; to analyze how well your resume will
                                    perform with Applicant Tracking Systems
                                </p>
                            </div>
                        ) : atsResult.error ? (
                            <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-5">
                                <p className="text-red-300">{atsResult.error}</p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {/* ATS Score */}
                                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 text-center border border-white/10">
                                    <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-3">
                                        ATS Compatibility Score
                                    </h3>
                                    <div className="relative inline-flex items-center justify-center">
                                        <div
                                            className={`text-6xl font-bold ${
                                                (atsResult.ats_score || 0) >= 80
                                                    ? "text-emerald-400"
                                                    : (atsResult.ats_score || 0) >= 60
                                                    ? "text-amber-400"
                                                    : "text-red-400"
                                            }`}
                                        >
                                            {atsResult.ats_score || 0}
                                        </div>
                                    </div>
                                    <p className="text-gray-500 mt-2">out of 100</p>
                                </div>

                                {/* Issues */}
                                {atsResult.issues && atsResult.issues.length > 0 && (
                                    <div className="bg-red-500/10 backdrop-blur-sm rounded-xl p-5 border border-red-500/20">
                                        <h3 className="font-semibold text-lg mb-4 text-red-400 flex items-center gap-2">
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                                />
                                            </svg>
                                            Issues Found
                                        </h3>
                                        <ul className="space-y-2">
                                            {atsResult.issues.map((issue, idx) => (
                                                <li
                                                    key={idx}
                                                    className="text-sm text-gray-300 flex gap-3 items-start"
                                                >
                                                    <span className="text-red-400 mt-1">•</span>
                                                    {issue}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Recommendations */}
                                {atsResult.recommendations &&
                                    atsResult.recommendations.length > 0 && (
                                        <div className="bg-emerald-500/10 backdrop-blur-sm rounded-xl p-5 border border-emerald-500/20">
                                            <h3 className="font-semibold text-lg mb-4 text-emerald-400 flex items-center gap-2">
                                                <svg
                                                    className="w-5 h-5"
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
                                                Recommendations
                                            </h3>
                                            <ul className="space-y-2">
                                                {atsResult.recommendations.map((rec, idx) => (
                                                    <li
                                                        key={idx}
                                                        className="text-sm text-gray-300 flex gap-3 items-start"
                                                    >
                                                        <span className="text-emerald-400 mt-1">
                                                            •
                                                        </span>
                                                        {rec}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                {/* Keyword Analysis */}
                                {atsResult.keyword_analysis && (
                                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                            <span>🔑</span> Keyword Analysis
                                        </h3>
                                        <div className="grid grid-cols-2 gap-5">
                                            <div>
                                                <h4 className="text-sm text-emerald-400 mb-3 font-medium">
                                                    Found Keywords
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {atsResult.keyword_analysis.found_keywords?.map(
                                                        (kw, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-full border border-emerald-500/30"
                                                            >
                                                                {kw}
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-sm text-amber-400 mb-3 font-medium">
                                                    Consider Adding
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {atsResult.keyword_analysis.missing_common_keywords?.map(
                                                        (kw, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs rounded-full border border-amber-500/30 cursor-pointer hover:bg-amber-500/30 transition-colors"
                                                                onClick={() => insertAtCursor(kw)}
                                                                title="Click to insert"
                                                            >
                                                                + {kw}
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper component for snippet buttons
function SnippetButton({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full text-left px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/5 hover:border-white/10"
        >
            {label}
        </button>
    );
}
