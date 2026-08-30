import axios from "axios";
import type {
  User, UserCreate, UserUpdate,
  ReportUploadResponse, ReportDetail, ReportListItem,
  AllTrendsResponse, TrendResponse, BiomarkerUpdate, BiomarkerResult,
} from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function getAuthHeader(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── User ────────────────────────────────────────────────────────────────────
export async function getProfile(token?: string): Promise<User> {
  const { data } = await axios.get(`${API_BASE}/user/me`, { headers: getAuthHeader(token) });
  return data;
}

export async function createProfile(body: UserCreate, token?: string): Promise<User> {
  const { data } = await axios.post(`${API_BASE}/user/me`, body, { headers: getAuthHeader(token) });
  return data;
}

export async function updateProfile(body: UserUpdate, token?: string): Promise<User> {
  const { data } = await axios.patch(`${API_BASE}/user/me`, body, { headers: getAuthHeader(token) });
  return data;
}

// ─── Reports ─────────────────────────────────────────────────────────────────
export interface SessionPatientDetails {
  age?: number;
  sex?: string;
  weight?: number;
  height?: number;
}

export async function uploadReport(
  file: File,
  details?: SessionPatientDetails,
  token?: string
): Promise<ReportUploadResponse> {
  const form = new FormData();
  form.append("file", file);
  if (details?.age) form.append("age", String(details.age));
  if (details?.sex) form.append("sex", details.sex);
  if (details?.weight) form.append("weight", String(details.weight));
  if (details?.height) form.append("height", String(details.height));

  const headers = getAuthHeader(token);
  const { data } = await axios.post(`${API_BASE}/reports/upload`, form, {
    headers,
  });
  return data;
}

export async function listReports(token?: string): Promise<ReportListItem[]> {
  const { data } = await axios.get(`${API_BASE}/reports`, { headers: getAuthHeader(token) });
  return data;
}

export async function getReport(id: string, token?: string): Promise<ReportDetail> {
  const { data } = await axios.get(`${API_BASE}/reports/${id}`, { headers: getAuthHeader(token) });
  return data;
}

export async function deleteReport(id: string, token?: string): Promise<void> {
  await axios.delete(`${API_BASE}/reports/${id}`, { headers: getAuthHeader(token) });
}

export async function updateBiomarker(
  reportId: string,
  biomarkerId: string,
  update: BiomarkerUpdate,
  token?: string
): Promise<BiomarkerResult> {
  const { data } = await axios.patch(
    `${API_BASE}/reports/${reportId}/biomarkers/${biomarkerId}`,
    update,
    { headers: getAuthHeader(token) }
  );
  return data;
}

// ─── Trends ──────────────────────────────────────────────────────────────────
export async function getAllTrends(token?: string): Promise<AllTrendsResponse> {
  const { data } = await axios.get(`${API_BASE}/trends`, { headers: getAuthHeader(token) });
  return data;
}

export async function getBiomarkerTrend(biomarker: string, token?: string): Promise<TrendResponse> {
  const { data } = await axios.get(`${API_BASE}/trends/${biomarker}`, { headers: getAuthHeader(token) });
  return data;
}

// ─── Health check ────────────────────────────────────────────────────────────
export async function healthCheck(): Promise<boolean> {
  try {
    const { data } = await axios.get(
      (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace("/api/v1", "") + "/health",
      { timeout: 5000 }
    );
    return data?.status === "healthy";
  } catch {
    return false;
  }
}
