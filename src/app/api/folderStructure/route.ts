import fs from "fs";
import path from "path";

export function extractFilePaths(readmePath: string): string[] {
  const filePaths: string[] = [];
  const fileContent = fs.readFileSync(readmePath, "utf-8");

  const lines = fileContent.split("\n");
  let inFileList = false;

  for (const line of lines) {
    // Check if we are in the "File List" section
    if (line.trim() === "## File List") {
      inFileList = true;
      continue;
    }

    // Exit the "File List" section when encountering "## File Contents"
    if (line.trim() === "## File Contents") {
      break;
    }

    // If in the "File List" section, extract file paths
    if (inFileList && line.trim().startsWith("- ")) {
      const filePath = line.trim().substring(2); // Remove the "- " prefix
      filePaths.push(filePath);
    }
  }

  return filePaths;
}

function buildFileStructure(filePaths: string[]): Array<{ type: string; name: string; children?: any[] }> {
  const root: any = {};

  filePaths.forEach((filePath) => {
    const parts = filePath.split(path.sep); // Split the path into parts
    let current = root;

    parts.forEach((part, index) => {
      if (!current[part]) {
        current[part] = index === parts.length - 1 ? { type: "file", name: part } : { type: "folder", name: part, children: {} };
      }
      current = current[part].children || current[part];
    });
  });

  // Convert the nested object into an array
  function convertToArray(node: any): any[] {
    return Object.values(node).map((child: any) => {
      if (child.children) {
        return { ...child, children: convertToArray(child.children) };
      }
      return child;
    });
  }

  return convertToArray(root);
}

// Handle GET requests
export async function GET() {
  try {
    const readmePath = path.join(process.cwd(), "finalReadme", "README.md");

    if (!fs.existsSync(readmePath)) {
      return new Response(JSON.stringify({ error: "README.md file not found" }), { status: 404 });
    }

    const filePaths = extractFilePaths(readmePath);
    const fileStructure = buildFileStructure(filePaths);

    return new Response(JSON.stringify(fileStructure), { status: 200 });
  } catch (error) {
    console.error("Error extracting file paths:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}