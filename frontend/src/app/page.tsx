"use client";

import { useState } from "react";
import axios from "axios";

export default function Home() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [jobDescription, setJobDescription] = useState("");
    const [analysis, setAnalysis] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
            setError("");
        }
    };

    const handleAnalyze = async () => {
        if (!selectedFile) {
            setError("Please select a PDF file");
            return;
        }

        setLoading(true);
        setError("");
        setAnalysis("");

        const formData = new FormData();
        formData.append("resume", selectedFile);
        formData.append("job_description", jobDescription);

        try {
            const response = await axios.post("http://localhost:5001/analyze-resume", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setAnalysis(response.data.analysis);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.error || "An error occurred while analyzing the resume"
                );
            } else {
                setError("An error occurred while analyzing the resume");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
                        ResuMatch <span className="text-indigo-600">AI</span>
                    </h1>
                    <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                        Beat ATS systems and get your resume shortlisted with AI-powered
                        optimization
                    </p>
                    <div className="mt-6 flex justify-center space-x-8 text-sm text-gray-600">
                        <div className="flex items-center">
                            <svg
                                className="w-5 h-5 text-green-500 mr-2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            ATS-Friendly Analysis
                        </div>
                        <div className="flex items-center">
                            <svg
                                className="w-5 h-5 text-green-500 mr-2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            Keyword Optimization
                        </div>
                        <div className="flex items-center">
                            <svg
                                className="w-5 h-5 text-green-500 mr-2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            Job Match Score
                        </div>
                    </div>
                </div>

                <div className="mt-12 bg-white shadow-xl rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="space-y-6">
                            {/* File Upload */}
                            <div>
                                <label
                                    htmlFor="resume-upload"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Upload Resume (PDF)
                                </label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-400 transition-colors">
                                    <div className="space-y-1 text-center">
                                        <svg
                                            className="mx-auto h-12 w-12 text-gray-400"
                                            stroke="currentColor"
                                            fill="none"
                                            viewBox="0 0 48 48"
                                            aria-hidden="true"
                                        >
                                            <path
                                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                                strokeWidth={2}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        <div className="flex text-sm text-gray-600">
                                            <label
                                                htmlFor="resume-upload"
                                                className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                                            >
                                                <span>Upload a file</span>
                                                <input
                                                    id="resume-upload"
                                                    name="resume-upload"
                                                    type="file"
                                                    accept=".pdf"
                                                    className="sr-only"
                                                    onChange={handleFileChange}
                                                />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500">PDF up to 10MB</p>
                                    </div>
                                </div>
                                {selectedFile && (
                                    <p className="mt-2 text-sm text-green-600">
                                        Selected: {selectedFile.name}
                                    </p>
                                )}
                            </div>

                            {/* Job Description */}
                            <div>
                                <label
                                    htmlFor="job-description"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Job Description{" "}
                                    <span className="text-indigo-600 font-semibold">
                                        (Recommended for ATS Optimization)
                                    </span>
                                </label>
                                <p className="mt-1 text-xs text-gray-500">
                                    Add the job description to get keyword matching, ATS
                                    compatibility score, and targeted optimization tips
                                </p>
                                <div className="mt-2">
                                    <textarea
                                        id="job-description"
                                        name="job-description"
                                        rows={4}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        placeholder="Paste the complete job description here for precise matching and keyword analysis..."
                                        value={jobDescription}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                    />
                                </div>
                                {jobDescription && (
                                    <p className="mt-2 text-sm text-green-600 flex items-center">
                                        <svg
                                            className="w-4 h-4 mr-1"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Job description added - You&apos;ll get detailed ATS
                                        optimization and keyword matching!
                                    </p>
                                )}
                            </div>

                            {/* Analyze Button */}
                            <div>
                                <button
                                    onClick={handleAnalyze}
                                    disabled={loading || !selectedFile}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading
                                        ? "Analyzing..."
                                        : jobDescription
                                        ? "Get ATS Score & Job Match Analysis"
                                        : "Analyze Resume"}
                                </button>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="rounded-md bg-red-50 p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg
                                                className="h-5 w-5 text-red-400"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-red-800">{error}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Analysis Results */}
                            {analysis && (
                                <div className="rounded-md bg-green-50 p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg
                                                className="h-5 w-5 text-green-400"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L7.53 10.53a.75.75 0 00-1.06 1.06l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-green-800">
                                                Analysis Complete!
                                            </h3>
                                            <div className="mt-2 text-sm text-green-700">
                                                <pre className="whitespace-pre-wrap font-sans">
                                                    {analysis}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
