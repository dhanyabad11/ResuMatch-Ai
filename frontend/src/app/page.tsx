"use client";

import { useState } from "react";
import axios from "axios";
import { getApiUrl, API_CONFIG } from "@/lib/config";
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
            const response = await axios.post(
                getApiUrl(API_CONFIG.endpoints.analyzeResume),
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    timeout: 120000,
                },
            );

            if (response.data && response.data.analysis) {
                setAnalysis(response.data.analysis);
            } else {
                setError("Analysis completed but no results returned. Please try again.");
            }
        } catch (error) {
            console.error("Analysis error:", error);
            if (axios.isAxiosError(error)) {
                console.error("Response data:", error.response?.data);
                console.error("Response status:", error.response?.status);
                if (error.code === "ECONNABORTED") {
                    setError("Analysis timed out. Please try again.");
                } else if (error.response?.status === 413) {
                    setError("File size too large (max 16MB).");
                } else if (error.response?.data?.error) {
                    setError(error.response.data.error);
                } else if (error.response?.data?.message) {
                    setError(error.response.data.message);
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
        if (!score || isNaN(score)) return "text-gray-500";
        if (score >= 80) return "text-gray-200";
        if (score >= 60) return "text-gray-300";
        if (score >= 40) return "text-gray-400";
        return "text-gray-500";
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
                const headerText = trimmedLine
                    .replace(/\*\*/g, "")
                    .replace(":", "")
                    .replace(/^##\s+/, "");
                return (
                    <h3
                        key={index}
                        className="text-sm font-semibold text-gray-300 uppercase tracking-wider mt-6 mb-3 first:mt-0"
                    >
                        {headerText}
                    </h3>
                );
            }

            // Bullet points
            if (trimmedLine.match(/^[\*\-]\s+/)) {
                const cleanText = trimmedLine.replace(/^[\*\-]\s+/, "").replace(/\*\*/g, "");
                return (
                    <div key={index} className="flex items-start mb-3 group">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 mt-2 mr-3 flex-shrink-0 group-hover:scale-125 transition-transform" />
                        <p className="text-gray-400 leading-relaxed text-sm">{cleanText}</p>
                    </div>
                );
            }

            // Numbered lists
            if (trimmedLine.match(/^\d+\.\s+/)) {
                const cleanText = trimmedLine.replace(/\*\*/g, "");
                return (
                    <div key={index} className="flex items-start mb-3 group">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-800 text-gray-300 text-xs font-medium mr-3 mt-0.5 flex-shrink-0 group-hover:bg-gray-700 transition-colors">
                            {trimmedLine.match(/^(\d+)\./)?.[1]}
                        </span>
                        <p className="text-gray-400 leading-relaxed text-sm">
                            {cleanText.replace(/^\d+\.\s+/, "")}
                        </p>
                    </div>
                );
            }

            return (
                <p key={index} className="text-gray-400 leading-relaxed mb-3 text-sm">
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
                    const cleanPoint = point
                        .replace(/^\d+\.\s+|-\s+|\*\s+/, "")
                        .replace(/\*\*/g, "")
                        .trim();
                    if (!cleanPoint) return null;

                    return (
                        <div
                            key={index}
                            className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:shadow-sm transition-shadow"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-gray-700 text-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg
                                        className="w-3.5 h-3.5"
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
                                <div className="flex-1">
                                    <p className="text-gray-300 text-sm leading-relaxed">
                                        {cleanPoint}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="min-h-screen gradient-mesh selection:bg-indigo-500 selection:text-white">
            {/* Crystal Clear Header */}
            <header className="fixed top-0 left-0 right-0 z-50">
                <div className="mx-4 mt-4">
                    <div className="glass shadow-glass-lg rounded-2xl max-w-6xl mx-auto">
                        <div className="px-6 h-16 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-lg">
                                    <span className="text-white font-bold text-lg">R</span>
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold tracking-tight text-white">
                                        ResuMatch AI
                                    </h1>
                                    <p className="text-xs text-gray-400 -mt-0.5">
                                        AI Resume Optimizer
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {(analysis || error || selectedFile) && (
                                    <button
                                        onClick={handleReset}
                                        className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all"
                                    >
                                        Reset
                                    </button>
                                )}
                                <Link
                                    href="/latex-editor"
                                    className="px-5 py-2.5 bg-gradient-to-r from-gray-700 to-gray-900 text-white text-sm font-semibold rounded-xl hover:from-gray-800 hover:to-black transition-all shadow-lg hover:scale-105 active:scale-100"
                                >
                                    LaTeX Builder
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 pt-28 pb-16">
                {/* Hero Section */}
                {!analysis && !loading && (
                    <div className="text-center mb-16 animate-in">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800 text-gray-300 text-sm font-medium mb-6">
                            <span className="w-2 h-2 rounded-full bg-gray-500 animate-pulse"></span>
                            AI-Powered Resume Analysis
                        </div>
                        <h2 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-6 leading-tight">
                            Get Your Resume
                            <span className="block text-gray-300">
                                ATS-Ready
                            </span>
                        </h2>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            Upload your resume and get instant AI feedback to boost your chances of
                            landing interviews.
                        </p>
                    </div>
                )}

                <div
                    className={`grid grid-cols-1 gap-8 transition-all duration-700 ${
                        analysis ? "lg:grid-cols-12" : "max-w-xl mx-auto"
                    }`}
                >
                    {/* Input Section */}
                    <div className={`space-y-5 ${analysis ? "lg:col-span-4" : "w-full"}`}>
                        <div className="glass shadow-glass-lg rounded-2xl p-6 space-y-5">
                            {/* Resume Upload */}
                            <div className="group relative">
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    Resume
                                </label>
                                <div
                                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 cursor-pointer ${
                                        selectedFile
                                            ? "border-gray-600 bg-gray-800/50"
                                            : "border-gray-700 hover:border-gray-600 hover:bg-gray-800/30"
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
                                    />
                                    <label htmlFor="resume-upload" className="cursor-pointer block">
                                        {selectedFile ? (
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white shadow-lg">
                                                    <svg
                                                        className="w-6 h-6"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                        />
                                                    </svg>
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-semibold text-gray-200 truncate max-w-[180px]">
                                                        {selectedFile.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {(selectedFile.size / 1024 / 1024).toFixed(
                                                            2,
                                                        )}{" "}
                                                        MB • Click to change
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-gray-400 group-hover:from-gray-700 group-hover:to-gray-800 group-hover:text-gray-300 transition-all group-hover:scale-110">
                                                    <svg
                                                        className="w-7 h-7"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                        />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-300">
                                                        Drop your resume here
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        or click to browse • PDF up to 16MB
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {/* Job Description */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    Target Job{" "}
                                    <span className="text-gray-500 font-normal">(optional)</span>
                                </label>
                                <textarea
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    placeholder="Paste the job description for tailored analysis..."
                                    className="w-full h-28 p-4 bg-gray-900/50 border border-gray-700 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 focus:border-gray-600 focus:ring-2 focus:ring-gray-700/50 transition-all resize-none"
                                />
                            </div>

                            {/* Analyze Button */}
                            <button
                                onClick={handleAnalyze}
                                disabled={!selectedFile || loading}
                                className="w-full bg-gradient-to-r from-gray-700 to-gray-900 text-white h-14 rounded-xl font-semibold text-base hover:from-gray-800 hover:to-black disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all shadow-lg hover:scale-[1.02] active:scale-100 disabled:shadow-none"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-3">
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
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            />
                                        </svg>
                                        Analyzing with AI...
                                    </span>
                                ) : (
                                    <span>Analyze Resume</span>
                                )}
                            </button>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-start gap-3">
                                    <span className="text-lg">⚠️</span>
                                    <p>{error}</p>
                                </div>
                            )}
                        </div>

                        {/* Feature badges when no results */}
                        {!analysis && !loading && (
                            <div className="grid grid-cols-3 gap-3">
                                <div className="glass shadow-glass rounded-xl p-3 text-center">
                                    <p className="text-xs font-medium text-gray-400">Instant</p>
                                </div>
                                <div className="glass shadow-glass rounded-xl p-3 text-center">
                                    <p className="text-xs font-medium text-gray-400">Accurate</p>
                                </div>
                                <div className="glass shadow-glass rounded-xl p-3 text-center">
                                    <p className="text-xs font-medium text-gray-400">Private</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Results Section */}
                    {analysis && (
                        <div className="lg:col-span-8 space-y-6 animate-in">
                            {/* Score Card */}
                            <div className="glass shadow-glass-lg rounded-2xl p-8">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="text-center md:text-left">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800 text-gray-300 text-xs font-medium mb-3">
                                            ATS Compatibility Score
                                        </div>
                                        <h3
                                            className={`text-3xl font-bold ${getScoreColor(
                                                analysis?.ats_score,
                                            )}`}
                                        >
                                            {getScoreLabel(analysis?.ats_score)}
                                        </h3>
                                        <p className="text-sm text-gray-400 mt-2">
                                            {(analysis?.ats_score ?? 0) >= 80
                                                ? "Your resume is well-optimized!"
                                                : "There's room for improvement"}
                                        </p>
                                    </div>
                                    <div className="relative w-36 h-36 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle
                                                cx="72"
                                                cy="72"
                                                r="64"
                                                stroke="#2a2a2a"
                                                strokeWidth="10"
                                                fill="none"
                                            />
                                            <circle
                                                cx="72"
                                                cy="72"
                                                r="64"
                                                stroke="url(#scoreGradient)"
                                                strokeWidth="10"
                                                fill="none"
                                                strokeDasharray={402}
                                                strokeDashoffset={
                                                    analysis?.ats_score
                                                        ? 402 - (402 * analysis.ats_score) / 100
                                                        : 402
                                                }
                                                className="transition-all duration-1000 ease-out"
                                                strokeLinecap="round"
                                            />
                                            <defs>
                                                <linearGradient
                                                    id="scoreGradient"
                                                    x1="0%"
                                                    y1="0%"
                                                    x2="100%"
                                                    y2="100%"
                                                >
                                                    <stop offset="0%" stopColor="#4a4a4a" />
                                                    <stop offset="100%" stopColor="#6a6a6a" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="absolute flex flex-col items-center">
                                            <span className="text-4xl font-bold text-gray-200">
                                                {analysis?.ats_score ?? 0}
                                            </span>
                                            <span className="text-xs text-gray-500 font-medium">
                                                out of 100
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Analysis Column */}
                                <div className="glass shadow-glass-lg rounded-2xl p-6">
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white shadow-lg">
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
                                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-200">
                                                Fit Analysis
                                            </h3>
                                            <p className="text-xs text-gray-500">
                                                How well your resume matches
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                        {renderAnalysisContent(analysis.fit_analysis)}
                                    </div>
                                </div>

                                {/* Improvements Column */}
                                <div className="glass shadow-glass-lg rounded-2xl p-6">
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white shadow-lg">
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
                                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-200">
                                                Improvements
                                            </h3>
                                            <p className="text-xs text-gray-500">
                                                Actionable suggestions
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                        {renderImprovementContent(analysis.improvement_tips)}
                                    </div>
                                </div>
                            </div>

                            {/* CTA to LaTeX Builder */}
                            <div className="glass shadow-glass-lg rounded-2xl p-6 bg-gray-900/50 border border-gray-700">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div>
                                        <h3 className="font-semibold text-white mb-1">
                                            Want to rebuild your resume from scratch?
                                        </h3>
                                        <p className="text-sm text-gray-400">
                                            Use our AI-powered LaTeX builder to create a
                                            professional, ATS-optimized resume.
                                        </p>
                                    </div>
                                    <Link
                                        href="/latex-editor"
                                        className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white font-semibold rounded-xl hover:from-gray-800 hover:to-black transition-all shadow-lg whitespace-nowrap"
                                    >
                                        Open LaTeX Builder →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="py-8 text-center text-sm text-gray-500">
                <p>Built for job seekers everywhere</p>
            </footer>
        </div>
    );
}
