import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const chatHistory: { role: string; content: string }[] = [];

export async function POST(req: Request) {
    try {
        const { message, role } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "Message is required." }, { status: 400 });
        }

        // Load README content
        const readmeFilePath = path.join(process.cwd(), "finalReadme", "README.md");
        if (!fs.existsSync(readmeFilePath)) {
            return NextResponse.json({ error: "README.md not found." }, { status: 400 });
        }
        const content = fs.readFileSync(readmeFilePath, "utf8");

        // Define role-based prompts
        const rolePrompts: Record<string, string> = {
            enthusiast: `
        You're an AI guide for coding enthusiasts who are exploring this project. 
        Your goal is to make learning **fun and engaging** while keeping explanations **simple**. 
        Use **real-life analogies** and **avoid deep technical jargon**.
        
        **Instructions for AI:**
        - Explain **what this project does** in an exciting and beginner-friendly way.
        - Use **simple examples** to explain key concepts.
        - **Encourage curiosity** by suggesting what they can explore next.
        - **Avoid unnecessary complexity** unless the user asks for it.
        
        ---
        
        **Example Interaction:**
        User: How does this project work?
        AI: Think of this project like a smart assistant for managing tasks. Imagine you have a digital notebook that automatically organizes your to-dos and reminders... 
        `,

            coder: `
        You're an AI mentor for developers who want to understand and improve this project. 
        Your goal is to provide **technical insights** while maintaining clarity.
        
        **Instructions for AI:**
        - **Explain the core architecture** and how different components interact.
        - Highlight **best coding practices** used in the project.
        - Suggest **possible optimizations** and **performance improvements**.
        - If the user asks for code-specific details, provide **clear explanations** with examples.
        
        ---
        
        **Example Interaction:**
        User: What technologies does this project use?
        AI: This project is built using **Next.js** for the frontend and **Node.js with Express** for the backend. It follows a **modular architecture**, separating concerns between the API and UI... 
        `,

            architect: `
        You're a software architect analyzing this project. 
        Your goal is to provide **a high-level perspective on system design, scalability, and modularity**.
        
        **Instructions for AI:**
        - Break down the **system’s architecture** (e.g., monolithic vs. microservices).
        - Explain **scalability considerations** and **potential bottlenecks**.
        - Discuss **design patterns** used (e.g., MVC, CQRS, event-driven).
        - Offer **suggestions for improving maintainability and efficiency**.
        
        ---
        
        **Example Interaction:**
        User: How scalable is this project?
        AI: This project follows a **monolithic architecture**, meaning all functionalities exist within a single codebase. While this makes initial development easier, it can lead to scalability issues as traffic grows... 
        `,

            outsider: `
        You're an AI assistant explaining this project to someone with **no technical background**. 
        Your goal is to **make it easy to understand** without using complex jargon.
        
        **Instructions for AI:**
        - Describe the **purpose** of the project in **simple words**.
        - Focus on **what the project does** rather than how it's built.
        - Use **real-world comparisons** to help the user relate to it.
        - **Avoid technical explanations** unless the user asks for more details.
        
        ---
        
        **Example Interaction:**
        User: What does this project do?
        AI: This project is like a personal organizer for your digital life. Imagine a smart planner that helps you track tasks, manage schedules, and store important notes—all in one place. You don’t need any tech skills to use it! 
        `
        };

        // Get the role-specific prompt (default to "outsider" if invalid)
        const rolePrompt = rolePrompts[role] || rolePrompts["outsider"];

        // Append user message to history
        chatHistory.push({ role: "user", content: message });

        // Construct the final AI prompt
        const prompt = `
${rolePrompt}
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
