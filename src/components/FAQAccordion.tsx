'use client';

import {useId, useState} from 'react';

export default function FAQAccordion({items}: {items: {q: string; a: string}[]}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const id = useId();

  return <div className="mt-8 divide-y divide-gray-200">
    {items.map((item, index) => {
      const open = openIndex === index;
      const triggerId = `${id}-question-${index}`;
      const panelId = `${id}-answer-${index}`;
      return <div key={item.q}>
        <h3>
          <button type="button" id={triggerId} aria-expanded={open} aria-controls={panelId} onClick={() => setOpenIndex(open ? null : index)} className="flex w-full cursor-pointer items-center justify-between gap-4 bg-transparent py-5 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
            <span className="text-base font-semibold leading-snug text-ink">{item.q}</span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="shrink-0 text-brand">
              <path d="M5 12h14" />
              <path d="M12 5v14" className={`transition-opacity duration-200 motion-reduce:transition-none ${open ? 'opacity-0' : 'opacity-100'}`} />
            </svg>
          </button>
        </h3>
        <div id={panelId} role="region" aria-labelledby={triggerId} aria-hidden={!open} inert={!open} className={`grid overflow-hidden transition-[grid-template-rows] duration-350 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="min-h-0 overflow-hidden">
            <p className="pb-5 text-base leading-[26px] text-gray-600 sm:leading-6">{item.a}</p>
          </div>
        </div>
      </div>;
    })}
  </div>;
}
