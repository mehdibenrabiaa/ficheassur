// The /assistance page's help articles, by topic. Answers describe how the
// espace pro actually works (see the backend's pricing.py and orders.py) --
// update them with the product.

export type HelpTopic = {
  id: string;
  title: string;
  description: string;
  icon: "user" | "cart" | "card" | "shield" | "list" | "handshake";
  articles: { q: string; a: string }[];
};

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "compte",
    title: "Compte et connexion",
    description: "Créer votre compte, vous connecter, mot de passe.",
    icon: "user",
    articles: [
      { q: "Comment créer un compte FicheAssur ?", a: "Cliquez sur « Devenir partenaire » et remplissez le formulaire, ou utilisez « Continuer avec Google ». Votre compte est actif immédiatement et vous arrivez dans votre espace pro." },
      { q: "J'ai oublié mon mot de passe.", a: "Envoyez-nous un message depuis le formulaire en bas de cette page (sujet « Compte et connexion ») avec l'email de votre compte : nous vous envoyons un lien pour en choisir un nouveau. Si votre compte est lié à Google, utilisez simplement « Continuer avec Google »." },
      { q: "Mon lien d'activation ne fonctionne plus.", a: "Un lien d'activation est valable 7 jours et ne sert qu'une fois. Demandez-en un nouveau via le formulaire de contact." },
      { q: "Comment modifier mes informations (cabinet, téléphone, marchés) ?", a: "Vos informations sont visibles dans Mon compte. Pour les modifier, écrivez-nous : nous mettons votre fiche à jour." },
    ],
  },
  {
    id: "achat",
    title: "Acheter des leads",
    description: "Marchés, lead partagé ou exclusif, disponibilité.",
    icon: "cart",
    articles: [
      { q: "Quelle différence entre un lead partagé et un lead exclusif ?", a: "Un lead partagé peut être acheté par 3 courtiers au plus. Un lead exclusif n'est vendu qu'à vous : plus personne ne peut l'acheter ensuite. Un lead déjà acheté en partagé ne peut plus être pris en exclusivité." },
      { q: "Combien de temps un lead reste-t-il en vente ?", a: "30 jours après la demande de devis du prospect. Au-delà, il n'apparaît plus dans « Acheter des leads »." },
      { q: "Mon panier est-il réservé pendant que je paie ?", a: "Oui : les leads de votre panier vous sont réservés 30 minutes pendant le paiement. Passé ce délai, ils redeviennent disponibles pour les autres courtiers." },
      { q: "Quels marchés proposez-vous ?", a: "Auto, Moto, Pro de l'automobile (garages, carrossiers, négociants) et Véhicules pro (taxis, VTC, utilitaires). Vous filtrez les leads par marché et par département." },
    ],
  },
  {
    id: "paiement",
    title: "Paiements et factures",
    description: "Paiement par carte, remboursements, historique.",
    icon: "card",
    articles: [
      { q: "Comment payer mes leads ?", a: "Par carte bancaire, à chaque achat, sur la page de paiement sécurisée de Stripe. Pas d'abonnement ni de crédit à recharger." },
      { q: "Un lead de ma commande a été vendu entre-temps. Suis-je débité ?", a: "Non. Si un lead n'est plus disponible au moment où votre paiement est confirmé, son prix vous est remboursé automatiquement sur votre carte." },
      { q: "Où trouver mes paiements et mes factures ?", a: "Dans Paiements, dans votre espace pro : l'historique de vos commandes, les montants remboursés et l'accès à vos reçus." },
    ],
  },
  {
    id: "qualite",
    title: "Qualité et réclamations",
    description: "Fiche inexploitable, doublon, coordonnées erronées.",
    icon: "shield",
    articles: [
      { q: "D'où viennent les leads ?", a: "De particuliers et professionnels qui ont demandé eux-mêmes un devis en ligne et accepté d'être recontactés par des partenaires." },
      { q: "Une fiche est inexploitable, que faire ?", a: "Écrivez-nous depuis le formulaire (sujet « Qualité d'un lead ») en indiquant le lead concerné et le problème : numéro erroné, doublon, prospect injoignable. Chaque réclamation est examinée au cas par cas." },
      { q: "Comment le consentement du prospect est-il recueilli ?", a: "Le prospect accepte, au moment de sa demande de devis, d'être recontacté par un nombre limité de partenaires. Ce consentement est enregistré avec sa demande." },
    ],
  },
  {
    id: "crm",
    title: "Mes leads (CRM)",
    description: "Suivre vos leads, statuts, rappels, export.",
    icon: "list",
    articles: [
      { q: "Où retrouver les leads que j'ai achetés ?", a: "Dans Mes leads, dès la confirmation du paiement, avec toutes les informations du prospect." },
      { q: "Comment suivre l'avancement d'un lead ?", a: "Chaque lead a un statut (nouveau, contacté, devis envoyé, signé, perdu), des notes et des rappels. Vous pouvez les voir en liste ou en tableau." },
      { q: "Puis-je exporter mes leads ?", a: "Oui, en CSV depuis Mes leads, pour les importer dans votre propre outil." },
    ],
  },
  {
    id: "partenariat",
    title: "Devenir partenaire",
    description: "Qui peut acheter, ORIAS, fonctionnement.",
    icon: "handshake",
    articles: [
      { q: "Qui peut acheter des leads sur FicheAssur ?", a: "Les courtiers et intermédiaires en assurance immatriculés à l'ORIAS." },
      { q: "Y a-t-il un abonnement ou un engagement ?", a: "Non. Vous payez uniquement les leads que vous choisissez, à l'unité." },
    ],
  },
];

export const SUPPORT_TOPICS: { value: string; label: string }[] = [
  { value: "compte", label: "Compte et connexion" },
  { value: "achat", label: "Acheter des leads" },
  { value: "paiement", label: "Paiements et factures" },
  { value: "qualite", label: "Qualité d'un lead" },
  { value: "crm", label: "Mes leads (CRM)" },
  { value: "partenariat", label: "Devenir partenaire" },
  { value: "autre", label: "Autre question" },
];
