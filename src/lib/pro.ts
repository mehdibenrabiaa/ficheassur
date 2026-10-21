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

export type RegisterInput = {
  full_name: string; company: string; email: string; phone: string; orias_number: string | null;
  lead_types: string[]; password: string;
};

// Self-service sign-up: the account is active at once and the broker is signed in.
export async function register(input: RegisterInput): Promise<Broker> {
  const out = await api<{ access_token: string; broker: Broker }>("/api/v1/auth/register", { method: "POST", body: JSON.stringify(input) });
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

// ---- Marketplace, payments, CRM (backend marketplace.py, billing.py, crm.py) ----

export type MarketLead = {
  id: string; insurance_type: string; city: string; department: string; first_name_initial: string;
  details: Record<string, string | number | boolean>; created_at: string;
  shared_price_cents: number; exclusive_price_cents: number; exclusive_available: boolean; buyers: number; max_buyers: number;
};

export const listMarketLeads = (filters: { insurance_type?: string; department?: string }) => {
  const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as [string, string][]).toString();
  return api<MarketLead[]>(`/api/v1/marketplace/leads${qs ? `?${qs}` : ""}`);
};

// One card payment per cart: "redirect" -> go to Stripe's payment page;
// "paid" -> already delivered (simulated payments in local dev).
export const checkout = (items: { lead_id: string; exclusive: boolean }[]) =>
  api<{ status: "paid" | "redirect"; order_id: string; url?: string }>("/api/v1/marketplace/checkout", { method: "POST", body: JSON.stringify({ items }) });
export const cancelOrder = (id: string) => api<void>(`/api/v1/marketplace/orders/${id}/cancel`, { method: "POST" });

export type Order = { id: string; total_cents: number; refunded_cents: number; paid_at: string; items: { label: string; price_cents: number }[] };
export type Billing = {
  simulated: boolean;
  card: { brand: string; last4: string; exp_month: number; exp_year: number } | null;
  orders: Order[];
};

export const getBilling = () => api<Billing>("/api/v1/billing");
export const billingPortal = () => api<{ url: string }>("/api/v1/billing/portal", { method: "POST" });

export type CrmStatus = "new" | "contacted" | "quote_sent" | "won" | "lost";

export const CRM_STATUSES: { value: CrmStatus; label: string; dot: string }[] = [
  { value: "new", label: "Nouveau", dot: "bg-accent" },
  { value: "contacted", label: "Contacté", dot: "bg-amber-500" },
  { value: "quote_sent", label: "Devis envoyé", dot: "bg-violet-500" },
  { value: "won", label: "Signé", dot: "bg-emerald-600" },
  { value: "lost", label: "Perdu", dot: "bg-slate-400" },
];

export type CrmLead = {
  id: string; lead_id: string; insurance_type: string; first_name: string; last_name: string; email: string; phone: string;
  zip_code: string; city: string; details: Record<string, string | number | boolean>; exclusive: boolean; price_cents: number;
  status: CrmStatus; reminder_at: string | null; purchased_at: string; lead_created_at: string;
};
export type CrmLeadDetail = CrmLead & {
  notes: { id: string; body: string; created_at: string }[];
  events: { id: string; kind: string; detail: string; created_at: string }[];
};
export type CrmSummary = { spent_month_cents: number; counts: Record<CrmStatus, number>; total: number; reminders_due: CrmLead[]; recent: CrmLead[] };

const crmQuery = (filters: { status?: string; q?: string }) => {
  const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as [string, string][]).toString();
  return qs ? `?${qs}` : "";
};

export const listCrmLeads = (filters: { status?: string; q?: string } = {}) => api<CrmLead[]>(`/api/v1/crm/leads${crmQuery(filters)}`);
export const getCrmLead = (id: string) => api<CrmLeadDetail>(`/api/v1/crm/leads/${id}`);
export const updateCrmLead = (id: string, body: { status?: CrmStatus; reminder_at?: string; clear_reminder?: boolean }) =>
  api<CrmLead>(`/api/v1/crm/leads/${id}`, { method: "PATCH", body: JSON.stringify(body) });
export const addCrmNote = (id: string, body: string) =>
  api<{ id: string; body: string; created_at: string }>(`/api/v1/crm/leads/${id}/notes`, { method: "POST", body: JSON.stringify({ body }) });
export const getCrmSummary = () => api<CrmSummary>("/api/v1/crm/summary");

// The CSV needs the bearer token, so it's fetched and saved from a blob
// rather than opened as a plain link.
export async function downloadCrmCsv(filters: { status?: string; q?: string } = {}) {
  const res = await fetch(`${API_URL}/api/v1/crm/export.csv${crmQuery(filters)}`, { headers: { Authorization: `Bearer ${getToken() ?? ""}` } });
  if (!res.ok) throw new ApiError("Export impossible. Réessayez.", res.status);
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = "mes-leads-ficheassur.csv";
  a.click();
  URL.revokeObjectURL(url);
}
