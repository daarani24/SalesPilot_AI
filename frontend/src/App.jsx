import { useState } from "react";
import { Zap } from "lucide-react";
import ChatWindow from "./components/ChatWindow";
import LeadScorePanel from "./components/LeadScorePanel";
import "./index.css";

function App() {
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
      </header>

      <main className="app-main">
        <ChatWindow onLeadUpdate={setLeadData} />
        <LeadScorePanel {...leadData} />
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