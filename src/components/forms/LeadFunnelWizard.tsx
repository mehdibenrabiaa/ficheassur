"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  INSURANCE_TYPES, DETAIL_QUESTIONS, MAX_PARTNERS,
  coverageSchema, detailsSchema, contactSchema, submitLead,
  type InsuranceType, type ContactValues,
} from "@/lib/lead";

const STEPS = ["Votre besoin", "Votre situation", "Vos coordonnées"];

// Three-step quote funnel: coverage → type-specific details → contact.
// Each step owns its own form + zod schema, so "Suivant" only unlocks once
// that screen is valid, and contact details are only asked for last.
export default function LeadFunnelWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [type, setType] = useState<InsuranceType | null>(null);
  const [details, setDetails] = useState<Record<string, string> | null>(null);

  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
          <span>Étape {step + 1} sur {STEPS.length} — {STEPS[step]}</span>
          <span className="font-medium text-slate-700">{progress} %</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-blue-600 transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div key={step} className="animate-step-in">
        {step === 0 && (
          <CoverageStep
            initial={type}
            onNext={(t) => {
              // A different product means different detail questions.
              if (t !== type) setDetails(null);
              setType(t);
              setStep(1);
            }}
          />
        )}
        {step === 1 && type && (
          <DetailsStep
            type={type}
            initial={details}
            onBack={() => setStep(0)}
            onNext={(d) => { setDetails(d); setStep(2); }}
          />
        )}
        {step === 2 && type && details && (
          <ContactStep
            onBack={() => setStep(1)}
            onSubmit={async (contact) => {
              const { zip_code, city, ...answers } = details;
              await submitLead({
                insurance_type: type,
                zip_code, city,
                first_name: contact.first_name,
                last_name: contact.last_name,
                email: contact.email,
                phone: contact.phone,
                details: answers,
                opt_in_marketing: true,
              });
              router.push("/quote/success");
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ── Step 1 ───────────────────────────────────────────────────────────── */

function CoverageStep({ initial, onNext }: { initial: InsuranceType | null; onNext: (t: InsuranceType) => void }) {
  const { control, handleSubmit, formState: { isValid } } = useForm<{ insurance_type: InsuranceType }>({
    resolver: zodResolver(coverageSchema),
    mode: "onChange",
    defaultValues: initial ? { insurance_type: initial } : undefined,
  });

  return (
    <form onSubmit={handleSubmit((v) => onNext(v.insurance_type))} className="flex flex-col gap-6">
      <h2 className="text-2xl font-semibold text-slate-900">Quelle assurance recherchez-vous ?</h2>
      <Controller
        name="insurance_type"
        control={control}
        render={({ field }) => (
          <div role="radiogroup" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {INSURANCE_TYPES.map((t) => (
              <ChoiceCard key={t.value} selected={field.value === t.value} onSelect={() => field.onChange(t.value)}>
                <span className="block text-lg font-semibold">{t.label}</span>
                <span className="block text-sm text-slate-500">{t.hint}</span>
              </ChoiceCard>
            ))}
          </div>
        )}
      />
      <NavButtons nextDisabled={!isValid} />
    </form>
  );
}

/* ── Step 2 ───────────────────────────────────────────────────────────── */

function DetailsStep({ type, initial, onBack, onNext }: {
  type: InsuranceType;
  initial: Record<string, string> | null;
  onBack: () => void;
  onNext: (d: Record<string, string>) => void;
}) {
  const questions = DETAIL_QUESTIONS[type];
  const { control, register, handleSubmit, formState: { isValid, errors } } = useForm<Record<string, string>>({
    resolver: zodResolver(detailsSchema(type)),
    mode: "onChange",
    defaultValues: initial ?? { zip_code: "", city: "", ...Object.fromEntries(questions.map((q) => [q.key, ""])) },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="flex flex-col gap-7">
      <h2 className="text-2xl font-semibold text-slate-900">Parlez-nous un peu de vous</h2>

      {questions.map((q) => (
        <fieldset key={q.key} className="flex flex-col gap-3">
          <legend className="mb-3 font-medium text-slate-800">{q.label}</legend>
          <Controller
            name={q.key}
            control={control}
            render={({ field }) => (
              <div role="radiogroup" className="grid grid-cols-2 gap-3">
                {q.options.map((o) => (
                  <ChoiceCard key={o.value} selected={field.value === o.value} onSelect={() => field.onChange(o.value)} compact>
                    {o.label}
                  </ChoiceCard>
                ))}
              </div>
            )}
          />
        </fieldset>
      ))}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_2fr]">
        <Field label="Code postal" error={errors.zip_code?.message}>
          <input {...register("zip_code")} inputMode="numeric" autoComplete="postal-code" maxLength={5} placeholder="75011" className={inputClass} />
        </Field>
        <Field label="Ville" error={errors.city?.message}>
          <input {...register("city")} autoComplete="address-level2" placeholder="Paris" className={inputClass} />
        </Field>
      </div>

      <NavButtons onBack={onBack} nextDisabled={!isValid} />
    </form>
  );
}

/* ── Step 3 ───────────────────────────────────────────────────────────── */

function ContactStep({ onBack, onSubmit }: { onBack: () => void; onSubmit: (c: ContactValues) => Promise<void> }) {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { isValid, errors, isSubmitting } } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    mode: "onChange",
  });

  return (
    <form
      onSubmit={handleSubmit(async (v) => {
        setError(null);
        try { await onSubmit(v); } catch (e) { setError(e instanceof Error ? e.message : "Une erreur est survenue."); }
      })}
      className="flex flex-col gap-5"
    >
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Où vous envoyer vos devis ?</h2>
        <p className="mt-1 text-sm text-slate-500">Dernière étape — vos offres arrivent juste après.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Prénom" error={errors.first_name?.message}>
          <input {...register("first_name")} autoComplete="given-name" className={inputClass} />
        </Field>
        <Field label="Nom" error={errors.last_name?.message}>
          <input {...register("last_name")} autoComplete="family-name" className={inputClass} />
        </Field>
      </div>
      <Field label="Téléphone" error={errors.phone?.message}>
        <input {...register("phone")} type="tel" inputMode="tel" autoComplete="tel" placeholder="06 12 34 56 78" className={inputClass} />
      </Field>
      <Field label="Email" error={errors.email?.message}>
        <input {...register("email")} type="email" autoComplete="email" placeholder="vous@exemple.fr" className={inputClass} />
      </Field>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
        <input {...register("opt_in_marketing")} type="checkbox" className="mt-0.5 size-5 shrink-0 accent-blue-600" />
        <span>
          En envoyant cette demande, j&apos;accepte d&apos;être contacté(e) par {MAX_PARTNERS} partenaires assureurs au maximum,
          par téléphone, email ou SMS, afin de recevoir des propositions de devis. Je peux retirer mon consentement à tout moment.
        </span>
      </label>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <NavButtons
        onBack={isSubmitting ? undefined : onBack}
        nextDisabled={!isValid || isSubmitting}
        nextLabel={isSubmitting ? (<><Spinner /> Envoi en cours…</>) : "Recevoir mes devis"}
      />
    </form>
  );
}

/* ── Shared bits ──────────────────────────────────────────────────────── */

const inputClass =
  "h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";

function ChoiceCard({ selected, onSelect, compact, children }: {
  selected: boolean; onSelect: () => void; compact?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`rounded-xl border-2 text-left transition ${compact ? "min-h-14 px-4 py-3 text-base font-medium" : "min-h-24 p-5"} ${
        selected ? "border-blue-600 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </label>
  );
}

function NavButtons({ onBack, nextDisabled, nextLabel = "Suivant" }: {
  onBack?: () => void; nextDisabled: boolean; nextLabel?: React.ReactNode;
}) {
  return (
    <div className="mt-2 flex items-center justify-between gap-3">
      {onBack ? (
        <button type="button" onClick={onBack} className="h-12 rounded-lg px-4 font-medium text-slate-600 hover:bg-slate-100">
          Retour
        </button>
      ) : <span />}
      <button
        type="submit"
        disabled={nextDisabled}
        className="inline-flex h-12 items-center gap-2 rounded-lg bg-blue-600 px-7 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {nextLabel}
      </button>
    </div>
  );
}

function Spinner() {
  return <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />;
}
