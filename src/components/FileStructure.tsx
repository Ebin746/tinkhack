"use client";
import { useState, useEffect } from "react";
import { FaFolder, FaFolderOpen, FaFileAlt } from "react-icons/fa"; // Icons for folders and files

// Component for rendering the folder structure with collapsibility
function FileTree({ structure }: { structure: Array<{ type: string; name: string; children?: any[] }> }) {
  return (
    <ul className="space-y-2">
      {structure.map((item, index) => (
        <li key={index}>
          {item.type === "folder" ? (
            <CollapsibleFolder name={item.name} children={item.children || []} />
          ) : (
            <div className="pl-6 flex items-center gap-2 text-blue-500 hover:text-blue-700">
              <FaFileAlt /> {item.name}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

// Collapsible folder component
function CollapsibleFolder({ name, children }: { name: string; children: Array<{ type: string; name: string; children?: any[] }> }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors duration-200"
      >
        {isOpen ? <FaFolderOpen className="text-yellow-500" /> : <FaFolder className="text-yellow-500" />}
        {name}
      </button>
      {isOpen && (
        <div className="pl-6 border-l border-gray-300 ml-2">
          <FileTree structure={children} />
        </div>
      )}
    </div>
  );
}

// Main Page Component to Render the File Structure
export default function FileTreeRenderer() {
  const [fileStructure, setFileStructure] = useState<Array<{ type: string; name: string; children?: any[] }>>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch file structure from the API
    const fetchFolderStructure = async () => {
      try {
        const response = await fetch("/api/folderStructure");
        if (!response.ok) {
          throw new Error("Failed to fetch folder structure");
        }
        const data = await response.json();
        setFileStructure(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    fetchFolderStructure();
  }, []);

  console.log(fileStructure);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">📂 Folder Structure</h1>
      {error && <p className="text-red-500">{error}</p>}
      <div className="bg-white shadow-md rounded-lg p-4">
        <FileTree structure={fileStructure} />
      </div>
    </div>
  );
}