"use client";
import { useState } from "react";

export default function RepoInput() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!repoUrl.trim()) return setError("Please enter a valid GitHub URL.");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/analyzeCode", {
        method: "POST",
        body: JSON.stringify({ repoUrl }),
        headers: { "Content-Type": "application/json" },
      });

      // Handle response here (if needed)
    } catch (err) {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg shadow-lg bg-white mt-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Analyze GitHub Repository</h2>
      <p className="text-gray-600 mb-4">
        Enter the URL of a GitHub repository to analyze its codebase.
      </p>
      <input
        type="text"
        placeholder="Enter GitHub Repo URL"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
        className="border p-3 w-full rounded-lg text-gray-800"
      />
      <button
        onClick={handleSubmit}
        className={`mt-4 px-6 py-3 rounded-lg text-white font-medium transition ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
        }`}
        disabled={loading}
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>
      {error && (
        <p className="text-red-600 mt-4 border border-red-200 bg-red-50 p-3 rounded">
          {error}
        </p>
      )}
    </div>
  );
}