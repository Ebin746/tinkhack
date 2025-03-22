"use client";
import { useState } from "react";

export default function RepoInput({ onAnalyze }: { onAnalyze: (repoName: string) => void }) {
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

      const data = await response.json();
      if (response.ok) {
        onAnalyze(data.repoName);
      } else {
        setError(data.error || "Failed to fetch repository.");
      }
    } catch (err) {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <input
        type="text"
        placeholder="Enter GitHub Repo URL"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
        className="border p-2 w-full rounded"
      />
      <button
        onClick={handleSubmit}
        className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
