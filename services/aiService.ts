import { ContractAuditResult } from "../types";

interface AnalyzeApiResponse {
  success: boolean;
  data?: {
    health_score: number;
    summary: string;
    risks: Array<{
      title: string;
      severity: "high" | "medium" | "low";
      clause: string;
      explanation: string;
      fix: string;
      negotiation_reply: string;
    }>;
  };
  error?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const normalizeSeverity = (severity: string): "High" | "Medium" | "Low" => {
  const normalized = severity.toLowerCase();
  if (normalized === "high") return "High";
  if (normalized === "medium") return "Medium";
  return "Low";
};

export const analyzeContract = async (
  text: string,
  userRole = "freelancer",
): Promise<ContractAuditResult> => {
  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contractText: text, userRole }),
  });

  let payload: AnalyzeApiResponse;

  try {
    payload = (await response.json()) as AnalyzeApiResponse;
  } catch {
    throw new Error("The analysis service returned an invalid response.");
  }

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error || "Failed to analyze the contract.");
  }

  return {
    healthScore: payload.data.health_score,
    contract_type: "Unknown",
    summary: payload.data.summary,
    redFlags: payload.data.risks.map((risk) => ({
      clause_text: risk.clause,
      risk_type: risk.title,
      severity: normalizeSeverity(risk.severity),
      explanation: risk.explanation,
      suggested_fix: risk.fix,
    })),
    negotiationEmail: payload.data.risks[0]?.negotiation_reply || "",
  };
};
