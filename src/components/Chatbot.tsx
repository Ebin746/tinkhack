"use client";
import { useState,useEffect } from "react";

export default function Chatbot() {
    const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
    const [input, setInput] = useState("");
    const [role, setRole] = useState("outsider");
   
  
    // Retrieve role from localStorage on component mount
    useEffect(() => {
      const storedRole = localStorage.getItem("userRole");
      if (storedRole) {
        setRole(storedRole);
      }
    }, []);
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
        <div className="p-6 border rounded-lg shadow-lg bg-white mt-6 max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Chatbot for {role}</h2>
            <div className="h-60 overflow-y-auto p-4 border rounded-lg bg-gray-50">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`mb-2 ${
                            msg.role === "AI" ? "text-blue-600" : "text-gray-800"
                        }`}
                    >
                        <strong className="block">{msg.role === "AI" ? "AI" : "You"}:</strong>
                        <span>{msg.content}</span>
                    </div>
                ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="border p-3 rounded-lg flex-1 text-gray-800"
                    placeholder="Ask about the codebase..."
                />
                <button
                    onClick={sendMessage}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                    Send
                </button>
            </div>
        </div>
    );
}