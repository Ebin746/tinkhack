"use client";
import { useState, useEffect } from "react";
import mermaid from "mermaid";

// Function to clean up the analysis output for Mermaid rendering
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

  // Fetch analysis from the API
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

  // Open the Mermaid graph in a new tab with download functionality
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
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            #graphDiv { margin-top: 20px; }
            button { padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; }
            button:hover { background-color: #45a049; }
          </style>
          <script>
            document.addEventListener("DOMContentLoaded", () => {
              mermaid.initialize({ startOnLoad: true, theme: "default" });
              const div = document.querySelector("#graphDiv");
              div.textContent = ${JSON.stringify(analysis)};
              mermaid.init(undefined, div);

              // Add download button functionality
              document.getElementById("downloadImgBtn").addEventListener("click", () => {
                const svg = document.querySelector("#graphDiv svg");
                if (!svg) {
                  alert("No graph to download.");
                  return;
                }

                // Create a canvas to draw the SVG
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                const svgData = new XMLSerializer().serializeToString(svg);
                const img = new Image();

                img.onload = () => {
                  canvas.width = img.width;
                  canvas.height = img.height;
                  context.drawImage(img, 0, 0);

                  // Convert canvas to PNG and trigger download
                  const url = canvas.toDataURL("image/png");
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "mermaid-graph.png";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                };

                img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
              });
            });
          </script>
        </head>
        <body>
          <h1>Generated Mermaid Graph</h1>
          <button id="downloadImgBtn">Download Graph as PNG</button>
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

  // Component UI
  return (
    <div className="p-6 border rounded-lg shadow-lg bg-white mt-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Analysis Result</h2>
      <p className="text-gray-600 mb-4">
        Generate an analysis of the repository and view the results as a Mermaid graph.
      </p>
      <button
        onClick={fetchAnalysis}
        className={`mt-4 px-6 py-3 rounded-lg text-white font-medium transition ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
        }`}
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate Analysis"}
      </button>

      {analysis && (
        <button
          onClick={openGraphInNewTab}
          className="mt-4 ml-4 px-6 py-3 rounded-lg text-white font-medium bg-blue-500 hover:bg-blue-600 transition"
        >
          View Graph in New Tab
        </button>
      )}

      {error && (
        <p className="text-red-600 mt-4 border border-red-200 bg-red-50 p-3 rounded">
          {error}
        </p>
      )}
    </div>
  );
}