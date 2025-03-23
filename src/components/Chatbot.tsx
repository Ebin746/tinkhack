"use client";
import { useState } from "react";
import { Send, Bot, User } from "lucide-react";

export default function Chatbot() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      setMessages((prevMessages) => [...prevMessages, { role: "AI", content: data.reply }]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "AI", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-indigo-900 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot size={20} className="text-blue-400" />
            <h2 className="text-lg font-bold text-white">Code Assistant</h2>
          </div>
          <div className="bg-blue-700 text-xs px-2 py-1 rounded-full text-blue-100">
            Active
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-800 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Bot size={36} className="mb-2 text-gray-500" />
            <p className="text-sm">Ask me anything about your codebase</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === "AI" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`px-4 py-3 rounded-lg max-w-xs lg:max-w-md ${
                  msg.role === "AI"
                    ? "bg-gray-700 text-gray-100"
                    : "bg-blue-700 text-white"
                }`}
              >
                <div className="flex items-center mb-1 space-x-1">
                  {msg.role === "AI" ? (
                    <Bot size={14} className="text-blue-400" />
                  ) : (
                    <User size={14} className="text-blue-200" />
                  )}
                  <span className="text-xs font-medium">
                    {msg.role === "AI" ? "Assistant" : "You"}
                  </span>
                </div>
                <div className="text-sm">{msg.content}</div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-gray-100 px-4 py-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div
                    className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-700 bg-gray-850">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-grow px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100 placeholder-gray-400"
            placeholder="Ask about the codebase..."
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              isLoading || !input.trim()
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2 text-center">
          Press Enter to send
        </div>
      </div>
    </div>
  );
}