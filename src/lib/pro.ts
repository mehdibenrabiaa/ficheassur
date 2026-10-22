"use client";

// Espace pro session and API calls (backend app/api/v1/auth.py, admin.py).
// The login token lives in localStorage; every call sends it as a bearer
// token, and a 401 clears it so the layout sends the broker back to login.

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8100").replace(/\/+$/, "");
const TOKEN_KEY = "ficheassur_pro_token";

export type Broker = {
  id: string; email: string; full_name: string; company: string; role: "broker" | "admin"; lead_types: string[];
  phone: string | null; orias_number: string | null; has_password: boolean; created_at: string | null;
};

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

// "Continuer avec Microsoft": signs in, or creates the account on first use (refused if the email
// already belongs to an account that wasn't opened with Microsoft).
export async function microsoftSignIn(idToken: string): Promise<Broker> {
  const out = await api<{ access_token: string; broker: Broker }>("/api/v1/auth/microsoft", { method: "POST", body: JSON.stringify({ id_token: idToken }) });
  setToken(out.access_token);
  return out.broker;
}

// "Continuer avec Google": signs in, or creates the account on first use.
export async function googleSignIn(accessToken: string): Promise<Broker> {
  const out = await api<{ access_token: string; broker: Broker }>("/api/v1/auth/google", { method: "POST", body: JSON.stringify({ access_token: accessToken }) });
  setToken(out.access_token);
  return out.broker;
}

export const me = () => api<Broker>("/api/v1/auth/me");
export type ProfileInput = { full_name: string; company: string; phone: string | null; orias_number: string | null; lead_types: string[] };
export const updateMe = (body: ProfileInput) => api<Broker>("/api/v1/auth/me", { method: "PATCH", body: JSON.stringify(body) });
// Proof of identity: the current password, or (account created with Google, no password yet) a fresh
// Google access token. Every other session is signed out; this one continues with the new token.
export async function changePassword(proof: { current_password?: string; google_access_token?: string }, new_password: string): Promise<Broker> {
  const out = await api<{ access_token: string; broker: Broker }>("/api/v1/auth/password", { method: "POST", body: JSON.stringify({ ...proof, new_password }) });
  setToken(out.access_token);
  return out.broker;
}

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
  api<{ status: "paid" | "embedded"; order_id: string; client_secret?: string }>("/api/v1/marketplace/checkout", { method: "POST", body: JSON.stringify({ items }) });
export type OrderView = {
  id: string; status: "pending" | "paid" | "expired"; total_cents: number; refunded_cents: number; expires_at: string;
  items: { id: string; label: string; price_cents: number; purchase_id: string | null }[]; client_secret: string | null;
};
export const getOrder = (id: string) => api<OrderView>(`/api/v1/marketplace/orders/${id}`);
export const confirmOrder = (id: string) => api<void>(`/api/v1/marketplace/orders/${id}/confirm`, { method: "POST" });
export const cancelOrder = (id: string) => api<void>(`/api/v1/marketplace/orders/${id}/cancel`, { method: "POST" });

export type Order = { id: string; total_cents: number; refunded_cents: number; paid_at: string; items: { label: string; price_cents: number }[] };
export type SavedCard = { id: string; brand: string; last4: string; exp_month: number; exp_year: number; default: boolean };
export type Billing = {
  simulated: boolean;
  card: SavedCard | null;
  cards: SavedCard[];
  orders: Order[];
};
// Saved cards, managed in the espace pro (Stripe's card form embedded in the page).
export const addCardSetup = () => api<{ client_secret: string }>("/api/v1/billing/cards/setup", { method: "POST" });
export const setDefaultCard = (id: string) => api<void>(`/api/v1/billing/cards/${id}/default`, { method: "POST" });
export const deleteCard = (id: string) => api<void>(`/api/v1/billing/cards/${id}`, { method: "DELETE" });

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
  revenues: Revenue[];
};

// What a bought lead earned (commission, fees...), and the finance summary built from it.
export type Revenue = { id: string; amount_cents: number; label: string; invoiced_on: string; created_at: string };
export const addRevenue = (purchaseId: string, body: { amount_cents: number; label: string; invoiced_on: string }) =>
  api<Revenue>(`/api/v1/crm/leads/${purchaseId}/revenues`, { method: "POST", body: JSON.stringify(body) });
export const deleteRevenue = (id: string) => api<void>(`/api/v1/crm/revenues/${id}`, { method: "DELETE" });
export type FinanceTotals = { spent_cents: number; revenue_cents: number; leads: number; leads_with_revenue: number };
export type Finance = {
  totals: FinanceTotals & { expenses_cents: number };
  by_market: (FinanceTotals & { insurance_type: string })[];
  months: { month: string; spent_cents: number; revenue_cents: number; expenses_cents: number }[];
  top_leads: { lead: LeadRef; price_cents: number; revenue_cents: number }[];
};
// Frais généraux: running costs besides leads (phone, internet, subscriptions...).
export type ExpenseCategory = "phone" | "internet" | "software" | "other";
export type ExpenseFrequency = "once" | "monthly" | "yearly";
export type Expense = {
  id: string; label: string; category: ExpenseCategory; amount_cents: number; frequency: ExpenseFrequency;
  start_on: string; end_on: string | null; monthly_cents: number;
};
export const listExpenses = () => api<Expense[]>("/api/v1/crm/expenses");
export const addExpense = (body: Omit<Expense, "id" | "monthly_cents" | "end_on">) =>
  api<Expense>("/api/v1/crm/expenses", { method: "POST", body: JSON.stringify(body) });
export const stopExpense = (id: string, end_on: string | null) =>
  api<Expense>(`/api/v1/crm/expenses/${id}`, { method: "PATCH", body: JSON.stringify({ end_on }) });
export const deleteExpense = (id: string) => api<void>(`/api/v1/crm/expenses/${id}`, { method: "DELETE" });
// A period: each amount counted on its own date (purchase, invoice, month paid). null = open-ended.
// With a market: that market only (frais généraux, which belong to none, are left out).
export const getFinance = (since: string | null, until: string | null, market: string | null = null) =>
  api<Finance>(`/api/v1/crm/finance${pageQuery({ since, until, market })}`);
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

// Portfolio views (the CRM section): every reminder, note and event across the broker's leads.
export type LeadRef = { purchase_id: string; name: string; phone: string; city: string; insurance_type: string; status: CrmStatus };
export type ReminderItem = { reminder_at: string; lead: LeadRef };
export type PortfolioNote = { id: string; body: string; created_at: string; lead: LeadRef };
export type ActivityItem = { id: string; kind: "purchased" | "status" | "reminder" | "note" | string; detail: string; created_at: string; lead: LeadRef };
export const listReminders = () => api<ReminderItem[]>("/api/v1/crm/reminders");
// Served a page at a time (newest first): pass back next_cursor to get the following page.
export type Page<T> = { items: T[]; total: number; next_cursor: string | null };
const pageQuery = (params: Record<string, string | null | undefined>) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
  return qs ? `?${qs}` : "";
};
export const listAllNotes = (q: string, cursor: string | null) => api<Page<PortfolioNote>>(`/api/v1/crm/notes${pageQuery({ q: q.trim(), cursor })}`);
export const listActivity = (kind: string, cursor: string | null) => api<Page<ActivityItem>>(`/api/v1/crm/activity${pageQuery({ kind, cursor })}`);

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
