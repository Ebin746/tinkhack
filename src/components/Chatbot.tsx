"use client";
import { useState } from "react";

export default function Chatbot() {
    const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
    const [input, setInput] = useState("");

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { role: "user", content: input };
        setMessages([...messages, userMessage]);

        const response = await fetch("/api/chatbot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: input }),
        });

        const data = await response.json();
        setMessages([...messages, userMessage, { role: "AI", content: data.reply }]);
        setInput("");
    };

    return (
        <div className="p-4 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-2">Chatbot</h2>
            <div className="h-40 overflow-y-auto  p-2 border">
                {messages.map((msg, index) => (
                    <div key={index} className={msg.role === "AI" ? "text-blue-600" : "text-black"}>
                        <strong>{msg.role}:</strong> {msg.content}
                    </div>
                ))}
            </div>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="border p-2 w-full mt-2"
                placeholder="Ask about the codebase..."
            />
            <button onClick={sendMessage} className="mt-2 bg-blue-500 text-white p-2 rounded">
                Send
            </button>
        </div>
    );
}
