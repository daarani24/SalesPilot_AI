import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import MessageBubble from "./MessageBubble";
import { fetchSessionMessages } from "../api";

export default function ConversationModal({ sessionId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchSessionMessages(sessionId);
        setMessages(data);
      } catch (err) {
        setError("Couldn't load this conversation.");
        console.error("fetchSessionMessages failed:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [sessionId]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="glass-panel convo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="convo-header">
          <div>
            <h3>Conversation Transcript</h3>
            <p className="convo-session-id">Session: {sessionId}</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="convo-body">
          {isLoading && (
            <div className="convo-loading">
              <Loader2 size={18} className="spin" />
              Loading messages...
            </div>
          )}
          {error && <p className="convo-error">{error}</p>}
          {!isLoading &&
            !error &&
            messages.map((msg, i) => (
              <MessageBubble
                key={i}
                role={msg.role}
                content={msg.content}
                agentUsed={msg.role === "assistant" ? "sales_agent" : undefined}
              />
            ))}
        </div>

        <style>{`
          .convo-modal {
            width: 560px;
            max-width: 92vw;
            max-height: 78vh;
            display: flex;
            flex-direction: column;
            padding: 20px;
          }

          .convo-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 14px;
            flex-shrink: 0;
          }

          .convo-header h3 {
            font-size: 1rem;
          }

          .convo-session-id {
            font-family: var(--font-mono);
            font-size: 0.72rem;
            color: var(--text-muted);
            margin-top: 4px;
          }

          .icon-btn {
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            padding: 4px;
          }

          .icon-btn:hover {
            color: var(--text-primary);
          }

          .convo-body {
            overflow-y: auto;
            padding-right: 4px;
          }

          .convo-loading {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--text-muted);
            font-size: 0.85rem;
            padding: 20px 0;
          }

          .convo-error {
            color: var(--hot);
            font-size: 0.85rem;
          }

          .spin {
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}