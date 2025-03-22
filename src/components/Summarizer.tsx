"use client";
import { useState } from "react";

export default function Summarizer() {
    const [summary, setSummary] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchSummary = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await fetch("/api/summarizer", { method: "POST" });
            const data = await response.json();
            setSummary(data.summary);
        } catch (err) {
            setError("Failed to generate summary. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 border rounded-lg shadow-lg bg-white mt-6 max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Project Summary</h2>
            <p className="text-gray-600 mb-4">
                Click the button below to generate a summary of the project.
            </p>
            <button
                onClick={fetchSummary}
                className={`px-6 py-3 rounded-lg text-white font-medium transition ${
                    loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                }`}
                disabled={loading}
            >
                {loading ? "Generating..." : "Generate Summary"}
            </button>
            {error && (
                <p className="text-red-600 mt-4 border border-red-200 bg-red-50 p-3 rounded">
                    {error}
                </p>
            )}
            {summary && (
                <div className="mt-6 p-4 bg-gray-100 rounded-lg shadow-inner">
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Summary:</h3>
                    <pre className="text-sm text-gray-800 overflow-auto">{summary}</pre>
                </div>
            )}
        </div>
    );
}