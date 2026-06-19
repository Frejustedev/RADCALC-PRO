import React, { useEffect, useState } from 'react';
import { cn } from '../lib/cn';
import { focusRing } from './ui';

export interface SectionDef {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SectionNavProps {
  sections: SectionDef[];
}

const SCROLL_OFFSET = 140; // sticky navbar + section nav height

/** Sticky in-page navigation with scroll-spy highlighting. */
export const SectionNav: React.FC<SectionNavProps> = ({ sections }) => {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: `-${SCROLL_OFFSET}px 0px -55% 0px`, threshold: [0.1, 0.5, 1] },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top: y, behavior: 'smooth' });
    setActive(id);
  };

  return (
    <div className="sticky top-16 z-30 -mx-4 px-4 py-2 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60 print:hidden">
      <nav className="flex gap-1.5 overflow-x-auto no-scrollbar" aria-label="Sections du calculateur">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => handleClick(s.id)}
            aria-current={active === s.id ? 'location' : undefined}
            className={cn(
              'flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors border',
              focusRing,
              active === s.id
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/60',
            )}
          >
            {s.icon}
            <span>{s.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
