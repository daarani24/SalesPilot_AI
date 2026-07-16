import { Sparkles, ShoppingBag, Gauge, Receipt } from "lucide-react";

export const AGENTS = {
  greeting_handler: {
    label: "Coordinator",
    color: "var(--agent-coordinator)",
    icon: Sparkles,
    description: "Routes your message to the right specialist",
  },
  sales_agent: {
    label: "Product Expert",
    color: "var(--agent-sales)",
    icon: ShoppingBag,
    description: "Answers using the live TechHub product catalog",
  },
  lead_qualifier: {
    label: "Lead Qualifier",
    color: "var(--agent-qualifier)",
    icon: Gauge,
    description: "Silently scores conversation intent in the background",
  },
  quotation_agent: {
    label: "Quotation Agent",
    color: "var(--agent-quotation)",
    icon: Receipt,
    description: "Generates a formal PDF quotation",
  },
};

export const LEAD_STATUS_COLOR = {
  Hot: "var(--hot)",
  Warm: "var(--warm)",
  Cold: "var(--cold)",
};

export function getAgentMeta(agentKey) {
  return AGENTS[agentKey] || AGENTS.sales_agent;
}