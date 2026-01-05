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
        <div className="flex flex-col h-full bg-gray-900 text-white rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadStarterTemplate}
                        className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                    >
                        📄 New
                    </button>
                    <button
                        onClick={formatCode}
                        className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                    >
                        ✨ Format
                    </button>
                    <button
                        onClick={compileToPDF}
                        disabled={isCompiling || !validation?.is_valid}
                        className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors flex items-center gap-1"
                    >
                        {isCompiling ? (
                            <>
                                <span className="animate-spin">⏳</span> Compiling...
                            </>
                        ) : (
                            <>📥 Download PDF</>
                        )}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {/* Validation Status */}
                    <div className="flex items-center gap-2">
                        {isValidating ? (
                            <span className="text-yellow-400 text-sm">Validating...</span>
                        ) : validation ? (
                            validation.is_valid ? (
                                <span className="text-green-400 text-sm flex items-center gap-1">
                                    ✓ Valid LaTeX
                                </span>
                            ) : (
                                <span className="text-red-400 text-sm flex items-center gap-1">
                                    ✗ {validation.errors.length} error(s)
                                </span>
                            )
                        ) : null}
                    </div>

                    <button
                        onClick={() => setShowJobInput(!showJobInput)}
                        className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-500 rounded transition-colors"
                    >
                        🎯 Target Job
                    </button>
                    <button
                        onClick={improveWithAI}
                        disabled={isImproving}
                        className="px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 rounded transition-colors flex items-center gap-1"
                    >
                        {isImproving ? (
                            <>
                                <span className="animate-spin">🤖</span> Analyzing...
                            </>
                        ) : (
                            <>🤖 AI Improve</>
                        )}
                    </button>
                    <button
                        onClick={checkATS}
                        disabled={isCheckingATS}
                        className="px-3 py-1.5 text-sm bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 rounded transition-colors flex items-center gap-1"
                    >
                        {isCheckingATS ? (
                            <>
                                <span className="animate-spin">📊</span> Checking...
                            </>
                        ) : (
                            <>📊 ATS Check</>
                        )}
                    </button>
                </div>
            </div>

            {/* Job Description Input */}
            {showJobInput && (
                <div className="p-3 bg-gray-800 border-b border-gray-700">
                    <label className="block text-sm text-gray-400 mb-1">
                        Target Job Description (optional - for better AI suggestions)
                    </label>
                    <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the job description here for tailored improvement suggestions..."
                        className="w-full h-24 p-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500"
                    />
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="p-3 bg-red-900/50 border-b border-red-700 text-red-200 text-sm">
                    ⚠️ {error}
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-gray-700">
                <button
                    onClick={() => setActiveTab("editor")}
                    className={`px-4 py-2 text-sm font-medium ${
                        activeTab === "editor"
                            ? "bg-gray-800 text-white border-b-2 border-blue-500"
                            : "text-gray-400 hover:text-white"
                    }`}
                >
                    📝 Editor
                </button>
                <button
                    onClick={() => setActiveTab("suggestions")}
                    className={`px-4 py-2 text-sm font-medium ${
                        activeTab === "suggestions"
                            ? "bg-gray-800 text-white border-b-2 border-emerald-500"
                            : "text-gray-400 hover:text-white"
                    }`}
                >
                    💡 AI Suggestions
                    {aiResult && !aiResult.error && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-emerald-600 rounded-full">
                            New
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("ats")}
                    className={`px-4 py-2 text-sm font-medium ${
                        activeTab === "ats"
                            ? "bg-gray-800 text-white border-b-2 border-amber-500"
                            : "text-gray-400 hover:text-white"
                    }`}
                >
                    📊 ATS Analysis
                    {atsResult && !atsResult.error && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-600 rounded-full">
                            {atsResult.ats_score}
                        </span>
                    )}
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
                {activeTab === "editor" && (
                    <div className="h-full flex">
                        {/* LaTeX Snippets Sidebar */}
                        <div className="w-48 bg-gray-800 border-r border-gray-700 p-2 overflow-y-auto">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                                Quick Insert
                            </h3>
                            <div className="space-y-1">
                                <SnippetButton
                                    label="Section"
                                    onClick={() => insertAtCursor("\\section*{Section Name}\n\n")}
                                />
                                <SnippetButton
                                    label="Item List"
                                    onClick={() =>
                                        insertAtCursor(
                                            "\\begin{itemize}[leftmargin=*,noitemsep]\n    \\item Item 1\n    \\item Item 2\n\\end{itemize}\n"
                                        )
                                    }
                                />
                                <SnippetButton
                                    label="Experience"
                                    onClick={() =>
                                        insertAtCursor(
                                            "\\textbf{Job Title} \\hfill Month Year -- Present\\\\\n\\textit{Company Name} \\hfill City, State\n\\begin{itemize}[leftmargin=*,noitemsep]\n    \\item Accomplished X by Y, resulting in Z\n\\end{itemize}\n\n"
                                        )
                                    }
                                />
                                <SnippetButton
                                    label="Education"
                                    onClick={() =>
                                        insertAtCursor(
                                            "\\textbf{Degree Name} \\hfill Year\\\\\n\\textit{University Name} \\hfill City, State\n\n"
                                        )
                                    }
                                />
                                <SnippetButton
                                    label="Project"
                                    onClick={() =>
                                        insertAtCursor(
                                            "\\textbf{Project Name} \\textit{(Tech Stack)}\\\\\nDescription of the project and its impact.\n\n"
                                        )
                                    }
                                />
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
                                    label="Separator"
                                    onClick={() => insertAtCursor(" $|$ ")}
                                />
                                <SnippetButton
                                    label="hfill"
                                    onClick={() => insertAtCursor(" \\hfill ")}
                                />
                            </div>
                        </div>

                        {/* Code Editor */}
                        <div className="flex-1 relative">
                            <textarea
                                ref={textareaRef}
                                value={code}
                                onChange={handleCodeChange}
                                spellCheck={false}
                                className="w-full h-full p-4 bg-gray-900 text-gray-100 font-mono text-sm leading-relaxed resize-none focus:outline-none"
                                placeholder="Start typing your LaTeX code here..."
                            />
                            {/* Line numbers would go here in a production version */}
                        </div>
                    </div>
                )}

                {activeTab === "suggestions" && (
                    <div className="h-full overflow-y-auto p-4">
                        {!aiResult ? (
                            <div className="text-center text-gray-400 py-8">
                                <p className="text-lg mb-2">🤖 AI Resume Improvement</p>
                                <p className="text-sm">
                                    Click &quot;AI Improve&quot; to get personalized suggestions for your resume
                                </p>
                            </div>
                        ) : aiResult.error ? (
                            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                                <p className="text-red-300">{aiResult.error}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Overall Score */}
                                {aiResult.overall_score !== undefined && (
                                    <div className="bg-gray-800 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-semibold">Overall Score</h3>
                                            <span
                                                className={`text-2xl font-bold ${
                                                    aiResult.overall_score >= 80
                                                        ? "text-green-400"
                                                        : aiResult.overall_score >= 60
                                                        ? "text-yellow-400"
                                                        : "text-red-400"
                                                }`}
                                            >
                                                {aiResult.overall_score}/100
                                            </span>
                                        </div>
                                        {aiResult.summary && (
                                            <p className="text-gray-300 text-sm">{aiResult.summary}</p>
                                        )}
                                    </div>
                                )}

                                {/* Suggestions */}
                                {aiResult.suggestions && aiResult.suggestions.length > 0 && (
                                    <div className="bg-gray-800 rounded-lg p-4">
                                        <h3 className="font-semibold mb-3">Improvement Suggestions</h3>
                                        <div className="space-y-3">
                                            {aiResult.suggestions.map((suggestion, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`p-3 rounded border-l-4 ${
                                                        suggestion.priority === "high"
                                                            ? "border-red-500 bg-red-900/20"
                                                            : suggestion.priority === "medium"
                                                            ? "border-yellow-500 bg-yellow-900/20"
                                                            : "border-blue-500 bg-blue-900/20"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs uppercase font-semibold text-gray-400">
                                                            {suggestion.section}
                                                        </span>
                                                        <span
                                                            className={`text-xs px-1.5 py-0.5 rounded ${
                                                                suggestion.priority === "high"
                                                                    ? "bg-red-600"
                                                                    : suggestion.priority === "medium"
                                                                    ? "bg-yellow-600"
                                                                    : "bg-blue-600"
                                                            }`}
                                                        >
                                                            {suggestion.priority}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-300 mb-1">
                                                        <strong>Issue:</strong> {suggestion.issue}
                                                    </p>
                                                    <p className="text-sm text-emerald-300">
                                                        <strong>Fix:</strong> {suggestion.improvement}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Improved Sections */}
                                {aiResult.improved_sections &&
                                    Object.keys(aiResult.improved_sections).length > 0 && (
                                        <div className="bg-gray-800 rounded-lg p-4">
                                            <h3 className="font-semibold mb-3">Improved Code Snippets</h3>
                                            <div className="space-y-3">
                                                {Object.entries(aiResult.improved_sections).map(
                                                    ([section, code]) => (
                                                        <div
                                                            key={section}
                                                            className="bg-gray-900 rounded p-3"
                                                        >
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-sm font-medium">
                                                                    {section}
                                                                </span>
                                                                <button
                                                                    onClick={() =>
                                                                        applyImprovedSection(section, code)
                                                                    }
                                                                    className="text-xs px-2 py-1 bg-emerald-600 hover:bg-emerald-500 rounded"
                                                                >
                                                                    Apply
                                                                </button>
                                                            </div>
                                                            <pre className="text-xs text-gray-400 overflow-x-auto">
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
                    <div className="h-full overflow-y-auto p-4">
                        {!atsResult ? (
                            <div className="text-center text-gray-400 py-8">
                                <p className="text-lg mb-2">📊 ATS Compatibility Check</p>
                                <p className="text-sm">
                                    Click &quot;ATS Check&quot; to analyze how well your resume will perform
                                    with Applicant Tracking Systems
                                </p>
                            </div>
                        ) : atsResult.error ? (
                            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                                <p className="text-red-300">{atsResult.error}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* ATS Score */}
                                <div className="bg-gray-800 rounded-lg p-6 text-center">
                                    <h3 className="text-sm text-gray-400 mb-2">ATS Compatibility Score</h3>
                                    <div
                                        className={`text-5xl font-bold ${
                                            (atsResult.ats_score || 0) >= 80
                                                ? "text-green-400"
                                                : (atsResult.ats_score || 0) >= 60
                                                ? "text-yellow-400"
                                                : "text-red-400"
                                        }`}
                                    >
                                        {atsResult.ats_score || 0}
                                    </div>
                                    <p className="text-gray-400 mt-1">out of 100</p>
                                </div>

                                {/* Issues */}
                                {atsResult.issues && atsResult.issues.length > 0 && (
                                    <div className="bg-gray-800 rounded-lg p-4">
                                        <h3 className="font-semibold mb-3 text-red-400">
                                            ⚠️ Issues Found
                                        </h3>
                                        <ul className="space-y-2">
                                            {atsResult.issues.map((issue, idx) => (
                                                <li key={idx} className="text-sm text-gray-300 flex gap-2">
                                                    <span className="text-red-400">•</span>
                                                    {issue}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Recommendations */}
                                {atsResult.recommendations && atsResult.recommendations.length > 0 && (
                                    <div className="bg-gray-800 rounded-lg p-4">
                                        <h3 className="font-semibold mb-3 text-emerald-400">
                                            ✓ Recommendations
                                        </h3>
                                        <ul className="space-y-2">
                                            {atsResult.recommendations.map((rec, idx) => (
                                                <li key={idx} className="text-sm text-gray-300 flex gap-2">
                                                    <span className="text-emerald-400">•</span>
                                                    {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Keyword Analysis */}
                                {atsResult.keyword_analysis && (
                                    <div className="bg-gray-800 rounded-lg p-4">
                                        <h3 className="font-semibold mb-3">🔑 Keyword Analysis</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="text-sm text-green-400 mb-2">
                                                    Found Keywords
                                                </h4>
                                                <div className="flex flex-wrap gap-1">
                                                    {atsResult.keyword_analysis.found_keywords?.map(
                                                        (kw, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-2 py-0.5 bg-green-900/50 text-green-300 text-xs rounded"
                                                            >
                                                                {kw}
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-sm text-amber-400 mb-2">
                                                    Consider Adding
                                                </h4>
                                                <div className="flex flex-wrap gap-1">
                                                    {atsResult.keyword_analysis.missing_common_keywords?.map(
                                                        (kw, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-2 py-0.5 bg-amber-900/50 text-amber-300 text-xs rounded cursor-pointer hover:bg-amber-800/50"
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
            className="w-full text-left px-2 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
        >
            {label}
        </button>
    );
}
