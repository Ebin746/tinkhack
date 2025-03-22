"use client";
import { useEffect } from "react";
import mermaid from "mermaid";

export default function DiagramViewer({ mermaidSyntax }: { mermaidSyntax: string }) {
  useEffect(() => {
    mermaid.initialize({ startOnLoad: true });
    mermaid.contentLoaded();
  }, [mermaidSyntax]);

  return <div className="border p-4" dangerouslySetInnerHTML={{ __html: mermaidSyntax }} />;
}
