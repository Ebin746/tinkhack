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
        <div className="fixed bottom-20 right-4 sm:right-8 w-72 sm:w-96 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Chatbot</h3>
            <button
              onClick={toggleChatbot}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label="Close Chatbot"
            >
              ✖
            </button>
          </div>
          <div className="p-4 max-h-80 overflow-y-auto">
            <Chatbot onClose={toggleChatbot} />
          </div>
        </div>
      )}
    </main>
  );
}