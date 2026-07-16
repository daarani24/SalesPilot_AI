import { Flame, Radar, Snowflake, Bell } from "lucide-react";
import { LEAD_STATUS_COLOR } from "../agentConfig";

const STATUS_ICON = {
  Hot: Flame,
  Warm: Radar,
  Cold: Snowflake,
};

export default function LeadScorePanel({ leadStatus, confidence, sentiment, shouldEscalate }) {

  const status = leadStatus || "Cold";
  const conf = confidence ?? 0;
  const StatusIcon = STATUS_ICON[status] || Snowflake;
  const color = LEAD_STATUS_COLOR[status];

  return (
    <div className="glass-panel lead-panel">
      <h3 className="panel-title">Live Lead Score</h3>

      <div className="status-row" style={{ "--status-color": color }}>
        <StatusIcon size={20} strokeWidth={2} />
        <span className="status-label">{status} Lead</span>
      </div>

      <div className="confidence-track">
        <div className="confidence-fill" style={{ width: `${conf}%`, background: color }} />
      </div>
      <p className="confidence-label">{conf}% confidence</p>

      <div className="meta-row">
        <span className="meta-label">Sentiment</span>
        <span className="meta-value">{sentiment || "—"}</span>
      </div>

      {shouldEscalate && (
        <div className="escalation-alert">
          <Bell size={14} />
          <span>Escalated to human sales rep</span>
        </div>
      )}

      <style>{`
        .lead-panel {
          padding: 20px;
          width: 260px;
        }

        .panel-title {
          font-size: 0.95rem;
          color: var(--text-primary);
          margin-bottom: 14px;
        }

        .status-row {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--status-color);
          margin-bottom: 12px;
        }

        .status-label {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 1.05rem;
        }

        .confidence-track {
          height: 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          overflow: hidden;
        }

        .confidence-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.4s ease;
        }

        .confidence-label {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 6px;
          margin-bottom: 16px;
        }

        .meta-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-top: 1px solid var(--glass-border);
          font-size: 0.85rem;
        }

        .meta-label {
          color: var(--text-muted);
        }

        .meta-value {
          color: var(--text-primary);
          font-weight: 500;
        }

        .escalation-alert {
          margin-top: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: var(--radius-md);
          background: color-mix(in srgb, var(--hot) 15%, transparent);
          border: 1px solid color-mix(in srgb, var(--hot) 40%, transparent);
          color: var(--hot);
          font-size: 0.78rem;
          font-weight: 500;
          animation: alertPulse 1.8s ease-in-out infinite;
        }

        @keyframes alertPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.75; }
        }
      `}</style>
    </div>
  );
}