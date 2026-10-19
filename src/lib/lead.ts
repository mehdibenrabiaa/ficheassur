import { z } from "zod";

// How many partners a lead can be passed to — shown in the consent text,
// so keep it in step with whatever the matching side actually does.
export const MAX_PARTNERS = 3;

export type InsuranceType = "AUTO" | "HEALTH" | "COMMERCIAL_AUTO" | "PRO_LIABILITY";

export const INSURANCE_TYPES: { value: InsuranceType; label: string; hint: string }[] = [
  { value: "AUTO", label: "Auto", hint: "Votre voiture personnelle" },
  { value: "HEALTH", label: "Santé", hint: "Mutuelle pour vous ou votre famille" },
  { value: "COMMERCIAL_AUTO", label: "Véhicules pro", hint: "Taxi, VTC, livraison, flotte" },
  { value: "PRO_LIABILITY", label: "RC Pro", hint: "Responsabilité civile professionnelle" },
];

// Step 2 questions per insurance type. Every one is a set of cards; the
// answers go into the lead's `details` as-is.
export type DetailQuestion = { key: string; label: string; options: { value: string; label: string }[] };

export const DETAIL_QUESTIONS: Record<InsuranceType, DetailQuestion[]> = {
  AUTO: [
    { key: "driver_age", label: "Âge du conducteur principal", options: [
      { value: "18-25", label: "18 – 25 ans" }, { value: "26-40", label: "26 – 40 ans" },
      { value: "41-60", label: "41 – 60 ans" }, { value: "60+", label: "Plus de 60 ans" },
    ] },
    { key: "claims_last_3y", label: "Sinistres ces 3 dernières années ?", options: [
      { value: "0", label: "Aucun" }, { value: "1", label: "Un" }, { value: "2+", label: "Deux ou plus" },
    ] },
    { key: "currently_insured", label: "Êtes-vous actuellement assuré ?", options: [
      { value: "yes", label: "Oui" }, { value: "no", label: "Non" },
    ] },
  ],
  HEALTH: [
    { key: "people", label: "Combien de personnes à couvrir ?", options: [
      { value: "1", label: "Moi seul(e)" }, { value: "2", label: "En couple" },
      { value: "family", label: "Famille avec enfants" },
    ] },
    { key: "age", label: "Âge de l'assuré principal", options: [
      { value: "18-30", label: "18 – 30 ans" }, { value: "31-50", label: "31 – 50 ans" },
      { value: "51-65", label: "51 – 65 ans" }, { value: "65+", label: "Plus de 65 ans" },
    ] },
  ],
  COMMERCIAL_AUTO: [
    { key: "activity", label: "Votre activité", options: [
      { value: "taxi", label: "Taxi" }, { value: "vtc", label: "VTC" },
      { value: "delivery", label: "Livraison" }, { value: "other", label: "Autre" },
    ] },
    { key: "fleet_size", label: "Nombre de véhicules", options: [
      { value: "1", label: "1" }, { value: "2-5", label: "2 à 5" },
      { value: "6-20", label: "6 à 20" }, { value: "20+", label: "Plus de 20" },
    ] },
  ],
  PRO_LIABILITY: [
    { key: "business_age", label: "Ancienneté de l'entreprise", options: [
      { value: "creation", label: "En création" }, { value: "<3y", label: "Moins de 3 ans" },
      { value: "3y+", label: "3 ans et plus" },
    ] },
    { key: "revenue", label: "Chiffre d'affaires annuel", options: [
      { value: "<50k", label: "Moins de 50 k€" }, { value: "50-250k", label: "50 à 250 k€" },
      { value: "250k+", label: "Plus de 250 k€" },
    ] },
  ],
};

// Same shape the backend enforces (French postal codes, French numbers);
// the API stays the authority — this just catches typos before submitting.
const FR_ZIP = /^(?:0[1-9]|[1-8]\d|9[0-8])\d{3}$/;
const FR_PHONE = /^(?:(?:\+|00)33\s?|0)[1-9](?:[\s.-]?\d{2}){4}$/;

export const coverageSchema = z.object({
  insurance_type: z.enum(["AUTO", "HEALTH", "COMMERCIAL_AUTO", "PRO_LIABILITY"]),
});

// Keys depend on the product (see DETAIL_QUESTIONS), so the type is a
// plain string record rather than a fixed object shape.
export function detailsSchema(type: InsuranceType): z.ZodType<Record<string, string>, Record<string, string>> {
  const answers = Object.fromEntries(
    DETAIL_QUESTIONS[type].map((q) => [q.key, z.string().min(1, "Choisissez une réponse")])
  );
  return z.object({
    zip_code: z.string().trim().regex(FR_ZIP, "Code postal invalide"),
    city: z.string().trim().min(1, "Indiquez votre ville"),
    ...answers,
  });
}

export const contactSchema = z.object({
  first_name: z.string().trim().min(1, "Indiquez votre prénom").max(80),
  last_name: z.string().trim().min(1, "Indiquez votre nom").max(80),
  phone: z.string().trim().regex(FR_PHONE, "Numéro de téléphone invalide"),
  email: z.string().trim().email("Adresse email invalide"),
  opt_in_marketing: z.literal(true, { message: "Votre accord est nécessaire pour recevoir des offres" }),
});

export type ContactValues = z.infer<typeof contactSchema>;

export type LeadPayload = {
  insurance_type: InsuranceType;
  zip_code: string;
  city: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  details: Record<string, string>;
  opt_in_marketing: true;
};

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

export async function submitLead(payload: LeadPayload): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/leads/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.ok) return;
  if (res.status === 429) throw new Error("Trop de demandes en peu de temps. Réessayez dans quelques minutes.");
  const body = await res.json().catch(() => null);
  const detail = Array.isArray(body?.detail)
    ? String(body.detail[0]?.msg ?? "").replace(/^Value error, /, "")
    : body?.detail;
  throw new Error(detail || "Une erreur est survenue. Réessayez.");
}
