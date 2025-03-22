"use client";
import { useState } from "react";

export default function AnalysisResult() {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAnalysis = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (response.ok) {
        setAnalysis(data.analysis);
      } else {
        setError(data.error || "Failed to analyze the repository.");
      }
    } catch (err) {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded mt-4">
      <h2 className="text-lg font-bold">Analysis Result</h2>
      <button
        onClick={fetchAnalysis}
        className="mt-2 bg-green-500 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate Analysis"}
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}
      {analysis && <pre className="mt-4 p-2">{analysis}</pre>}
    </div>
  );
}
