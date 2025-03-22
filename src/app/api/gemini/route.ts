import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs"
import path from "path"
export async function POST(req: Request) {
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

       // Improved prompt structure
       const prompt = `
       Analyze the given codebase and generate only a Mermaid.js class diagram representing its structure. 
       Ensure that the diagram accurately reflects the classes, their attributes, methods, and relationships.
       
       Codebase:
       """
       ${content}
       """
       
       Output should strictly be in Mermaid.js syntax without any additional explanations or text.
       `;
       
       
       

    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const reply = result.response.text();
        return NextResponse.json({  analysis:reply })
    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json(
            { error: "An error occurred while generating the response." },
            { status: 500 }
        );
    }
}
