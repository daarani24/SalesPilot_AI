import { Download } from "lucide-react";
import AgentBadge from "./AgentBadge";

function renderInline(text) {
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
    return (
      <span key={lineIdx}>
        {parts.map((part, i) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={i}>{part.slice(2, -2)}</strong>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
        {lineIdx < lines.length - 1 && <br />}
      </span>
    );
  });
}

function isTableRow(line) {
  return /^\s*\|.*\|\s*$/.test(line);
}

function isSeparatorRow(line) {
  return /^\s*\|[\s:-]+\|[\s:-|]*\s*$/.test(line);
}

function parseTableRow(line) {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderContent(text) {
  const lines = text.split("\n");
  const blocks = [];
  let currentText = [];
  let i = 0;

  while (i < lines.length) {
    if (isTableRow(lines[i])) {
      
      if (currentText.length) {
        blocks.push({ type: "text", content: currentText.join("\n") });
        currentText = [];
      }
      const tableLines = [];
      while (i < lines.length && isTableRow(lines[i])) {
        tableLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: "table", rows: tableLines });
    } else {
      currentText.push(lines[i]);
      i++;
    }
  }
  if (currentText.length) {
    blocks.push({ type: "text", content: currentText.join("\n") });
  }

  return blocks.map((block, idx) => {
    if (block.type === "text") {
      return <div key={idx}>{renderInline(block.content)}</div>;
    }
    
    const [headerLine, maybeSeparator, ...rest] = block.rows;
    const bodyLines = maybeSeparator && isSeparatorRow(maybeSeparator) ? rest : [maybeSeparator, ...rest].filter(Boolean);
    const headerCells = parseTableRow(headerLine);
    const bodyRows = bodyLines.map(parseTableRow);

    return (
      <table className="msg-table" key={idx}>
        <thead>
          <tr>
            {headerCells.map((cell, c) => (
              <th key={c}>{cell}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  });
}

export default function MessageBubble({ role, content, agentUsed, isNew, downloadUrl }) {
  const isUser = role === "user";

  return (
    <div className={`message-row ${isUser ? "message-row-user" : ""}`}>
      <div className="message-col">
        {!isUser && agentUsed && <AgentBadge agentKey={agentUsed} animated={isNew} />}
        <div className={`bubble ${isUser ? "bubble-user" : "bubble-agent"}`}>
          {renderContent(content)}
          {downloadUrl && (
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="download-link">
              <Download size={14} />
              Download PDF Quotation
            </a>
          )}
        </div>
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
          max-width: 78%;
          align-items: flex-start;
        }

        .message-row-user .message-col {
          align-items: flex-end;
          max-width: 72%;
        }

        .bubble {
          padding: 12px 16px;
          border-radius: var(--radius-md);
          font-size: 0.92rem;
          line-height: 1.5;
          white-space: pre-line;
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

        .msg-table {
          border-collapse: collapse;
          width: 100%;
          margin: 8px 0;
          font-size: 0.85rem;
          white-space: normal;
        }

        .msg-table th,
        .msg-table td {
          border: 1px solid var(--glass-border);
          padding: 6px 10px;
          text-align: left;
        }

        .msg-table th {
          background: rgba(255, 255, 255, 0.06);
          font-family: var(--font-mono);
          font-weight: 500;
          font-size: 0.78rem;
          color: var(--text-muted);
        }

        .download-link {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 10px;
          padding: 8px 12px;
          background: var(--accent-gradient);
          border-radius: 8px;
          color: white;
          text-decoration: none;
          font-size: 0.82rem;
          font-weight: 600;
          width: fit-content;
        }

        .download-link:hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}