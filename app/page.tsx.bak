'use client';

import { useRef, useState } from 'react';
import { UploadZone } from '@/app/components/UploadZone';
import { ContextForm } from '@/app/components/ContextForm';
import { OutputControls } from '@/app/components/OutputControls';
import { ResultCard } from '@/app/components/ResultCard';
import type { Context, Controls, ImageResult } from '@/lib/types';

const defaultControls: Controls = {
  detailLevel: 'medium',
  maxCharacters: 125,
  variationsCount: 3,
  tone: 'factual',
};

const defaultContext: Context = {
  siteType: '',
  audience: '',
  purpose: '',
  namedEntities: '',
};

interface SectionProps {
  number: number;
  title: string;
  children: React.ReactNode;
}

function Section({ number, title, children }: SectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline gap-3">
        <span className="text-xs font-medium tracking-widest text-[var(--color-ink-300)] uppercase tabular-nums">
          {String(number).padStart(2, '0')}
        </span>
        <h2 className="text-base font-medium text-[var(--color-ink-900)]">{title}</h2>
      </div>
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-6 py-6">
        {children}
      </div>
    </section>
  );
}

export default function HomePage() {
  const [images, setImages] = useState<ImageResult[]>([]);
  const [context, setContext] = useState<Context>(defaultContext);
  const [controls, setControls] = useState<Controls>(defaultControls);
  const [results, setResults] = useState<ImageResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  const hasResults = results.length > 0;

  const callGenerateAPI = async (image: ImageResult): Promise<ImageResult> => {
    const form = new FormData();
    form.append('image', image.file);
    form.append('controls', JSON.stringify(controls));
    form.append('context', JSON.stringify(context));

    let res: Response;
    try {
      res = await fetch('/api/generate', { method: 'POST', body: form });
    } catch {
      return {
        ...image,
        status: 'error',
        error: {
          title: 'Connection error',
          detail: 'Could not reach the server. Check your internet connection and try again.',
          recoverable: true,
        },
      };
    }

    const data = await res.json();

    if (!res.ok) {
      const isConfig = data.code === 'config_error';
      const isInput = data.code === 'input_error';
      return {
        ...image,
        status: 'error',
        error: {
          title: isConfig
            ? 'API key not configured'
            : isInput
              ? "Couldn't read image format"
              : 'AI service error',
          detail: data.error ?? 'Something went wrong. Try again.',
          recoverable: !isInput,
        },
      };
    }

    return { ...image, status: 'done', result: data };
  };

  const handleGenerate = async () => {
    if (images.length === 0 || isGenerating) return;

    setIsGenerating(true);
    setTotalProcessed(0);

    const initial: ImageResult[] = images.map((img) => ({ ...img, status: 'queued' as const }));
    setResults(initial);

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);

    // Sequential processing — one image at a time
    const updated = [...initial];
    for (let i = 0; i < updated.length; i++) {
      updated[i] = { ...updated[i], status: 'processing' as const };
      setResults([...updated]);

      updated[i] = await callGenerateAPI(updated[i]);
      setTotalProcessed(i + 1);
      setResults([...updated]);
    }

    setIsGenerating(false);
  };

  const handleRegenerate = async (id: string) => {
    const idx = results.findIndex((r) => r.id === id);
    if (idx === -1) return;

    const updated = [...results];
    updated[idx] = { ...updated[idx], status: 'processing' as const, result: undefined, error: undefined };
    setResults([...updated]);

    updated[idx] = await callGenerateAPI(updated[idx]);
    setResults([...updated]);
  };

  // "Replace image" — removes the card from results and the image from the upload queue,
  // then scrolls back up so the user can drop a new file in its place.
  const handleReplaceImage = (id: string) => {
    setResults((prev) => prev.filter((r) => r.id !== id));
    setImages((prev) => prev.filter((img) => img.id !== id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const estimatedSeconds = Math.round(images.length * 1.5);

  return (
    <main className="min-h-screen px-4 py-16">
      <div className="mx-auto max-w-2xl space-y-10">
        {/* Header */}
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink-900)]">
            Alt Text Generator
          </h1>
          <p className="text-sm text-[var(--color-ink-500)]">
            Accessibility-first descriptions for screen reader users — no keyword stuffing, no
            filler.
          </p>
        </header>

        {/* Section 1 — Upload */}
        <Section number={1} title="Upload images">
          <UploadZone images={images} onChange={setImages} />
        </Section>

        {/* Section 2 — Context */}
        <Section number={2} title="Context (optional)">
          <ContextForm value={context} onChange={setContext} />
        </Section>

        {/* Section 3 — Output controls */}
        <Section number={3} title="Output controls">
          <OutputControls value={controls} onChange={setControls} />
        </Section>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <button
            onClick={handleGenerate}
            disabled={images.length === 0 || isGenerating}
            className="
              px-8 py-3 rounded-xl text-sm font-medium
              bg-[var(--color-accent)] text-white
              hover:bg-[var(--color-accent-hover)]
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors duration-150 cursor-pointer
            "
          >
            {isGenerating ? (
              <span className="loading-dots">Generating</span>
            ) : (
              'Generate alt text →'
            )}
          </button>
          {images.length > 0 && !isGenerating && (
            <p className="text-xs text-[var(--color-ink-300)]">
              {images.length} {images.length === 1 ? 'image' : 'images'} ready · ~{estimatedSeconds}s estimated
            </p>
          )}
          {images.length === 0 && (
            <p className="text-xs text-[var(--color-ink-300)]">
              Upload at least one image to begin.
            </p>
          )}
        </div>

        {/* Section 4 — Results (appears only after Generate is clicked) */}
        {hasResults && (
          <div ref={resultsRef} className="space-y-6 pt-4">
            {/* Global progress bar */}
            {isGenerating && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-status-processing)] animate-pulse flex-shrink-0" />
                  <p className="text-sm text-[var(--color-ink-700)]">
                    Processing image {totalProcessed + 1} of {results.length}…
                  </p>
                </div>
                <div className="h-0.5 w-full rounded-full bg-[var(--color-border)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--color-status-processing)] transition-all duration-500"
                    style={{ width: `${(totalProcessed / results.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {!isGenerating && (
              <p className="text-sm font-medium text-[var(--color-ink-700)]">
                {results.length} {results.length === 1 ? 'image' : 'images'} processed
              </p>
            )}

            {/* Result cards */}
            <div className="space-y-4">
              {results.map((result, i) => (
                <ResultCard
                  key={result.id}
                  result={result}
                  index={i}
                  onRegenerate={handleRegenerate}
                  onReplaceImage={handleReplaceImage}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
