'use client';

import type { Context } from '@/lib/types';

interface Props {
  value: Context;
  onChange: (value: Context) => void;
}

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[var(--color-ink-700)]">{label}</label>
      {children}
      {hint && <p className="text-xs text-[var(--color-ink-300)]">{hint}</p>}
    </div>
  );
}

const inputClass = `
  w-full rounded-lg border border-[var(--color-border)] bg-white
  px-3 py-2 text-sm text-[var(--color-ink-900)]
  placeholder:text-[var(--color-ink-300)]
  hover:border-[var(--color-border-focus)]
  focus:border-[var(--color-border-focus)] focus:outline-none
  transition-colors duration-150
`;

export function ContextForm({ value, onChange }: Props) {
  const set = (field: keyof Context) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => onChange({ ...value, [field]: e.target.value });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Type of site">
          <input
            type="text"
            value={value.siteType}
            onChange={set('siteType')}
            placeholder="e.g. portfolio, e-commerce, news article…"
            className={inputClass}
          />
        </Field>

        <Field label="Audience">
          <input
            type="text"
            value={value.audience}
            onChange={set('audience')}
            placeholder="e.g. art curators, general public…"
            className={inputClass}
          />
        </Field>
      </div>

      <Field
        label="Brand & product names"
        hint="The AI uses these names only when it's confident the product is visible — it will never invent names you haven't provided."
      >
        <textarea
          rows={3}
          value={value.namedEntities}
          onChange={set('namedEntities')}
          placeholder="e.g. Tazz (slipper, beige leather, woven sole), Cumbuco (slipper, navy fabric)"
          className={`${inputClass} resize-none`}
        />
      </Field>

      <Field label="Purpose / additional notes">
        <textarea
          rows={3}
          value={value.purpose}
          onChange={set('purpose')}
          placeholder="e.g. Hero image of homepage, should evoke documentary style"
          className={`${inputClass} resize-none`}
        />
      </Field>
    </div>
  );
}
