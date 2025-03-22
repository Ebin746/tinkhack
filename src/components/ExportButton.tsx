"use client";
import { useRef } from "react";
import html2canvas from "html2canvas";

export default function ExportButton({ targetId }: { targetId: string }) {
  const handleExport = async () => {
    const element = document.getElementById(targetId);
    if (!element) return;

    try {
      const canvas = await html2canvas(element);
      const link = document.createElement("a");
      link.download = "diagram.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  return (
    <button onClick={handleExport} className="mt-2 bg-purple-500 text-white px-4 py-2 rounded">
      Export as PNG
    </button>
  );
}
