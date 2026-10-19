// The lead categories FicheAssur sells. `value` matches the backend's
// InsuranceType enum (app/schemas/lead.py).
export const LEAD_TYPES = [
  { value: "AUTO", label: "Auto", body: "Particuliers cherchant une assurance pour leur voiture : profil du conducteur, sinistralité, situation actuelle." },
  { value: "HEALTH", label: "Santé", body: "Mutuelle individuelle, couple ou famille, avec l'âge de l'assuré principal et le nombre de personnes à couvrir." },
  { value: "COMMERCIAL_AUTO", label: "Véhicules pro", body: "Taxis, VTC, livreurs et flottes : activité exercée et nombre de véhicules à assurer." },
  { value: "PRO_LIABILITY", label: "RC Pro", body: "Entreprises et indépendants : ancienneté de l'activité et chiffre d'affaires annuel." },
] as const;
