"use client";

import { useEffect, useId, useRef, useState } from "react";

// A dropdown in the site's style, replacing the browser's <select> (whose
// popup can't be styled). The menu floats above the page (fixed position,
// under the button), so a scrolling table can't cut it off. Keyboard:
// ↑ ↓ to move, Enter to pick, Escape to close.

export type SelectOption = { value: string; label: string; dot?: string };

export default function Select({
  value,
  onChange,
  options,
  placeholder = "Choisir…",
  ariaLabel,
  className = "",
  size = "md",
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ left: number; top: number; width: number; up: boolean } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLUListElement>(null);
  const listId = useId();
  const current = options.find((o) => o.value === value);

  function show() {
    const r = button.current!.getBoundingClientRect();
    const height = Math.min(options.length * 38 + 8, 280);
    const up = r.bottom + height + 8 > window.innerHeight && r.top > height + 8;
    setPos({ left: r.left, top: up ? r.top - height - 4 : r.bottom + 4, width: Math.max(r.width, 180), up });
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }

  // Close on a click elsewhere, a scroll or a resize (the menu is placed once).
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e.type === "mousedown" && (button.current?.contains(e.target as Node) || menu.current?.contains(e.target as Node))) return;
      if (e.type === "scroll" && menu.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  function pick(v: string) {
    onChange(v);
    setOpen(false);
    button.current?.focus();
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || ((e.key === "Enter" || e.key === " ") && !open)) {
      e.preventDefault();
      if (!open) return show();
      setActive((i) => (i + (e.key === "ArrowUp" ? -1 : 1) + options.length) % options.length);
    } else if ((e.key === "Enter" || e.key === " ") && open) {
      e.preventDefault();
      pick(options[active].value);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
    }
  }

  const sizing = size === "sm" ? "h-9 px-2.5 text-[13px]" : "h-12 px-4 text-[15px]";
  return (
    <>
      <button
        ref={button}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKey}
        className={`flex w-full items-center justify-between gap-2 rounded-md border border-slate-300 bg-white text-left text-ink outline-none transition hover:border-slate-400 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 ${sizing} ${className}`}
      >
        <span className={`flex min-w-0 items-center gap-2 truncate ${current ? "font-semibold" : "text-slate-400"}`}>
          {current?.dot && <span className={`size-2 shrink-0 rounded-full ${current.dot}`} aria-hidden="true" />}
          {current?.label ?? placeholder}
        </span>
        <svg viewBox="0 0 24 24" className={`size-4 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && pos && (
        <ul
          ref={menu}
          id={listId}
          role="listbox"
          style={{ left: pos.left, top: pos.top, minWidth: pos.width }}
          className="fixed z-[70] max-h-[280px] overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.14)]"
        >
          {options.map((o, i) => {
            const selected = o.value === value;
            return (
              <li
                key={o.value}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={selected}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(o.value);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-[14px] ${i === active ? "bg-slate-100" : ""} ${selected ? "font-semibold text-brand" : "text-ink"}`}
              >
                {o.dot && <span className={`size-2 shrink-0 rounded-full ${o.dot}`} aria-hidden="true" />}
                <span className="flex-1">{o.label}</span>
                {selected && <svg viewBox="0 0 20 20" className="size-4 text-brand" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path d="M4 10.5l4 4 8-9" /></svg>}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
