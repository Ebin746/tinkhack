import React, { useEffect, useState, useMemo } from "react";
import { Node, Edge, Background, ConnectionLineType } from "reactflow";
import ReactFlow, { ReactFlowProvider, useNodesState, useEdgesState } from "reactflow";
import "reactflow/dist/style.css"; // Import React Flow styles

interface ClassDiagramProps {
  fileContent: string;
  onClassClick: (className: string) => void; // Callback for class click
}

// Define expected Gemini output interface
interface GeminiOutput {
  classes?: Array<{
    name: string;
    inheritsFrom?: string;
    methods: Array<{
      name: string;
      parameters: string[];
      returnType: string;
    }>;
    variables: Array<{
      name: string;
      type: string;
    }>;
  }>;
  relationships?: Array<{
    source: string;
    target: string;
    type?: string;
  }>;
}

// Function to parse Gemini output (with JSON backticks handling)
const parseGeminiAnalysis = (geminiOutput: any): GeminiOutput | null => {
  try {
    const rawAnalysis = geminiOutput.analysis;
    const cleanedJsonString = rawAnalysis
      .replace(/```json/g, "") // Remove opening code block
      .replace(/```/g, ""); // Remove closing code block

    return JSON.parse(cleanedJsonString); // Parse and return cleaned JSON
  } catch (error) {
    console.error("Failed to parse Gemini analysis:", error);
    return null;
  }
};

// Custom node type for UML-like class representation
const ClassNode = ({ data }: { data: any }) => {
  return (
    <div
      style={{
        border: "1px solid #333",
        borderRadius: "5px",
        backgroundColor: "#fff",
        padding: "10px",
        width: "200px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          textAlign: "center",
          borderBottom: "1px solid #333",
          marginBottom: "5px",
        }}
      >
        {data.label}
      </div>
      <div>
        <strong>Variables:</strong>
        <ul style={{ paddingLeft: "15px" }}>
          {data.variables.map((variable: any, index: number) => (
            <li key={index}>
              {variable.type} {variable.name}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <strong>Methods:</strong>
        <ul style={{ paddingLeft: "15px" }}>
          {data.methods.map((method: any, index: number) => (
            <li key={index}>
              {method.returnType} {method.name}({method.parameters.join(", ")})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const ClassDiagram: React.FC<ClassDiagramProps> = ({ fileContent, onClassClick }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Memoize the nodeTypes object to prevent re-creation on every render
  const nodeTypes = useMemo(() => ({ custom: ClassNode }), []);

  const fetchGeminiAnalysis = async (content: string): Promise<GeminiOutput | null> => {
    try {
      const response = await fetch("/api/geminiAnalyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error("Failed to fetch analysis from Gemini");

      const data = await response.json();
      console.log("Received raw Gemini analysis:", data);

      const parsedAnalysis = parseGeminiAnalysis(data);
      if (!parsedAnalysis) throw new Error("Failed to parse Gemini analysis.");

      return parsedAnalysis;
    } catch (error) {
      console.error("Error fetching or parsing Gemini analysis:", error);
      setError("Failed to fetch or parse analysis. Check console for details.");
      return null;
    }
  };

  const processGeminiOutput = (geminiOutput: GeminiOutput) => {
    const parsedNodes: Node[] = [];
    const parsedEdges: Edge[] = [];
  
    if (geminiOutput?.classes && Array.isArray(geminiOutput.classes)) {
      geminiOutput.classes.forEach((cls, classIndex) => {
        // Add a node for each class
        parsedNodes.push({
          id: cls.name,
          data: {
            label: cls.name,
            variables: cls.variables || [],
            methods: cls.methods || [],
          },
          position: { x: classIndex * 300, y: 100 }, // Spread out classes horizontally
          draggable: true,
          type: "custom", // Use custom node type
        });
  
        // Add inheritance relationships
        if (cls.inheritsFrom) {
          if (cls.name && cls.inheritsFrom) { // Ensure both source and target are defined
            console.log(`Creating edge: source=${cls.inheritsFrom}, target=${cls.name}`);
            parsedEdges.push({
              id: `e-${cls.name}-${cls.inheritsFrom}`,
              source: cls.inheritsFrom,
              target: cls.name,
              type: "smoothstep", // Use a valid edge type
              label: "inherits",
            });
          } else {
            console.warn(`Invalid edge: source (${cls.inheritsFrom}) or target (${cls.name}) is undefined.`);
          }
        }
      });
    }
  
    // Add relationships between classes
    geminiOutput?.relationships?.forEach((rel, index) => {
      if (rel.source && rel.target) { // Ensure both source and target are defined
        console.log(`Creating relationship edge: source=${rel.source}, target=${rel.target}`);
        parsedEdges.push({
          id: `e-${rel.source}-${rel.target}-${index}`,
          source: rel.source,
          target: rel.target,
          type: "smoothstep",
          label: rel.type || "relation",
        });
      } else {
        console.warn(`Invalid relationship edge: source (${rel.source}) or target (${rel.target}) is undefined.`);
      }
    });
  
    setNodes(parsedNodes);
    setEdges(parsedEdges);
  };

  useEffect(() => {
    const analyzeFileContent = async () => {
      setError(null);
      if (fileContent) {
        const geminiOutput = await fetchGeminiAnalysis(fileContent);
        console.log("Parsed Gemini output:", geminiOutput);
        if (geminiOutput) {
          try {
            processGeminiOutput(geminiOutput);
          } catch (error) {
            console.error("Error processing Gemini output:", error);
            setError("Error processing analysis. Check console for details.");
          }
        }
      }
    };

    analyzeFileContent();
  }, [fileContent]);

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    if (event.ctrlKey) {
      console.log(`Ctrl + Click triggered on class: ${node.id}`); // Log the class name and trigger
      onClassClick(node.id); // Trigger highlight on Ctrl + Click
    } else {
      console.log(`Click detected on class: ${node.id}, but Ctrl key was not pressed.`); // Log when Ctrl is not pressed
    }
  };

  return (
    <ReactFlowProvider>
      <div style={{ height: "500px", width: "100%" }}>
        {error && <div style={{ color: "red", marginBottom: "10px" }}>Error: {error}</div>}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick} // Add Ctrl + Click handler for nodes
          connectionLineType={ConnectionLineType.SmoothStep}
          fitView
          nodeTypes={nodeTypes}
        >
          <Background variant="dots" gap={16} size={1} />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
};

export default ClassDiagram;