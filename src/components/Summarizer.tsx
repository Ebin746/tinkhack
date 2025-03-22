"use client";
import { useState } from "react";

export default function Summarizer() {
    const [summary, setSummary] = useState("");

    const fetchSummary = async () => {
        const response = await fetch("/api/summarizer", { method: "POST" });
        const data = await response.json();
        setSummary(data.summary);
    };

    return (
        <div className="p-4 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-2">Project Summary</h2>
            <button onClick={fetchSummary} className="bg-green-500 text-white p-2 rounded">
                Generate Summary
            </button>
            {summary && <pre className="mt-2  p-2 border">{summary}</pre>}
        </div>
    );
}
