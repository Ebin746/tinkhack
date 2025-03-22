
import RepoInput from "@/components/RepoInput";
import AnalysisResult from "@/components/AnalysisResult";
import Chatbot from "@/components/Chatbot";
import Summarizer from "@/components/Summarizer";

export default function Dashboard() {
    


    return (
 <main className="container mx-auto p-8 bg-white text-black min-h-screen">
       <h1 className="text-4xl font-extrabold text-center mb-8 text-gray-800">
         GitHub Codebase Analyzer
       </h1>
       <p className="text-lg text-center text-gray-600 mb-12">
         Analyze your GitHub repositories, generate insights, and interact with an AI-powered chatbot for assistance.
       </p>
       <div className="space-y-12">
         <RepoInput />
         <AnalysisResult />
         <Chatbot />
         <Summarizer />
       </div>
     </main>
    );
}