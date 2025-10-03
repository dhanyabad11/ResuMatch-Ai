"use client";

import { useState } from "react";
import axios from "axios";
import { getApiUrl, API_CONFIG } from "@/lib/config";

export default function Home() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [jobDescription, setJobDescription] = useState("");
    const [analysis, setAnalysis] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [matchScore, setMatchScore] = useState<number | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
            setError("");
        }
    };

    const handleReset = () => {
        setSelectedFile(null);
        setJobDescription("");
        setAnalysis("");
        setError("");
        setMatchScore(null);
    };

    const extractScore = (analysisText: string): number | null => {
        const scoreMatch = analysisText.match(
            /(?:OVERALL ATS SCORE|ATS SCORE|OVERALL SCORE|SCORE):\s*(\d+)\/100/i
        );
        return scoreMatch ? parseInt(scoreMatch[1]) : null;
    };

    const handleAnalyze = async () => {
        if (!selectedFile) {
            setError("Please select a PDF file");
            return;
        }

        setLoading(true);
        setError("");
        setAnalysis("");
        setMatchScore(null);

        const formData = new FormData();
        formData.append("resume", selectedFile);
        formData.append("job_description", jobDescription);

        try {
            const response = await axios.post(
                getApiUrl(API_CONFIG.endpoints.analyzeResume),
                formData,
                {
                    // Don't set Content-Type manually - let browser set it with boundary
                    timeout: 180000, // 3 minutes timeout for better reliability
                }
            );

            setAnalysis(response.data.analysis);
            const score = extractScore(response.data.analysis);
            setMatchScore(score);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
                    setError(
                        "Analysis timed out. The AI service is taking longer than usual. Please try again."
                    );
                } else if (err.response?.status === 504) {
                    setError("Service temporarily unavailable. Please try again in a few moments.");
                } else {
                    setError(
                        err.response?.data?.error || "An error occurred while analyzing the resume"
                    );
                }
            } else {
                setError("An error occurred while analyzing the resume");
            }
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number): string => {
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-yellow-600";
        if (score >= 40) return "text-orange-600";
        return "text-red-600";
    };

    const getScoreLabel = (score: number): string => {
        if (score >= 85) return "Excellent ATS Match";
        if (score >= 70) return "Good ATS Match";
        if (score >= 55) return "Fair ATS Match";
        if (score >= 40) return "Needs Improvement";
        return "Major Issues";
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header Section */}
            <header className="border-b border-gray-100 py-4">
                <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-black">ResuMatch AI</h1>
                        <p className="text-sm text-gray-500 mt-1">Upload, Analyze, Optimize</p>
                    </div>
                    {(analysis || error || selectedFile) && (
                        <button
                            onClick={handleReset}
                            className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 py-12">
                {/* Upload Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Resume Upload */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-black">Resume</h3>
                        <div
                            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
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
                            <label htmlFor="resume-upload" className="cursor-pointer">
                                <div className="space-y-3">
                                    <div className="w-12 h-12 mx-auto text-gray-400">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Drop Résumé PDF Here</p>
                                        <p className="text-sm text-gray-400 mt-1">
                                            or click to browse
                                        </p>
                                    </div>
                                </div>
                            </label>
                        </div>
                        {selectedFile && (
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                                ✓ {selectedFile.name}
                            </p>
                        )}
                    </div>

                    {/* Job Description Upload */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-black">Job Description</h3>
                        <div className="border border-gray-300 rounded-lg">
                            <textarea
                                placeholder="Paste job description here for targeted analysis..."
                                className="w-full h-40 p-4 border-none rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                            />
                        </div>
                        {jobDescription && (
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                                ✓ Job description added ({jobDescription.length} characters)
                            </p>
                        )}
                    </div>
                </div>

                {/* Analyze Button */}
                <div className="text-center mb-12">
                    <button
                        onClick={handleAnalyze}
                        disabled={loading || !selectedFile}
                        className="bg-blue-600 text-white px-8 py-3 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? (
                            <span className="flex items-center">
                                <svg
                                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                Analyzing with AI...
                            </span>
                        ) : (
                            "Analyze"
                        )}
                    </button>
                </div>

                {/* Loading Progress Message */}
                {loading && (
                    <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center">
                            <svg
                                className="animate-spin h-5 w-5 text-blue-600 mr-3"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            <div>
                                <p className="text-blue-800 font-medium">AI Analysis in Progress</p>
                                <p className="text-blue-600 text-sm mt-1">
                                    This may take up to 2 minutes depending on resume complexity...
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                {/* Results Section */}
                {analysis && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        {/* Score Card */}
                        {matchScore !== null && (
                            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                                <div className="flex items-center justify-center space-x-8">
                                    <div>
                                        <div
                                            className={`text-4xl font-bold ${getScoreColor(
                                                matchScore
                                            )}`}
                                        >
                                            {matchScore}/100
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">ATS Score</p>
                                    </div>
                                    <div className="h-12 w-px bg-gray-200"></div>
                                    <div>
                                        <div
                                            className={`text-lg font-semibold ${getScoreColor(
                                                matchScore
                                            )}`}
                                        >
                                            {getScoreLabel(matchScore)}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">Assessment</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Analysis Details */}
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <h3 className="text-xl font-bold text-gray-900">
                                    📋 Detailed Analysis Results
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Comprehensive AI-powered feedback and recommendations
                                </p>
                            </div>
                            <div className="p-6">
                                <div className="analysis-clean max-w-none">
                                    <div className="space-y-6">
                                        {analysis.split("\n").map((line, index) => {
                                            const trimmedLine = line.trim();

                                            // Skip empty lines
                                            if (!trimmedLine) return null;

                                            // Main headers - clean and simple
                                            if (trimmedLine.match(/^\*\*[^:]+:\*\*$/)) {
                                                const headerText = trimmedLine
                                                    .replace(/\*\*/g, "")
                                                    .replace(":", "");
                                                return (
                                                    <div
                                                        key={index}
                                                        className="mt-8 mb-4 first:mt-0"
                                                    >
                                                        <h3 className="text-xl font-semibold text-gray-900 border-b-2 border-gray-200 pb-2">
                                                            {headerText}
                                                        </h3>
                                                    </div>
                                                );
                                            }

                                            // Score lines - clean display
                                            if (trimmedLine.match(/SCORE.*\d+\/100/i)) {
                                                const match = trimmedLine.match(/(\d+)\/100/);
                                                const score = match ? parseInt(match[1]) : 0;
                                                return (
                                                    <div
                                                        key={index}
                                                        className="my-6 p-4 bg-gray-50 rounded-lg border"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-gray-800 font-medium">
                                                                ATS Score
                                                            </span>
                                                            <div className="flex items-center space-x-2">
                                                                <span
                                                                    className={`text-2xl font-bold ${getScoreColor(
                                                                        score
                                                                    )}`}
                                                                >
                                                                    {score}/100
                                                                </span>
                                                                <span
                                                                    className={`text-sm ${getScoreColor(
                                                                        score
                                                                    )}`}
                                                                >
                                                                    {getScoreLabel(score)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // Simple bullet points - remove asterisks
                                            if (trimmedLine.match(/^\*\s+/)) {
                                                const cleanText = trimmedLine
                                                    .replace(/^\*\s+/, "")
                                                    .replace(/\*\*/g, "");
                                                return (
                                                    <div key={index} className="ml-4 mb-2">
                                                        <div className="flex items-start">
                                                            <span className="text-gray-400 mr-3 mt-1.5 w-1 h-1 bg-gray-400 rounded-full flex-shrink-0"></span>
                                                            <p className="text-gray-700 leading-relaxed text-sm">
                                                                {cleanText}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // Regular text - clean and simple
                                            if (trimmedLine.length > 0) {
                                                const cleanText = trimmedLine.replace(/\*\*/g, "");
                                                return (
                                                    <p
                                                        key={index}
                                                        className="text-gray-700 leading-relaxed mb-3"
                                                    >
                                                        {cleanText}
                                                    </p>
                                                );
                                            }

                                            return null;
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Re-analyze Button */}
                        <div className="text-center">
                            <button
                                onClick={handleAnalyze}
                                disabled={loading}
                                className="text-blue-600 hover:text-blue-700 font-medium border border-blue-200 hover:border-blue-300 px-6 py-2 rounded-md transition-colors"
                            >
                                Re-Analyze
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
