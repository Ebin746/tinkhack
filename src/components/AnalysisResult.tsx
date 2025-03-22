"use client";
import { useState, useEffect } from "react";
import mermaid from "mermaid";

function analysisOutputCorrection(analysis: string) {
  return analysis
    .replace(/\\n/g, "\n")
    .replace(/```/g, "")
    .replace(/mermaid/g, "")
    .trim();
}

export default function AnalysisResult() {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAnalysis = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (response.ok) {
        const cleanAnalysis = analysisOutputCorrection(data.analysis);
        setAnalysis(cleanAnalysis);
        console.log("Analysis:", cleanAnalysis);
      } else {
        setError(data.error || "Failed to analyze the repository.");
      }
    } catch (err) {
      setError(`Something went wrong: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const openGraphInNewTab = async () => {
    if (!analysis) return;
    try {
      const cleanedAnalysis = analysisOutputCorrection(analysis);
  
      // Open a new tab
      const newTab = window.open();
      if (newTab) {
        newTab.document.write(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Generated Mermaid Graph</title>
            <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
            <script>
              document.addEventListener("DOMContentLoaded", () => {
                mermaid.initialize({ startOnLoad: true, theme: "default" });
                const div = document.querySelector("#graphDiv");
                div.textContent = ${JSON.stringify(cleanedAnalysis)};
                mermaid.init(undefined, div);
              });
            </script>
          </head>
          <body>
            <h1>Generated Mermaid Graph</h1>
            <div id="graphDiv" class="mermaid"></div>
          </body>
          </html>
        `);
        newTab.document.close();
      } else {
        alert("Failed to open a new tab. Please allow pop-ups.");
      }
    } catch (error) {
      setError("Failed to render Mermaid graph. Please check your Mermaid.js syntax.");
      console.error("Mermaid rendering error:", error);
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

      {analysis && (
        <button
          onClick={openGraphInNewTab}
          className="mt-2 ml-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          View Graph in New Tab
        </button>
      )}

      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
