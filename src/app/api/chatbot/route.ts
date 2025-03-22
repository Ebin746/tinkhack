import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const chatHistory: { role: string; content: string }[] = [];
export async function POST(req: Request) {
    try {
        const { message } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "Message is required." }, { status: 400 });
        }

        // Load README content
        const readmeFilePath = path.join(process.cwd(), "finalReadme", "README.md");
        if (!fs.existsSync(readmeFilePath)) {
            return NextResponse.json({ error: "README.md not found." }, { status: 400 });
        }
        const content = fs.readFileSync(readmeFilePath, "utf8");

        // Append user message to history
        chatHistory.push({ role: "user", content: message });
        // Construct prompt with chat history & README context
        const prompt = `
You are an AI assistant helping users understand a codebase.
Here is the project README for context:
"""
${content}
"""
Previous Conversation:
${chatHistory.map(chat => `${chat.role}: ${chat.content}`).join("\n")}
User: ${message}
AI:
`;
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const reply = result.response.text();

        // Append AI response to chat history
        chatHistory.push({ role: "AI", content: reply });
        return NextResponse.json({ reply });
    } catch (error) {
        console.error("Chatbot Error:", error);
        return NextResponse.json({ error: "Failed to generate chatbot response." }, { status: 500 });
    }
}
