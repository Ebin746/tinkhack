import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length === 0 || vecB.length === 0) {
    console.error("Invalid vectors:", { vecA, vecB });
    return 0;
  }
  if (vecA.length !== vecB.length) {
    console.error("Vector length mismatch:", { vecA_length: vecA.length, vecB_length: vecB.length });
    return 0;
  }
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magA * magB) || 0;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: Request) {
  try {
    let json;
    try {
      json = await req.json();
    } catch {
      json = {};
    }
    const role = json.role || "outsider";

    const finalReadmeDir = path.join(process.cwd(), "finalReadme");
    const readmeFilePath = path.join(finalReadmeDir, "README.md");

    if (!fs.existsSync(readmeFilePath)) {
      return NextResponse.json({ error: "README.md file not found." }, { status: 400 });
    }

    const content = fs.readFileSync(readmeFilePath, "utf8");
    console.log("Total content length:", content.length);

    const chunkSize = 10000;
    const chunks = [];
    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.slice(i, i + chunkSize));
    }
    console.log("Number of chunks:", chunks.length);

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);
    const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

    // Sample fewer chunks to reduce requests
    const sampledChunks = chunks.length > 5 ? chunks.slice(0, 5) : chunks;

    const chunkEmbeddings = await Promise.all(
      sampledChunks.map(async (chunk, i) => {
        await delay(i * 1000); // 1-second delay
        try {
          const res = await embeddingModel.embedContent(chunk);
          return res.embedding;
        } catch (e) {
          console.error(`Error embedding chunk ${i}:`, e);
          return [];
        }
      })
    );

    let queryEmbedding;
    await delay(1000);
    try {
      const query = "project purpose, features, structure, dependencies, functionality";
      const queryRes = await embeddingModel.embedContent(query);
      queryEmbedding = queryRes.embedding;
    } catch (e) {
      console.error("Error embedding query:", e);
      queryEmbedding = null;
    }

    let combinedContent;
    if (chunkEmbeddings.every(emb => emb.length === 0) || !queryEmbedding) {
      console.warn("Embedding failed, using sampled fallback content");
      combinedContent = chunks.slice(0, 3).join("\n");
    } else {
      const scoredChunks = chunkEmbeddings
        .map((emb, i) => ({ score: cosineSimilarity(emb, queryEmbedding), chunk: sampledChunks[i] }))
        .filter(item => !isNaN(item.score))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      combinedContent = scoredChunks.map(item => item.chunk).join("\n");
    }

    const maxInputLength = 30000;
    combinedContent = combinedContent.slice(0, maxInputLength);
    if (!combinedContent) {
      combinedContent = content.slice(0, maxInputLength);
    }

    const prompts: Record<string, string> = {
      enthusiast: `
        You're an **enthusiast** exploring this project! 
        Give a simple overview of the codebase, its **cool features**, and how someone can start using it.
        Codebase: """${combinedContent}"""
        Provide an **exciting and beginner-friendly summary**.
      `,
      coder: `
        You're a **coder** diving into this project. 
        Summarize the **core functionalities, key libraries, and technical challenges**.
        Codebase: """${combinedContent}"""
        Provide a **developer-oriented summary** with a focus on implementation details.
      `,
      architect: `
        You're a **software architect** analyzing this project. 
        Explain its **high-level design, system architecture, and scalability considerations**.
        Codebase: """${combinedContent}"""
        Provide a **detailed architectural summary**, highlighting design choices.
      `,
      outsider: `
        You're an **outsider** with no prior knowledge of this project.
        Explain what this project does in **simple, clear terms** without technical jargon.
        Codebase: """${combinedContent}"""
        Provide a **plain-language summary** for non-technical users.
      `,
    };

    const prompt = prompts[role] || prompts["outsider"];
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    return NextResponse.json({ summary: reply, role });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "An error occurred while generating the response." }, { status: 500 });
  }
}