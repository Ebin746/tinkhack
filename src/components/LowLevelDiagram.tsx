import React, { useEffect, useState } from "react";
import { Node, Edge, Background, ConnectionLineType } from "reactflow";
import ReactFlow, { ReactFlowProvider, useNodesState, useEdgesState } from "reactflow";
import "reactflow/dist/style.css"; // Import React Flow styles

interface LowLevelDiagramProps {
  fileContent: string;
}

// Define expected Gemini output interface
interface GeminiOutput {
  classes?: Array<{
    name: string;
    inheritsFrom?: string;
    methods: Array<{
      name: string;
      parameters: string[];
      variables: string[];
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

const LowLevelDiagram: React.FC<LowLevelDiagramProps> = ({ fileContent }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [error, setError] = useState<string | null>(null);

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
        parsedNodes.push({
          id: cls.name,
          data: { label: `Class: ${cls.name}` },
          position: { x: Math.random() * 400, y: classIndex * 200 },
          draggable: true, // Make nodes draggable
        });

        if (cls.inheritsFrom) {
          parsedEdges.push({
            id: `e-${cls.name}-${cls.inheritsFrom}`,
            source: cls.inheritsFrom,
            target: cls.name,
            type: "smoothstep",
          });
        }

        cls.methods?.forEach((method, methodIndex) => {
          const methodId = `${cls.name}-${method.name}`;
          parsedNodes.push({
            id: methodId,
            data: {
              label: `Method: ${method.name}(${method.parameters?.join(", ") || ""})`,
            },
            position: { x: Math.random() * 400, y: classIndex * 200 + methodIndex * 100 },
            draggable: true,
          });

          parsedEdges.push({
            id: `e-${cls.name}-${method.name}`,
            source: cls.name,
            target: methodId,
            type: "smoothstep",
          });

          method.variables?.forEach((variable, varIndex) => {
            const variableId = `${methodId}-${variable}`;
            parsedNodes.push({
              id: variableId,
              data: { label: `Variable: ${variable}` },
              position: { x: Math.random() * 400, y: classIndex * 200 + methodIndex * 100 + varIndex * 50 },
              draggable: true,
            });

            parsedEdges.push({
              id: `e-${method.name}-${variable}`,
              source: methodId,
              target: variableId,
              type: "smoothstep",
            });
          });
        });
      });
    }

    geminiOutput?.relationships?.forEach((rel) => {
      parsedEdges.push({
        id: `e-${rel.source}-${rel.target}`,
        source: rel.source,
        target: rel.target,
        type: rel.type || "smoothstep",
      });
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

  return (
    <ReactFlowProvider>
      <div style={{ height: "500px", width: "100%" }}>
        {error && <div style={{ color: "red", marginBottom: "10px" }}>Error: {error}</div>}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          connectionLineType={ConnectionLineType.SmoothStep} // Smooth step connection
          fitView
        >
          <Background />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
};

export default LowLevelDiagram;