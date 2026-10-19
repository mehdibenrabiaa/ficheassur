"use client";

// Espace pro session and API calls (backend app/api/v1/auth.py, admin.py).
// The login token lives in localStorage; every call sends it as a bearer
// token, and a 401 clears it so the layout sends the broker back to login.

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8100").replace(/\/+$/, "");
const TOKEN_KEY = "ficheassur_pro_token";

export type Broker = { id: string; email: string; full_name: string; company: string; role: "broker" | "admin"; lead_types: string[] };

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* private mode: the session just won't survive a reload */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (res.status === 401) clearToken();
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = Array.isArray(body?.detail) ? String(body.detail[0]?.msg ?? "").replace(/^Value error, /, "") : body?.detail;
    throw new ApiError(res.status === 429 ? "Trop de tentatives. Réessayez dans une minute." : detail || "Une erreur est survenue.", res.status);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export async function login(email: string, password: string): Promise<Broker> {
  const out = await api<{ access_token: string; broker: Broker }>("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  setToken(out.access_token);
  return out.broker;
}

export async function activate(token: string, password: string): Promise<Broker> {
  const out = await api<{ access_token: string; broker: Broker }>("/api/v1/auth/activate", { method: "POST", body: JSON.stringify({ token, password }) });
  setToken(out.access_token);
  return out.broker;
}

export const me = () => api<Broker>("/api/v1/auth/me");

export type AccessRequest = {
  id: string; full_name: string; company: string; email: string; phone: string; orias_number: string | null;
  lead_types: string[]; message: string | null; created_at: string; broker_status: string | null;
};

export type ActivationLink = { activation_url: string; expires_at: string; broker: { email: string; full_name: string } };

export const listAccessRequests = () => api<AccessRequest[]>("/api/v1/admin/access-requests");
export const acceptAccessRequest = (id: string) => api<ActivationLink>(`/api/v1/admin/access-requests/${id}/accept`, { method: "POST" });
