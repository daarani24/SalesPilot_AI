import AgentBadge from "./AgentBadge";

export default function MessageBubble({ role, content, agentUsed, isNew }) {
  const isUser = role === "user";

  return (
    <div className={`message-row ${isUser ? "message-row-user" : ""}`}>
      <div className="message-col">
        {!isUser && agentUsed && <AgentBadge agentKey={agentUsed} animated={isNew} />}
        <div className={`bubble ${isUser ? "bubble-user" : "bubble-agent"}`}>{content}</div>
      </div>

      <style>{`
        .message-row {
          display: flex;
          justify-content: flex-start;
          margin-bottom: 16px;
        }

        .message-row-user {
          justify-content: flex-end;
        }

        .message-col {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-width: 72%;
          align-items: flex-start;
        }

        .message-row-user .message-col {
          align-items: flex-end;
        }

        .bubble {
          padding: 12px 16px;
          border-radius: var(--radius-md);
          font-size: 0.92rem;
          line-height: 1.5;
        }

        .bubble-agent {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--text-primary);
          border-top-left-radius: 4px;
        }

        .bubble-user {
          background: var(--accent-gradient);
          color: white;
          border-top-right-radius: 4px;
        }
      `}</style>
    </div>
  );
}