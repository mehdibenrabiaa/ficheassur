"use client";

import { useEffect, useId, useRef, useState } from "react";

// A text field with suggestions in the site's own style (the browser's
// <datalist> popup can't be styled). Type anything, or pick a suggestion
// with the mouse or the keyboard (↑ ↓ Enter, Escape to close).
export default function Combobox({
  value,
  onChange,
  options,
  className,
  maxLength,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  className: string;
  maxLength?: number;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();

  // While typing, narrow the list; when the field holds one of the options (or nothing), show them all.
  const typed = value.trim().toLowerCase();
  const shown = !typed || options.some((o) => o.toLowerCase() === typed) ? options : options.filter((o) => o.toLowerCase().includes(typed));

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function pick(o: string) {
    onChange(o);
    setOpen(false);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen(true);
      setActive((i) => (shown.length ? (i + (e.key === "ArrowDown" ? 1 : -1) + shown.length) % shown.length : 0));
    } else if (e.key === "Enter" && open && shown[active]) {
      e.preventDefault();
      pick(shown[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && shown[active] ? `${listId}-${active}` : undefined}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        className={`${className} pr-9`}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Afficher les suggestions"
        onClick={() => setOpen((o) => !o)}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-slate-500 hover:text-ink"
      >
        <svg viewBox="0 0 24 24" className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && shown.length > 0 && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          {shown.map((o, i) => {
            const selected = o.toLowerCase() === typed;
            return (
              <li
                key={o}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={selected}
                onMouseDown={(e) => {
                  e.preventDefault(); // keep focus in the field
                  pick(o);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-[14px] ${i === active ? "bg-slate-100 text-ink" : "text-ink"} ${selected ? "font-semibold text-brand" : ""}`}
              >
                {o}
                {selected && <svg viewBox="0 0 20 20" className="size-4 text-brand" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path d="M4 10.5l4 4 8-9" /></svg>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
