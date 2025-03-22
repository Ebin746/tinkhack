import AnalysisResult from "@/components/AnalysisResult";
import Chatbot from "@/components/Chatbot";
import RepoInput from "@/components/RepoInput";
import Summarizer from "@/components/Summarizer";
import { notFound } from "next/navigation";

type Props = {
    params: { role: string };
};

export default function Dashboard({ params }: Props) {
    const { role } = params;

    // Define role-specific content
    const roleDetails: Record<string, string> = {
        enthusiast: "enthusiast",
        coder: "coder",
        architect: "architect",
        outsider: "outsider",
    };

    // Handle invalid roles
    if (!roleDetails[role]) {
        return notFound();
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-6">
        <h1 className="text-3xl font-bold">{roleDetails[role]}</h1>

    </div>
    );
}