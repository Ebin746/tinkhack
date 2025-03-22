"use client";
import { useState } from "react";
import RepoInput from "@/components/RepoInput";
import AnalysisResult from "@/components/AnalysisResult";
import DiagramViewer from "@/components/DiagramViewer";
import ExportButton from "@/components/ExportButton";

export default function Home() {
  const [repoName, setRepoName] = useState<string | null>(null);
  const [mermaidSyntax, setMermaidSyntax] = useState<string | null>(null);

  const handleAnalyze = async (repo: string) => {
    setRepoName(repo);

    // Fetch architectural diagram data from Gemini API
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        body: JSON.stringify({ repo }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      console.log(data.mermaidSyntax)
      if (response.ok && data.mermaidSyntax) {
        setMermaidSyntax(data.mermaidSyntax);
      } else {
        console.error("Failed to generate diagram.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold text-center mb-6">GitHub Codebase Analyzer</h1>
      <RepoInput onAnalyze={handleAnalyze} />

     <AnalysisResult repoName={repoName} />

      {mermaidSyntax && (
        <div className="mt-8">
          <DiagramViewer mermaidSyntax={mermaidSyntax} />
          <ExportButton targetId="mermaid-diagram" />
        </div>
      )}
    </main>
  );
}
