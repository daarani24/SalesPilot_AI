import { useState } from "react";
import { Zap, MessageSquare, LayoutDashboard } from "lucide-react";
import ChatWindow from "./components/ChatWindow";
import LeadScorePanel from "./components/LeadScorePanel";
import Dashboard from "./components/Dashboard";
import "./index.css";

function App() {
  const [activeTab, setActiveTab] = useState("chat"); 
  const [leadData, setLeadData] = useState({
    leadStatus: null,
    confidence: 0,
    sentiment: null,
    shouldEscalate: false,
  });

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">
            <Zap size={18} strokeWidth={2.4} />
          </div>
          <div>
            <h1>SalesPilot AI</h1>
            <p className="tagline">Your intelligent AI sales team — never sleeps.</p>
          </div>
        </div>

        <nav className="tab-switch">
          <button
            className={activeTab === "chat" ? "tab-btn tab-active" : "tab-btn"}
            onClick={() => setActiveTab("chat")}
          >
            <MessageSquare size={15} />
            Chat
          </button>
          <button
            className={activeTab === "dashboard" ? "tab-btn tab-active" : "tab-btn"}
            onClick={() => setActiveTab("dashboard")}
          >
            <LayoutDashboard size={15} />
            Dashboard
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activeTab === "chat" ? (
          <>
            <ChatWindow onLeadUpdate={setLeadData} />
            <LeadScorePanel {...leadData} />
          </>
        ) : (
          <Dashboard />
        )}
      </main>

      <style>{`
        .app-shell {
          height: 100vh;
          display: flex;
          flex-direction: column;
          max-width: 1100px;
          margin: 0 auto;
          padding: 20px;
        }

        .app-header {
          padding: 12px 4px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: var(--accent-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .brand h1 {
          font-size: 1.3rem;
        }

        .tagline {
          font-size: 0.82rem;
          color: var(--text-muted);
        }

        .tab-switch {
          display: flex;
          gap: 4px;
          background: var(--glass-fill);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          padding: 4px;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          border-radius: 8px;
          padding: 7px 14px;
          color: var(--text-muted);
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }

        .tab-active {
          background: var(--accent-gradient);
          color: white;
        }

        .app-main {
          flex: 1;
          display: flex;
          gap: 16px;
          overflow: hidden;
          padding-bottom: 4px;
        }

        @media (max-width: 720px) {
          .app-main {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default App;