"use client";

import { useState } from "react";
import axios from "axios";
import { getApiUrl, API_CONFIG } from "@/lib/config";
import Image from "next/image";

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

    // Helper function to extract analysis section (score, skills, experience)
    const getAnalysisSection = (text: string): string => {
        const lines = text.split("\n");
        const analysisLines: string[] = [];

        for (const line of lines) {
            // Stop when we hit the separator line or improvement sections
            if (
                line.trim() === "---" ||
                line.includes("DETAILED IMPROVEMENT") ||
                line.includes("IMPROVEMENT RECOMMENDATIONS") ||
                line.includes("IMPROVEMENT PLAN") ||
                line.includes("ATS OPTIMIZATION")
            ) {
                break;
            }

            analysisLines.push(line);
        }

        return analysisLines.join("\n").trim();
    };

    // Helper function to extract improvement section
    const getImprovementSection = (text: string): string => {
        const lines = text.split("\n");
        const improvementLines: string[] = [];
        let foundSeparator = false;

        for (const line of lines) {
            // Start collecting after we find the separator or improvement section
            if (
                !foundSeparator &&
                (line.trim() === "---" ||
                    line.includes("DETAILED IMPROVEMENT") ||
                    line.includes("IMPROVEMENT RECOMMENDATIONS") ||
                    line.includes("IMPROVEMENT PLAN") ||
                    line.includes("ATS OPTIMIZATION"))
            ) {
                foundSeparator = true;
                if (line.trim() !== "---") {
                    improvementLines.push(line); // Include the header if it's not just the separator
                }
                continue;
            }

            if (foundSeparator) {
                improvementLines.push(line);
            }
        }

        return improvementLines.join("\n").trim();
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
            const response = await axios.post(getApiUrl("/analyze-resume"), formData, {
                ...API_CONFIG,
                timeout: 120000, // 2 minutes timeout for AI analysis
            });

            if (response.data && response.data.analysis) {
                const analysisResult = response.data.analysis;
                setAnalysis(analysisResult);

                // Extract score from analysis
                const score = extractScore(analysisResult);
                setMatchScore(score);
            } else {
                setError("Analysis completed but no results returned. Please try again.");
            }
        } catch (error) {
            console.error("Analysis error:", error);

            if (axios.isAxiosError(error)) {
                if (error.code === "ECONNABORTED") {
                    setError(
                        "Analysis timed out. The AI service is taking longer than usual. Please try again."
                    );
                } else if (error.response?.status === 413) {
                    setError("File size too large. Please upload a smaller resume (max 16MB).");
                } else if (error.response?.data?.error) {
                    setError(error.response.data.error);
                } else if (error.message?.includes("Network Error")) {
                    setError(
                        "Unable to connect to analysis service. Please check your internet connection and try again."
                    );
                } else {
                    setError("Analysis failed. Please try again in a few moments.");
                }
            } else {
                setError("Analysis failed. Please try again in a few moments.");
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

    const renderAnalysisContent = (content: string, isImprovement: boolean = false) => {
        return content.split("\n").map((line, index) => {
            const trimmedLine = line.trim();

            // Skip empty lines
            if (!trimmedLine) return null;

            // Main headers - clean and simple
            if (trimmedLine.match(/^\*\*[^:]+:\*\*$/)) {
                const headerText = trimmedLine.replace(/\*\*/g, "").replace(":", "");
                return (
                    <div key={index} className="mt-8 mb-4 first:mt-0">
                        <h3
                            className={`text-xl font-semibold border-b-2 pb-2 ${isImprovement
                                    ? "text-green-800 border-green-200"
                                    : "text-gray-900 border-gray-200"
                                }`}
                        >
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
                    <div key={index} className="my-6 p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-800 font-medium">ATS Score</span>
                            <div className="flex items-center space-x-2">
                                <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                                    {score}/100
                                </span>
                                <span className={`text-sm ${getScoreColor(score)}`}>
                                    {getScoreLabel(score)}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            }

            // Numbered improvement points (for improvements section)
            if (isImprovement && trimmedLine.match(/^\d+\.\s+/)) {
                const cleanText = trimmedLine.replace(/\*\*/g, "");
                return (
                    <div key={index} className="mb-3">
                        <div className="flex items-start">
                            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full mr-3 mt-0.5 flex-shrink-0">
                                {trimmedLine.match(/^(\d+)\./)?.[1]}
                            </span>
                            <p className="text-gray-700 leading-relaxed text-sm">
                                {cleanText.replace(/^\d+\.\s+/, "")}
                            </p>
                        </div>
                    </div>
                );
            }

            // Simple bullet points - remove asterisks
            if (trimmedLine.match(/^\*\s+/)) {
                const cleanText = trimmedLine.replace(/^\*\s+/, "").replace(/\*\*/g, "");
                return (
                    <div key={index} className="ml-4 mb-2">
                        <div className="flex items-start">
                            <span
                                className={`mr-3 mt-1.5 w-1 h-1 rounded-full flex-shrink-0 ${isImprovement
                                        ? "text-green-400 bg-green-400"
                                        : "text-gray-400 bg-gray-400"
                                    }`}
                            ></span>
                            <p className="text-gray-700 leading-relaxed text-sm">{cleanText}</p>
                        </div>
                    </div>
                );
            }

            // Regular text - clean and simple
            if (trimmedLine.length > 0) {
                const cleanText = trimmedLine.replace(/\*\*/g, "");
                return (
                    <p key={index} className="text-gray-700 leading-relaxed mb-3">
                        {cleanText}
                    </p>
                );
            }

            return null;
        });
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header Section */}
            <header className="border-b border-gray-100 py-4">
                <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12">
                            <Image
                                src="/icon.png"
                                alt="ResuMatch AI Logo"
                                fill
                                className="object-contain rounded-xl"
                                priority
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-black">ResuMatch AI</h1>
                            <p className="text-sm text-gray-500 mt-1">Upload, Analyze, Optimize</p>
                        </div>
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
                                                strokeWidth="2"
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-gray-700 font-medium">
                                            Drop your resume here or click to browse
                                        </p>
                                        <p className="text-gray-500 text-sm mt-1">PDF files only</p>
                                    </div>
                                </div>
                            </label>
                        </div>
                        {selectedFile && (
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                                <div className="w-8 h-8 text-red-600">
                                    <svg fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M7 18h10v-1H7v1zM7 16h10v-1H7v1zM7 14h10v-1H7v1zM7 12h10v-1H7v1zM7 10h7V9H7v1z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                        {selectedFile.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Job Description */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-black">
                            Job Description{" "}
                            <span className="text-gray-400 font-normal">(Optional)</span>
                        </h3>
                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the job description here for targeted analysis..."
                            className="w-full h-48 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                        <p className="text-xs text-gray-500">
                            Adding a job description will provide more targeted feedback and scoring
                        </p>
                    </div>
                </div>

                {/* Analyze Button */}
                <div className="text-center mb-12">
                    <button
                        onClick={handleAnalyze}
                        disabled={!selectedFile || loading}
                        className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? "Analyzing..." : "Analyze Resume"}
                    </button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <div className="text-center">
                            <p className="text-blue-800 font-medium">AI Analysis in Progress</p>
                            <p className="text-blue-600 text-sm mt-1">
                                This may take up to 2 minutes depending on resume complexity...
                            </p>
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

                        {/* Two Column Layout for Analysis and Improvements */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Analysis Section */}
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-blue-50 px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-xl font-bold text-gray-900">
                                        🔍 Resume Analysis
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Current resume assessment and scoring
                                    </p>
                                </div>
                                <div className="p-6">
                                    <div className="analysis-clean max-w-none">
                                        <div className="space-y-6">
                                            {renderAnalysisContent(
                                                getAnalysisSection(analysis),
                                                false
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Improvements Section */}
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-green-50 px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-xl font-bold text-gray-900">
                                        🚀 Improvement Recommendations
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Actionable tips to boost your ATS score
                                    </p>
                                </div>
                                <div className="p-6">
                                    <div className="analysis-clean max-w-none">
                                        <div className="space-y-6">
                                            {renderAnalysisContent(
                                                getImprovementSection(analysis),
                                                true
                                            )}
                                        </div>
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
