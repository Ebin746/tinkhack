"use client";
import { useState, useEffect } from "react";
import { FaFolder, FaFolderOpen, FaFileAlt } from "react-icons/fa"; // Icons for folders and files
import LowLevelDiagram from "./LowLevelDiagram";
import ClassDiagram from "./ClassDiagram";

// Component for rendering the folder structure with collapsibility
function FileTree({
  structure,
  onFileClick,
}: {
  structure: Array<{ type: string; name: string; children?: any[] }>;
  onFileClick: (filePath: string) => void;
}) {
  return (
    <ul className="space-y-2">
      {structure.map((item, index) => (
        <li key={index}>
          {item.type === "folder" ? (
            <CollapsibleFolder
              name={item.name}
              children={item.children || []}
              onFileClick={onFileClick}
            />
          ) : (
            <div
              onClick={() => onFileClick(item.name)} // Pass file name (or full path if needed)
              className="pl-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 cursor-pointer transition-colors duration-200"
            >
              <FaFileAlt className="text-gray-500" /> {item.name}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

// Collapsible folder component
function CollapsibleFolder({
  name,
  children,
  onFileClick,
}: {
  name: string;
  children: Array<{ type: string; name: string; children?: any[] }>;
  onFileClick: (filePath: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
      >
        {isOpen ? (
          <FaFolderOpen className="text-yellow-500" />
        ) : (
          <FaFolder className="text-yellow-500" />
        )}
        {name}
      </button>
      {isOpen && (
        <div className="pl-6 border-l border-gray-300 ml-2">
          <FileTree structure={children} onFileClick={onFileClick} />
        </div>
      )}
    </div>
  );
}

// Main Page Component to Render the File Structure
export default function FileTreeRenderer() {
  const [fileStructure, setFileStructure] = useState([]);
  const [error, setError] = useState("");
  const [fileDiagnostics, setFileDiagnostics] = useState("");
  const [selectedFileContent, setSelectedFileContent] = useState(""); // Store the file content separately
  const [selectedFileType, setSelectedFileType] = useState<"lowLevel" | "classDiagram" | null>(null); // Track the selected diagram type

  useEffect(() => {
    const fetchFolderStructure = async () => {
      try {
        const response = await fetch("/api/folderStructure");
        if (!response.ok) {
          throw new Error("Failed to fetch folder structure");
        }
        const data = await response.json();
        console.log("Fetched File Structure:", data); // Debug log
        setFileStructure(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    fetchFolderStructure();
  }, []);

  const handleFileClick = async (filePath: string) => {
    try {
      const response = await fetch(`/api/fileDiagnostics?file=${encodeURIComponent(filePath)}`);
      const data = await response.json();
      console.log("Fetched File Diagnostics:", data);
      setFileDiagnostics(data.diagnostics);

      // Extract file content and store it
      const contentStartIndex = data.diagnostics.indexOf("\n\nContent:\n");
      if (contentStartIndex !== -1) {
        setSelectedFileContent(data.diagnostics.slice(contentStartIndex + 11)); // Trim prefix
      }
    } catch (err) {
      setFileDiagnostics("Failed to fetch diagnostics for the selected file.");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">📂 Folder Structure</h1>
      {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}

      <div className="bg-white shadow-lg rounded-lg p-6">
        <FileTree structure={fileStructure} onFileClick={handleFileClick} />
      </div>

      {/* Render Diagrams First */}
      {selectedFileContent && (
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => setSelectedFileType("lowLevel")}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedFileType === "lowLevel"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            Low-Level Diagram
          </button>
          <button
            onClick={() => setSelectedFileType("classDiagram")}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedFileType === "classDiagram"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            Class Diagram
          </button>
        </div>
      )}

      {selectedFileContent && selectedFileType === "lowLevel" && (
        <div className="mt-6 bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Low-Level Diagram</h2>
          <LowLevelDiagram fileContent={selectedFileContent} />
        </div>
      )}

      {selectedFileContent && selectedFileType === "classDiagram" && (
        <div className="mt-6 bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Class Diagram</h2>
          <ClassDiagram fileContent={selectedFileContent} />
        </div>
      )}

      {/* Render File Content at the Bottom */}
      {fileDiagnostics && (
        <div className="mt-6 p-6 bg-white shadow-lg rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">File Content</h2>
          <pre className="mt-2 text-gray-700 bg-gray-100 p-4 rounded-lg overflow-auto">
            {fileDiagnostics}
          </pre>
        </div>
      )}
    </div>
  );
}