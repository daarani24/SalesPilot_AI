import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import MessageBubble from "./MessageBubble";
import { sendChatMessage } from "../api";

const WELCOME_MESSAGE = {
  role: "assistant",
  content:
    "Hi! I'm the TechHub AI sales assistant. Ask me about laptops, phones, pricing, or anything else — I'm here 24/7.",
  agentUsed: "greeting_handler",
};

export default function ChatWindow({ onLeadUpdate }) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setIsSending(true);

    try {
      const data = await sendChatMessage(trimmed, sessionId);

      if (!sessionId) setSessionId(data.session_id);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, agentUsed: data.agent_used, isNew: true },
      ]);

      onLeadUpdate({
        leadStatus: data.lead_status,
        confidence: data.confidence,
        sentiment: data.sentiment,
        shouldEscalate: data.should_escalate,
      });
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't reach the server. Please check the backend is running.",
          agentUsed: "greeting_handler",
        },
      ]);
      console.error("Chat request failed:", err);
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="glass-panel chat-window">
      <div className="chat-messages" ref={scrollRef}>
        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            role={msg.role}
            content={msg.content}
            agentUsed={msg.agentUsed}
            isNew={msg.isNew}
          />
        ))}
        {isSending && (
          <div className="typing-indicator">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>

      <div className="chat-input-row">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about laptops, phones, pricing..."
          disabled={isSending}
        />
        <button className="btn-gradient" onClick={handleSend} disabled={isSending || !input.trim()}>
          <Send size={16} />
        </button>
      </div>

      <style>{`
        .chat-window {
          display: flex;
          flex-direction: column;
          flex: 1;
          height: 100%;
          overflow: hidden;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .chat-input-row {
          display: flex;
          gap: 10px;
          padding: 16px;
          border-top: 1px solid var(--glass-border);
        }

        .chat-input-row input {
          flex: 1;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          padding: 12px 14px;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 0.9rem;
        }

        .chat-input-row input::placeholder {
          color: var(--text-faint);
        }

        .chat-input-row input:focus {
          outline: none;
          border-color: var(--accent-end);
        }

        .chat-input-row button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 12px 16px;
          width: fit-content;
        }

        .typing-indicator span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-muted);
          animation: typingBounce 1.2s infinite;
        }

        .typing-indicator span:nth-child(2) { animation-delay: 0.15s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.3s; }

        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}