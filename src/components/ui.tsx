import React from 'react';
import { cn } from '../lib/cn';

/** Shared keyboard focus indicator (WCAG 2.4.7). */
export const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';

/** Surface card used across the app. */
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { as?: 'div' | 'section' }> = ({
  className,
  as: Tag = 'div',
  ...props
}) => (
  <Tag
    className={cn(
      'bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl',
      'transition-colors',
      className,
    )}
    {...props}
  />
);

interface SectionHeadingProps {
  icon?: React.ReactNode;
  title: string;
  accent?: string; // tailwind text color class for the icon
  right?: React.ReactNode;
  id?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ icon, title, accent = 'text-emerald-400', right, id }) => (
  <div className="flex items-center justify-between mb-6" id={id}>
    <div className="flex items-center gap-2">
      {icon && <span className={accent}>{icon}</span>}
      <h2 className="text-lg sm:text-xl font-semibold text-slate-100">{title}</h2>
    </div>
    {right}
  </div>
);

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  accent?: 'emerald' | 'indigo';
}

const ACTIVE_ACCENT: Record<'emerald' | 'indigo', string> = {
  emerald: 'bg-emerald-600 text-white border-emerald-500 focus-visible:ring-emerald-500',
  indigo: 'bg-indigo-600 text-white border-indigo-500 focus-visible:ring-indigo-500',
};

export const IconButton: React.FC<IconButtonProps> = ({ active, accent = 'emerald', className, ...props }) => (
  <button
    className={cn(
      'p-2 rounded-lg transition-colors border outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
      active
        ? ACTIVE_ACCENT[accent]
        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 focus-visible:ring-slate-500',
      className,
    )}
    {...props}
  />
);

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
  ariaLabel?: string;
}

export function Segmented<T extends string>({ options, value, onChange, size = 'md', ariaLabel }: SegmentedProps<T>) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="inline-flex bg-slate-800 p-1 rounded-lg border border-slate-700">
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(opt.value)}
            className={cn(
              'font-bold rounded-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
              size === 'sm' ? 'px-3 py-1 text-[10px]' : 'px-3.5 py-1.5 text-xs',
              selected ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** Small coloured status pill. */
export const Pill: React.FC<{ tone?: 'emerald' | 'indigo' | 'amber' | 'rose' | 'slate'; className?: string; children: React.ReactNode }> = ({
  tone = 'slate',
  className,
  children,
}) => {
  const tones: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    slate: 'bg-slate-800 text-slate-400 border-slate-700',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border', tones[tone], className)}>
      {children}
    </span>
  );
};
