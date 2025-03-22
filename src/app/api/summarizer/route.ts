import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
    try {
        // Read and parse the request body safely
        let json;
        try {
            json = await req.json();
        } catch {
            json = {}; // If parsing fails, treat it as an empty object
        }

        // Extract role, default to "outsider" if not provided
        const role = json.role || "outsider";

        // Define directory and file path
        const finalReadme = "finalReadme";
        const finalReadmeDir = path.join(process.cwd(), finalReadme);
        const readmeFilePath = path.join(finalReadmeDir, "README.md");

        // Check if README.md exists
        if (!fs.existsSync(readmeFilePath)) {
            return NextResponse.json({ error: "README.md file not found." }, { status: 400 });
        }

        // Read file content
        const content = fs.readFileSync(readmeFilePath, "utf8");

        // Define different prompts based on role
        const prompts: Record<string, string> = {
            enthusiast: `
            You're an **enthusiast** exploring this project! 
            Give a simple overview of the codebase, its **cool features**, and how someone can start using it.

            Codebase:
            """
            ${content}
            """
            Provide an **exciting and beginner-friendly summary**.
            `,
            coder: `
            You're a **coder** diving into this project. 
            Summarize the **core functionalities, key libraries, and technical challenges**.

            Codebase:
            """
            ${content}
            """
            Provide a **developer-oriented summary** with a focus on implementation details.
            `,
            architect: `
            You're a **software architect** analyzing this project. 
            Explain its **high-level design, system architecture, and scalability considerations**.

            Codebase:
            """
            ${content}
            """
            Provide a **detailed architectural summary**, highlighting design choices.
            `,
            outsider: `
            You're an **outsider** with no prior knowledge of this project.
            Explain what this project does in **simple, clear terms** without technical jargon.

            Codebase:
            """
            ${content}
            """
            Provide a **plain-language summary** for non-technical users.
            `,
        };

        // Select the prompt based on the role
        const prompt = prompts[role] || prompts["outsider"];

        // Generate response using Google Generative AI
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const reply = result.response.text();

        return NextResponse.json({ summary: reply, role });
    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json(
            { error: "An error occurred while generating the response." },
            { status: 500 }
        );
    }
}
