"use client";

import { useState } from "react";
import axios from "axios";
import { getApiUrl, API_CONFIG } from "@/lib/config";
import Image from "next/image";
import Link from "next/link";

interface AnalysisResult {
    ats_score: number;
    fit_analysis: string;
    improvement_tips: string[];
}

export default function Home() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [jobDescription, setJobDescription] = useState("");
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
            setError("");
        }
    };

    const handleReset = () => {
        setSelectedFile(null);
        setJobDescription("");
        setAnalysis(null);
        setError("");
    };

    const handleAnalyze = async () => {
        if (!selectedFile) {
            setError("Please select a PDF file");
            return;
        }

        setLoading(true);
        setError("");
        setAnalysis(null);

        const formData = new FormData();
        formData.append("resume", selectedFile);
        formData.append("job_description", jobDescription);

        try {
            const response = await axios.post(getApiUrl(API_CONFIG.endpoints.analyzeResume), formData, {
                ...API_CONFIG,
                timeout: 120000,
            });

            if (response.data && response.data.analysis) {
                setAnalysis(response.data.analysis);
            } else {
                setError("Analysis completed but no results returned. Please try again.");
            }
        } catch (error) {
            console.error("Analysis error:", error);
            if (axios.isAxiosError(error)) {
                if (error.code === "ECONNABORTED") {
                    setError("Analysis timed out. Please try again.");
                } else if (error.response?.status === 413) {
                    setError("File size too large (max 16MB).");
                } else if (error.response?.data?.error) {
                    setError(error.response.data.error);
                } else {
                    setError("Analysis failed. Please try again.");
                }
            } else {
                setError("Analysis failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number | undefined): string => {
        if (!score || isNaN(score)) return "text-gray-400";
        if (score >= 80) return "text-emerald-600";
        if (score >= 60) return "text-amber-600";
        if (score >= 40) return "text-orange-600";
        return "text-rose-600";
    };

    const getScoreLabel = (score: number | undefined): string => {
        if (!score || isNaN(score)) return "Analyzing...";
        if (score >= 85) return "Excellent Match";
        if (score >= 70) return "Good Match";
        if (score >= 55) return "Fair Match";
        if (score >= 40) return "Needs Improvement";
        return "Critical Issues";
    };

    const renderAnalysisContent = (content: string) => {
        if (!content) return <p className="text-gray-500 text-sm">No analysis available.</p>;

        return content.split("\n").map((line, index) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return null;

            // Headers (Markdown style **Header**)
            if (trimmedLine.match(/^\*\*[^:]+:\*\*$/) || trimmedLine.match(/^##\s+/)) {
                const headerText = trimmedLine.replace(/\*\*/g, "").replace(":", "").replace(/^##\s+/, "");
                return (
                    <h3 key={index} className="text-sm font-semibold text-gray-900 uppercase tracking-wider mt-6 mb-3 first:mt-0">
                        {headerText}
                    </h3>
                );
            }

            // Bullet points
            if (trimmedLine.match(/^[\*\-]\s+/)) {
                const cleanText = trimmedLine.replace(/^[\*\-]\s+/, "").replace(/\*\*/g, "");
                return (
                    <div key={index} className="flex items-start mb-3 group">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0 group-hover:scale-125 transition-transform" />
                        <p className="text-gray-600 leading-relaxed text-sm">{cleanText}</p>
                    </div>
                );
            }

            // Numbered lists
            if (trimmedLine.match(/^\d+\.\s+/)) {
                const cleanText = trimmedLine.replace(/\*\*/g, "");
                return (
                    <div key={index} className="flex items-start mb-3 group">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium mr-3 mt-0.5 flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                            {trimmedLine.match(/^(\d+)\./)?.[1]}
                        </span>
                        <p className="text-gray-600 leading-relaxed text-sm">
                            {cleanText.replace(/^\d+\.\s+/, "")}
                        </p>
                    </div>
                );
            }

            return (
                <p key={index} className="text-gray-600 leading-relaxed mb-3 text-sm">
                    {trimmedLine.replace(/\*\*/g, "")}
                </p>
            );
        });
    };

    const renderImprovementContent = (tips: string[]) => {
        if (!tips || tips.length === 0) {
            return <p className="text-gray-500 text-sm">No improvement tips available.</p>;
        }

        return (
            <div className="space-y-4">
                {tips.map((point, index) => {
                    const cleanPoint = point.replace(/^\d+\.\s+|-\s+|\*\s+/, "").replace(/\*\*/g, "").trim();
                    if (!cleanPoint) return null;

                    return (
                        <div key={index} className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-700 text-sm leading-relaxed">{cleanPoint}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-white selection:bg-gray-900 selection:text-white">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-6 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8">
                            <Image
                                src="/icon-192.png"
                                alt="ResuMatch AI Logo"
                                fill
                                className="object-contain rounded-lg"
                                priority
                            />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-gray-900">ResuMatch AI</h1>
                    </div>
                    {(analysis || error || selectedFile) && (
                        <button
                            onClick={handleReset}
                            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            Start Over
                        </button>
                    )}
                    <Link
                        href="/latex-editor"
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm"
                    >
                        📝 LaTeX Builder
                    </Link>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12 md:py-20">
                {!analysis && !loading && (
                    <div className="max-w-2xl mx-auto text-center mb-16 animate-in">
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-6">
                            Optimize your resume for ATS.
                        </h2>
                        <p className="text-lg text-gray-500 leading-relaxed">
                            Upload your resume and job description to get instant, AI-powered feedback and increase your chances of getting hired.
                        </p>
                    </div>
                )}

                <div className={`grid grid-cols-1 gap-8 transition-all duration-500 ${analysis ? 'lg:grid-cols-12' : 'max-w-2xl mx-auto'}`}>
                    {/* Input Section */}
                    <div className={`space-y-6 ${analysis ? 'lg:col-span-4' : 'w-full'}`}>
                        {/* Resume Upload */}
                        <div className="group relative">
                            <div
                                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${selectedFile
                                    ? "border-gray-300 bg-gray-50"
                                    : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                                    }`}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const files = e.dataTransfer.files;
                                    if (files && files[0]) {
                                        setSelectedFile(files[0]);
                                        setError("");
                                    }
                                }}
                            >
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="resume-upload"
                                >
                                </input>
                                <label htmlFor="resume-upload" className="cursor-pointer block">
                                    {selectedFile ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-rose-500 shadow-sm">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Upload Resume</p>
                                                <p className="text-xs text-gray-500 mt-1">PDF up to 16MB</p>
                                            </div>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* Job Description */}
                        <div className="relative">
                            <textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Paste job description (optional)..."
                                className="w-full h-32 p-4 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-0 transition-colors resize-none"
                            />
                        </div>

                        {/* Analyze Button */}
                        <button
                            onClick={handleAnalyze}
                            disabled={!selectedFile || loading}
                            className="w-full bg-gray-900 text-white h-12 rounded-xl font-medium hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Analyzing...
                                </span>
                            ) : (
                                "Analyze Resume"
                            )}
                        </button>

                        {error && (
                            <div className="p-4 bg-rose-50 text-rose-600 text-sm rounded-xl border border-rose-100">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Results Section */}
                    {analysis && (
                        <div className="lg:col-span-8 space-y-6 animate-in">
                            {/* Score Card */}
                            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="text-center md:text-left">
                                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">ATS Compatibility</p>
                                    <h3 className={`text-2xl font-bold ${getScoreColor(analysis?.ats_score)}`}>
                                        {getScoreLabel(analysis?.ats_score)}
                                    </h3>
                                </div>
                                <div className="relative w-32 h-32 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-100" />
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="60"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="none"
                                            strokeDasharray={377}
                                            strokeDashoffset={analysis?.ats_score ? 377 - (377 * analysis.ats_score) / 100 : 377}
                                            className={`${getScoreColor(analysis?.ats_score)} transition-all duration-1000 ease-out`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <span className={`absolute text-3xl font-bold ${getScoreColor(analysis?.ats_score)}`}>
                                        {analysis?.ats_score ?? 0}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Analysis Column */}
                                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-50">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                        </div>
                                        <h3 className="font-semibold text-gray-900">Fit Analysis</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {renderAnalysisContent(analysis.fit_analysis)}
                                    </div>
                                </div>

                                {/* Improvements Column */}
                                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-50">
                                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                        <h3 className="font-semibold text-gray-900">ATS Improvements</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {renderImprovementContent(analysis.improvement_tips)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
