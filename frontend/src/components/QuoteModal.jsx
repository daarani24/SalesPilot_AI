import { useState } from "react";
import { X, FileText, Loader2 } from "lucide-react";
import { requestQuotation } from "../api";

export default function QuoteModal({ onClose, onQuoteGenerated }) {
  const [customerName, setCustomerName] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [isStudent, setIsStudent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!customerName.trim() || !productQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await requestQuotation(customerName.trim(), productQuery.trim(), isStudent);

      if (!data.success) {
        
        setError(data.error || "Couldn't find that product in our catalog.");
        setIsLoading(false);
        return;
      }

      onQuoteGenerated(data.quotation);
      onClose();
    } catch (err) {
      setError("Couldn't reach the server. Please check the backend is running.");
      console.error("Quote request failed:", err);
      setIsLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="glass-panel modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FileText size={18} />
            <h3>Generate Official Quotation</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Customer Name
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Ravi Kumar"
              required
            />
          </label>

          <label>
            Product
            <input
              type="text"
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="e.g. Acer Aspire 3"
              required
            />
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={isStudent}
              onChange={(e) => setIsStudent(e.target.checked)}
            />
            Apply 5% student discount
          </label>

          {error && <p className="modal-error">{error}</p>}

          <button type="submit" className="btn-gradient modal-submit" disabled={isLoading}>
            {isLoading ? <Loader2 size={16} className="spin" /> : "Generate PDF Quotation"}
          </button>
        </form>

        <style>{`
          .modal-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.55);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 50;
          }

          .modal-card {
            width: 380px;
            max-width: 90vw;
            padding: 22px;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 18px;
          }

          .modal-title {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--text-primary);
          }

          .modal-title h3 {
            font-size: 1rem;
          }

          .icon-btn {
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            display: flex;
            padding: 4px;
          }

          .icon-btn:hover {
            color: var(--text-primary);
          }

          form label {
            display: flex;
            flex-direction: column;
            gap: 6px;
            font-size: 0.8rem;
            color: var(--text-muted);
            margin-bottom: 14px;
          }

          form input[type="text"] {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-md);
            padding: 10px 12px;
            color: var(--text-primary);
            font-family: var(--font-body);
            font-size: 0.9rem;
          }

          form input[type="text"]:focus {
            outline: none;
            border-color: var(--accent-end);
          }

          .checkbox-row {
            flex-direction: row !important;
            align-items: center;
            gap: 8px !important;
          }

          .modal-error {
            color: var(--hot);
            font-size: 0.8rem;
            margin: -6px 0 12px;
          }

          .modal-submit {
            width: 100%;
            padding: 11px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 0.88rem;
            border: none;
            cursor: pointer;
          }

          .modal-submit:disabled {
            opacity: 0.7;
            cursor: not-allowed;
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