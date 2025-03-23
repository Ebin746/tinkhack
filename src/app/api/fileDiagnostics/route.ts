import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Function to recursively search for the file
function findFileRecursively(dir: string, fileName: string): string | null {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const found = findFileRecursively(fullPath, fileName); // Recursively search in subdirectories
      if (found) return found;
    } else if (file === fileName) {
      return fullPath; // Return the full path when the file is found
    }
  }
  return null; // Return null if the file is not found
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const filePath = searchParams.get("file");

  if (!filePath) {
    return new NextResponse(JSON.stringify({ diagnostics: "No file specified." }), { status: 400 });
  }

  try {
    const baseDir = path.join(process.cwd(), "project"); // Replace "myFiles" with your folder name
    const fileFullPath = findFileRecursively(baseDir, filePath); // Recursively search for the file

    if (!fileFullPath) {
      return new NextResponse(JSON.stringify({ diagnostics: "File not found." }), { status: 404 });
    }

    const fileContent = fs.readFileSync(fileFullPath, "utf-8");
    console.log("File Content:", fileContent);
    const lineCount = fileContent.split("\n").length;
    const wordCount = fileContent.split(/\s+/).length;

    const diagnostics = `File: ${filePath}\nLines: ${lineCount}\nWords: ${wordCount}\n\nContent:\n${fileContent}`;
    return new NextResponse(JSON.stringify({ diagnostics }), { status: 200 });
  } catch (error) {
    console.error("Error reading the file:", error);
    return new NextResponse(JSON.stringify({ diagnostics: "Error reading file." }), { status: 500 });
  }
}