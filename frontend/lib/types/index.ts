// Central TypeScript types — mirrors backend Pydantic schemas

export type Sex = "male" | "female" | "other";
export type ReportStatus = "pending" | "processing" | "completed" | "failed";
export type OverallStatus = "normal" | "attention" | "urgent";
export type RiskSeverity = "info" | "warning" | "critical";
export type TrendDirection = "improving" | "stable" | "worsening" | "insufficient_data";

export type BiomarkerStatus =
  | "CRITICAL_LOW"
  | "LOW"
  | "BORDERLINE_LOW"
  | "NORMAL"
  | "BORDERLINE_HIGH"
  | "HIGH"
  | "CRITICAL_HIGH"
  | "UNKNOWN"
  | "INFORMATIONAL";

export interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  sex: Sex;
  created_at: string;
}

export interface UserCreate {
  name: string;
  age: number;
  sex: Sex;
}

export interface UserUpdate {
  name?: string;
  age?: number;
  sex?: Sex;
}


export interface BiomarkerResult {
  id?: string;
  canonical_name: string;
  display_name: string;
  value?: number;
  unit: string;
  value_normalized?: number;
  unit_normalized: string;
  reference_min?: number;
  reference_max?: number;
  reference_source: "report" | "builtin";
  status: BiomarkerStatus;
  severity: number;
  is_qualitative?: boolean;
  qualitative_value?: string;
}

export interface BiomarkerUpdate {
  value: number;
  unit: string;
  reference_range?: string;
}

export interface RiskFlag {
  id: string;
  label: string;
  description: string;
  severity: RiskSeverity;
}

export interface Summary {
  overall_status: OverallStatus;
  risk_flags: RiskFlag[];
  gemini_summary: string;
  gemini_abnormal: string;
  gemini_questions: string;
  gemini_lifestyle: string;
}

export interface ReportDetail {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  status: ReportStatus;
  lab_name?: string;
  report_date?: string;
  report_type?: string;
  processing_error?: string;
  created_at: string;
  biomarkers: BiomarkerResult[];
  summary?: Summary;
}

export interface ReportListItem {
  id: string;
  file_name: string;
  status: ReportStatus;
  lab_name?: string;
  report_date?: string;
  report_type?: string;
  overall_status?: OverallStatus;
  created_at: string;
}

export interface TrendPoint {
  report_id: string;
  report_date: string;
  value_normalized: number;
  unit_normalized: string;
  status: BiomarkerStatus;
  created_at: string;
}

export interface TrendResponse {
  canonical_name: string;
  points: TrendPoint[];
  trend_direction: TrendDirection;
}

export interface AllTrendsResponse {
  trends: Record<string, TrendResponse>;
}

export interface ReportUploadResponse {
  report_id: string;
  status: ReportStatus;
  message: string;
}
