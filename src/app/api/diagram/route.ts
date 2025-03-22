import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    // Parse the request body, defaulting to an empty object if missing
    let requestData: any = {};
    try {
      requestData = await req.json();
    } catch {
      requestData = {} ;
    }
    // If no level is passed, default to high-level
    const level = requestData.level || "high";

    // Define directory and file path
    const finalReadmeDir = path.join(process.cwd(), "finalReadme");
    const readmeFilePath = path.join(finalReadmeDir, "README.md");

    // Check if README.md exists
    if (!fs.existsSync(readmeFilePath)) {
      return NextResponse.json({ error: "README.md file not found." }, { status: 400 });
    }

    // Read file content
    const content = fs.readFileSync(readmeFilePath, "utf8");

    // Define prompt based on level option
    let prompt = "";
    if (level === "low") {
      prompt = `
Analyze the following codebase and generate a Mermaid.js diagram in graph TD syntax for a low-level technical view.
Include detailed class structures, methods, properties, and interactions with icons.
Codebase:
"""
${content}
"""
Ensure the output is **pure Mermaid.js graph TD syntax** without additional explanations.
Use [ ] for nodes without / or \\ characters.
`;
    } else {
      prompt = `
Analyze the following codebase and generate a Mermaid.js diagram in graph TD syntax for a high-level overview.
Focus on major modules, their interactions, and overall system architecture with representative icons.
Codebase:
"""
${content}
"""
Ensure the output is **pure Mermaid.js graph TD syntax** without additional explanations.
Use [ ] for nodes without / or \\ characters.
`;
    }

    // Generate the diagram using Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    return NextResponse.json({ analysis: reply });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "An error occurred while generating the response." },
      { status: 500 }
    );
  }
}
