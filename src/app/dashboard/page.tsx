"use client";
import { useState } from "react";
import RepoInput from "@/components/RepoInput";
import AnalysisResult from "@/components/AnalysisResult";
import Chatbot from "@/components/Chatbot";
import Summarizer from "@/components/Summarizer";
import FileTreeRenderer from "@/components/FileStructure";
export default function Dashboard() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const toggleChatbot = () => {
      setIsChatbotOpen(!isChatbotOpen);
  };

  return (
    <main className="container mx-auto p-8 bg-white text-black min-h-screen relative">
      <h1 className="text-4xl font-extrabold text-center mb-8 text-gray-800">
        GitHub Codebase Analyzer
      </h1>
      <p className="text-lg text-center text-gray-600 mb-12">
        Analyze your GitHub repositories, generate insights, and interact with an AI-powered chatbot for assistance.
      </p>
      <div className="space-y-12">
        <RepoInput />
        <AnalysisResult />
        <Summarizer />
        <FileTreeRenderer/>
      </div>

      {/* Chatbot Icon */}
      <button
        onClick={toggleChatbot}
        className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Open Chatbot"
      >
        💬
      </button>

      {/* Chatbot Popup */}
      {isChatbotOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="relative w-full max-w-lg h-full max-h-[90vh] bg-white rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={toggleChatbot}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label="Close Chatbot"
            >
              ✖
            </button>
            <Chatbot />
          </div>
        </div>
      )}
    </main>
  );
}