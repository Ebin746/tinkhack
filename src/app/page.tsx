"use client";
import { useState } from "react";
import RepoInput from "@/components/RepoInput";
import AnalysisResult from "@/components/AnalysisResult";


export default function Home() {
  

  

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold text-center mb-6">GitHub Codebase Analyzer</h1>
      <RepoInput  />

     <AnalysisResult />



     
    </main>
  );
}
