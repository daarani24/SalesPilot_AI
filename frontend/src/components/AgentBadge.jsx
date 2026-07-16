import { getAgentMeta } from "../agentConfig";

export default function AgentBadge({ agentKey, animated }) {
  const { label, color, icon: Icon } = getAgentMeta(agentKey);

  return (
    <div
      className={animated ? "agent-badge badge-animate" : "agent-badge"}
      style={{ "--badge-color": color }}
    >
      <Icon size={12} strokeWidth={2.5} />
      {label}

      <style>{`
        .agent-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--badge-color) 12%, transparent);
          border: 1px solid color-mix(in srgb, var(--badge-color) 35%, transparent);
          color: var(--badge-color);
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.02em;
          width: fit-content;
        }

        .badge-animate {
          animation: badgeFadeIn 0.25s ease-out;
        }

        @keyframes badgeFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}