"use client";
import { useState, useEffect } from "react";

// Define the props for the Chatbot component
interface ChatbotProps {
    onClose: () => void; // Function to handle closing the chatbot
}

export default function Chatbot({ onClose }: ChatbotProps) {
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
        <div className="fixed bottom-8 right-8 w-[400px] h-[500px] bg-white rounded-xl shadow-lg border border-gray-300 flex flex-col">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-t-xl flex justify-between items-center">
                <h2 className="text-lg font-semibold">Chatbot for {role}</h2>
                <button
                    onClick={onClose} // Call the onClose function when the close button is clicked
                    className="text-white hover:text-gray-200 transition"
                    aria-label="Close Chatbot"
                >
                    ✖
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 bg-gray-50 space-y-4">
                {messages.length === 0 ? (
                    <p className="text-gray-500 text-center">Start a conversation...</p>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded-lg shadow-sm ${
                                msg.role === "AI"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-white text-gray-800 border border-gray-300"
                            }`}
                        >
                            <strong className="block mb-1">{msg.role === "AI" ? "AI" : "You"}:</strong>
                            <span>{msg.content}</span>
                        </div>
                    ))
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-300 flex items-center gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Send
                </button>
            </div>
        </div>
    );
}