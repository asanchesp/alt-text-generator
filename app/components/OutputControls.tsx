'use client';

import type { Controls, DetailLevel, Tone } from '@/lib/types';

interface Props {
  value: Controls;
  onChange: (value: Controls) => void;
}

interface PillGroupProps<T extends string> {
  options: { label: string; value: T }[];
  selected: T;
  onSelect: (v: T) => void;
}

function PillGroup<T extends string>({ options, selected, onSelect }: PillGroupProps<T>) {
  return (
    <div className="flex gap-2" role="group">
      {options.map((opt) => {
        const isSelected = opt.value === selected;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            aria-pressed={isSelected}
            className={`
              px-4 py-1.5 rounded-full text-sm border transition-colors duration-150 cursor-pointer
              ${
                isSelected
                  ? 'bg-[var(--color-ink-900)] text-white border-[var(--color-ink-900)]'
                  : 'bg-white text-[var(--color-ink-700)] border-[var(--color-border)] hover:border-[var(--color-ink-300)]'
              }
            `}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  displayValue?: React.ReactNode;
}

function SliderField({ label, value, min, max, onChange, displayValue }: SliderFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--color-ink-700)]">{label}</span>
        <span className="text-sm font-medium tabular-nums text-[var(--color-ink-700)]">
          {displayValue ?? value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        aria-label={label}
      />
      <div className="flex justify-between text-xs text-[var(--color-ink-300)]">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

const detailOptions: { label: string; value: DetailLevel }[] = [
  { label: 'Basic', value: 'basic' },
  { label: 'Medium', value: 'medium' },
  { label: 'Rich', value: 'rich' },
];

const toneOptions: { label: string; value: Tone }[] = [
  { label: 'Factual', value: 'factual' },
  { label: 'Contextual', value: 'contextual' },
];

export function OutputControls({ value, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-[8px]">
        <span className="text-sm font-medium text-[var(--color-ink-700)]">Detail level</span>
        <PillGroup
          options={detailOptions}
          selected={value.detailLevel}
          onSelect={(v) => onChange({ ...value, detailLevel: v })}
        />
      </div>

      <SliderField
        label="Max characters"
        value={value.maxCharacters}
        min={50}
        max={250}
        onChange={(v) => onChange({ ...value, maxCharacters: v })}
        displayValue={`${value.maxCharacters} ch.`}
      />

      <SliderField
        label="Variations"
        value={value.variationsCount}
        min={1}
        max={5}
        onChange={(v) => onChange({ ...value, variationsCount: v })}
      />

      <div className="flex flex-col gap-[8px]">
        <span className="text-sm font-medium text-[var(--color-ink-700)]">Tone</span>
        <PillGroup
          options={toneOptions}
          selected={value.tone}
          onSelect={(v) => onChange({ ...value, tone: v })}
        />
      </div>
    </div>
  );
}
