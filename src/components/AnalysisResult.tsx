"use client";
import { useState } from "react";

export default function AnalysisResult() {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [level, setLevel] = useState("high"); // Default to high level

  const fetchAnalysis = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
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
    <div className="p-6 border rounded-lg shadow-lg bg-white mt-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Analysis Result</h2>
      <p className="text-gray-600 mb-6">
        Select the analysis level and click the button below to analyze the repository and generate insights.
      </p>
      <div className="mb-4">
        <label className="mr-4">
          <input
            type="radio"
            name="level"
            value="high"
            checked={level === "high"}
            onChange={(e) => setLevel(e.target.value)}
            className="mr-2"
          />
          High Level
        </label>
        <label>
          <input
            type="radio"
            name="level"
            value="low"
            checked={level === "low"}
            onChange={(e) => setLevel(e.target.value)}
            className="mr-2"
          />
          Low Level
        </label>
      </div>
      <button
        onClick={fetchAnalysis}
        className={`px-6 py-3 rounded-lg text-white font-medium transition ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
        }`}
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate Analysis"}
      </button>

      {error && (
        <p className="text-red-600 mt-4 border border-red-200 bg-red-50 p-3 rounded">
          {error}
        </p>
      )}
      {analysis && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg shadow-inner">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Analysis Output:</h3>
          <pre className="text-sm text-gray-800 overflow-auto">{analysis}</pre>
        </div>
      )}
    </div>
  );
}