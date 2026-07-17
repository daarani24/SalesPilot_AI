import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Flame, Thermometer, Snowflake, Users, RefreshCw } from "lucide-react";
import { fetchLeads } from "../api";

const STATUS_COLOR = { Hot: "var(--hot)", Warm: "var(--warm)", Cold: "var(--cold)" };

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadLeads() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchLeads();
      setLeads(data);
    } catch (err) {
      setError("Couldn't load leads. Is the backend running?");
      console.error("fetchLeads failed:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLeads();
  }, []);

  const counts = { Hot: 0, Warm: 0, Cold: 0 };
  leads.forEach((lead) => {
    if (counts[lead.lead_status] !== undefined) counts[lead.lead_status] += 1;
  });
  const chartData = [
    { status: "Hot", count: counts.Hot },
    { status: "Warm", count: counts.Warm },
    { status: "Cold", count: counts.Cold },
  ];
  const escalatedCount = leads.filter((l) => l.should_escalate).length;

  return (
    <div className="dashboard">
      <div className="dashboard-toolbar">
        <h2>Lead Overview</h2>
        <button className="refresh-btn" onClick={loadLeads} disabled={isLoading}>
          <RefreshCw size={14} className={isLoading ? "spin" : ""} />
          Refresh
        </button>
      </div>

      {error && <p className="dash-error">{error}</p>}

      <div className="summary-cards">
        <SummaryCard icon={<Users size={16} />} label="Total Conversations" value={leads.length} color="var(--accent-end)" />
        <SummaryCard icon={<Flame size={16} />} label="Hot Leads" value={counts.Hot} color="var(--hot)" />
        <SummaryCard icon={<Thermometer size={16} />} label="Warm Leads" value={counts.Warm} color="var(--warm)" />
        <SummaryCard icon={<Snowflake size={16} />} label="Cold Leads" value={counts.Cold} color="var(--cold)" />
      </div>

      <div className="glass-panel chart-card">
        <h3>Lead Status Distribution</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
            <XAxis dataKey="status" stroke="var(--text-muted)" fontSize={12} />
            <YAxis allowDecimals={false} stroke="var(--text-muted)" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--glass-border)",
                borderRadius: 8,
                color: "var(--text-primary)",
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.status} fill={STATUS_COLOR[entry.status]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-panel table-card">
        <h3>
          Recent Conversations
          {escalatedCount > 0 && <span className="escalated-pill">{escalatedCount} escalated</span>}
        </h3>
        {leads.length === 0 && !isLoading ? (
          <p className="empty-state">No conversations yet -- chat with the bot to see leads appear here.</p>
        ) : (
          <table className="leads-table">
            <thead>
              <tr>
                <th>Session</th>
                <th>Status</th>
                <th>Confidence</th>
                <th>Sentiment</th>
                <th>Urgency</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.session_id}>
                  <td className="mono">{lead.session_id.slice(0, 8)}</td>
                  <td>
                    <span className="status-pill" style={{ color: STATUS_COLOR[lead.lead_status] }}>
                      {lead.lead_status}
                    </span>
                  </td>
                  <td>{lead.confidence}%</td>
                  <td>{lead.sentiment}</td>
                  <td>{lead.urgency}</td>
                  <td className="mono">{new Date(lead.updated_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        .dashboard {
          flex: 1;
          overflow-y: auto;
          padding-right: 4px;
        }

        .dashboard-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .refresh-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--glass-fill);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          padding: 7px 12px;
          color: var(--text-muted);
          font-size: 0.8rem;
          cursor: pointer;
        }

        .refresh-btn:hover {
          color: var(--text-primary);
        }

        .spin {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .dash-error {
          color: var(--hot);
          font-size: 0.85rem;
          margin-bottom: 12px;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        @media (max-width: 720px) {
          .summary-cards {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .chart-card, .table-card {
          padding: 18px;
          margin-bottom: 16px;
        }

        .chart-card h3, .table-card h3 {
          font-size: 0.95rem;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .escalated-pill {
          background: var(--status-hot-bg);
          color: var(--hot);
          font-family: var(--font-mono);
          font-size: 0.7rem;
          padding: 2px 8px;
          border-radius: 999px;
        }

        .empty-state {
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        .leads-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.82rem;
        }

        .leads-table th {
          text-align: left;
          color: var(--text-muted);
          font-family: var(--font-mono);
          font-weight: 500;
          font-size: 0.72rem;
          padding: 6px 10px;
          border-bottom: 1px solid var(--glass-border);
        }

        .leads-table td {
          padding: 8px 10px;
          border-bottom: 1px solid var(--glass-border);
        }

        .mono {
          font-family: var(--font-mono);
          color: var(--text-muted);
          font-size: 0.78rem;
        }

        .status-pill {
          font-weight: 600;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}

function SummaryCard({ icon, label, value, color }) {
  return (
    <div className="glass-panel summary-card">
      <div className="summary-icon" style={{ color }}>
        {icon}
      </div>
      <div>
        <p className="summary-value">{value}</p>
        <p className="summary-label">{label}</p>
      </div>

      <style>{`
        .summary-card {
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .summary-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .summary-value {
          font-family: var(--font-display);
          font-size: 1.3rem;
          font-weight: 600;
          margin: 0;
          line-height: 1.1;
        }

        .summary-label {
          font-size: 0.72rem;
          color: var(--text-muted);
          margin: 2px 0 0;
        }
      `}</style>
    </div>
  );
}