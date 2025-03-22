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
      requestData = {};
    }
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

    // Step 1: Chunk the content
    const chunkSize = 1000; // ~250-350 words, adjust based on content
    const chunks = [];
    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.slice(i, i + chunkSize));
    }

    // Step 2: Retrieve relevant chunks (RAG - keyword-based)
    const relevantKeywords = [
      "import", "class", "function", "extends", "implements", "require", "module",
      "file", "dependency", "call", "relationship", "subgraph", "node"
    ];
    const relevantChunks = chunks.filter(chunk =>
      relevantKeywords.some(keyword => chunk.toLowerCase().includes(keyword))
    );

    // Combine and limit retrieved content
    const maxInputLength = 5000; // Adjust based on Gemini token limit
    let combinedContent = relevantChunks.join("\n").slice(0, maxInputLength);
    if (!combinedContent) {
      combinedContent = content.slice(0, maxInputLength); // Fallback to truncated full content
    }
    // Define prompt based on level option
    let prompt = "";
    console.log(content.toString().length)
console.log(combinedContent.toString().length)
      prompt = `
Analyze the following codebase and generate a Mermaid.js diagram in **graph TD** syntax.

  ### Requirements:
  - Extract **file relationships** by analyzing class dependencies, function calls, imports, and inheritance within the code.
  - Visualize connections between files and their contents (e.g., functions, classes, variables).
  - Use arrows ("-->", "-.->", "==>") to represent the relationships based on their context.
    - "-->" for direct relationships (e.g., function calls or object creation).
    - "-.->" for indirect or loose connections (e.g., references or event emissions).
    - "==>" for inheritance or implementation.
  - Emojis are **only used inside node labels** (e.g., 📄 infpost.java or 🧑‍💻 ClassA).
  - Avoid using special characters like emojis, parentheses, or non-ASCII characters in node IDs. If necessary, wrap the labels in double quotes.
  - Ensure all node IDs are clean and alphanumeric (e.g., file1, ControllerActivity, themesNight). Avoid using spaces or special characters.
  - If a file has similar names across folders, append a contextual suffix to the node ID e.g., themesNightXml instead of themes.xml night.
  - After generating the Mermaid diagram, validate the syntax using Mermaid's built-in validation or an online Mermaid editor.
  - Ensure all clickable links use clean and properly encoded URLs. Double-check for broken or malformed links.
  - If using special labels like 📄, enclose them in double quotes to avoid syntax errors e.g., [📄 "Example.xml"].
  - Include error handling in Mermaid rendering to display detailed messages when diagrams fail to load.
  - **Subgraph names do not contain emojis.**
  - Use appropriate class definitions for styling, applying distinct colors for ".java" and ".md" files.
  - Apply color combinations that are **easy on the eyes.**
  - Maintain a clean, organized structure with clear connections.
  - **Split into logical subparts**:
    - Group related files into subgraphs.
    - Maintain small, readable clusters without overwhelming detail.
    - Make the diagram vertical for easy navigation.

  - **Enhance readability**:
    - DO NOT PUT THEME NAMES IN PARENTHESES, JUST PUT THEM IN THE NODE LABELS.

- **Maintain readability**:
  - Ensure font size is **large enough** to be readable without zooming.
  - Adjust node spacing and subgraph spacing to ensure clarity.

- **Enable zoom and pan**:
  - Make the diagram interactive with zoom and pan functionality.

- **Add clickable links**:
  - Generate clickable links for files, classes, and functions using Mermaid's "click" feature.
  - Use file names and functions to predict link paths, assuming the links follow this pattern:
    - https://github.com/<repo_owner>/<repo_name>/blob/main/<file_path>

- **Apply background colors**:
  - Differentiate between ".java", ".js", ".md", and ".ts" files using color-coded nodes.
  - Use appropriate class definitions for better visualization.

  ### Example Structure:
  graph BT
      subgraph Project
          a["📄 infpost.java"]:::java
          b["📄 infpre.java"]:::java
          c["📄 prepost.java"]:::java
          d["📄 README.md"]:::md
          e["📄 Stack.java"]:::java
      end

      a --> e
      b -.-> a
      e ==> c

      class a,b,c,e java;
      class d md;

      classDef java fill:#ADD8E6,stroke:#333,stroke-width:2px;
      classDef md fill:#F0E68C,stroke:#333,stroke-width:2px;

  ### Codebase:
  "${combinedContent}"

  ### Important:
  - Output only from 'graph TD' onwards, without additional explanations.
  - Ensure the output is **pure Mermaid.js graph TD syntax**.
  - No additional comments or code explanations should be included.
  - Double-check for Mermaid.js syntax issues like:
    - Incorrect emoji or symbol rendering.
    - Improper classDef usage.
    - Missing connections or subgraph definitions.
    - Unbalanced or mismatched syntax.
  - Within each subgraph, ensure the flow is explicitly defined using "direction TB".
  - If a subgraph does not visually align vertically, add dummy nodes or invisible links using "-.->" to balance the layout.

  EXAMPLE:
    graph TB
    subgraph Project
        direction TB
        a["📄 infpost.java"]:::java
        b["📄 infpre.java"]:::java
    end
    subgraph App
        direction TB
        c["📄 prepost.java"]:::java
        d["📄 README.md"]:::md
    end
    a --> c
    b -.-> d

  - Apply "classDef" styles to set distinct node and subgraph spacing using padding and margins.
  - Ensure nodes are not cramped or overlapping by defining node width using "padding" in class definitions.

  EXAMPLE:
    graph TB
    subgraph Backend
        direction TB
        A["Service A"]
        B["Service B"]
    end
    subgraph Frontend
        direction TB
        C["UI Component A"]
        D["UI Component B"]
    end
    A --> B
    C --> D
    B -.-> C

    classDef java fill:#ADD8E6,stroke:#333,stroke-width:2px,padding:10px;
    classDef md fill:#F0E68C,stroke:#333,stroke-width:2px,padding:10px;

  - Use invisible or dummy nodes (e.g., "EmptyNode") to balance subgraphs and enforce vertical alignment.
  - Apply invisible connections using "-.->" for fine-tuning the layout.

  EXAMPLE:
    graph TB
    EmptyNode1[" "]
    EmptyNode2[" "]
    subgraph Backend
        direction TB
        A["Service A"]
        B["Service B"]
    end
    subgraph Frontend
        direction TB
        C["UI Component A"]
        D["UI Component B"]
    end

    EmptyNode1 -.-> Backend
    Backend -.-> EmptyNode2
    EmptyNode2 -.-> Frontend

  - The output should **always begin with graph TD** and must not contain the word 'mermaid' at the start.
  - DO NOT PUT THEME NAMES IN PARENTHESES, JUST PUT THEM IN THE NODE LABELS.  
    Example: Incorrect: themesNightXml["📄 themes.xml (night)"]  
    Correct: themesNightXml["📄 themes.xml night"]  

  Only produce error-free, visually clear Mermaid.js output.
`;
    

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
