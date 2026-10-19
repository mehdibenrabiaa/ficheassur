// The lead categories FicheAssur sells. `value` matches the backend's
// InsuranceType enum (app/schemas/lead.py). `href` is where a card's
// "Découvrir" link goes: the access form for now -- set it to the market's
// own page (e.g. "/leads/auto") once those pages exist.
export const LEAD_TYPES = [
  { value: "AUTO", href: "/#acces", label: "Auto", body: "Particuliers cherchant une assurance pour leur voiture : profil du conducteur, sinistralité, situation actuelle." },
  { value: "MOTO", href: "/#acces", label: "Moto", body: "Motards et scootéristes : type et cylindrée du deux-roues, expérience de conduite, sinistralité." },
  { value: "AUTO_PRO", href: "/#acces", label: "Pro de l'automobile", body: "Garages, négociants et convoyeurs : activité exercée, véhicules confiés et chiffre d'affaires." },
  { value: "COMMERCIAL_AUTO", href: "/#acces", label: "Véhicules pro", body: "Taxis, VTC, livreurs et flottes : activité exercée et nombre de véhicules à assurer." },
] as const;
