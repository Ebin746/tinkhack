import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { mermaidSyntax } = await req.json();
    if (!mermaidSyntax) return NextResponse.json({ error: "Mermaid syntax required" }, { status: 400 });

    // Generate SVG from Mermaid (Can integrate Puppeteer for server-side rendering)
    return NextResponse.json({ diagram: mermaidSyntax });
  } catch (error) {
    console.error("Diagram Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate diagram" }, { status: 500 });
  }
}
