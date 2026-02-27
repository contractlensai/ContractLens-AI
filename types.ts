
export interface RedFlag {
  clause_text: string;
  risk_type: string;
  severity: 'High' | 'Medium' | 'Low';
  explanation: string;
  suggested_fix: string;
}

export interface ContractAuditResult {
  healthScore: number;
  contract_type?: string;
  summary: string;
  redFlags: RedFlag[];
  negotiationEmail?: string; // Optional for now if not explicitly stored in Supabase
}

export interface AuditRecord extends ContractAuditResult {
  id: string;
  contractTitle: string;
  timestamp: string;
  userId: string;
}

export type LoadingState = 'idle' | 'analyzing' | 'error';

