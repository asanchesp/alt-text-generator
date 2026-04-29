'use client';

import { useState } from 'react';
import type { ImageResult } from '@/lib/types';

interface Props {
  result: ImageResult;
  index: number;
  onRegenerate?: (id: string) => void;
  onReplaceImage?: (id: string) => void;
}

async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to execCommand fallback
    }
  }
  const el = document.createElement('textarea');
  el.value = text;
  el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(el);
  el.focus();
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? 'Copied!' : label}
      className="text-xs text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)] transition-colors duration-150 px-2 py-1 rounded hover:bg-[var(--color-ink-100)] cursor-pointer"
    >
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  );
}

function StatusDot({ status }: { status: ImageResult['status'] }) {
  const classes: Record<string, string> = {
    done: 'bg-[var(--color-status-done)]',
    processing: 'bg-[var(--color-status-processing)] animate-pulse',
    queued: 'bg-[var(--color-status-queued)]',
    error: 'bg-[var(--color-status-error)]',
  };
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300 ${classes[status]}`}
    />
  );
}

function SkeletonLine({ width }: { width: string }) {
  return (
    <div className="h-3 rounded bg-[var(--color-ink-100)] animate-pulse" style={{ width }} />
  );
}

export function ResultCard({ result, index, onRegenerate, onReplaceImage }: Props) {
  const isError = result.status === 'error';
  const isDone = result.status === 'done';
  const isProcessing = result.status === 'processing';
  const isQueued = result.status === 'queued';

  const allVariationsText = result.result?.variations.map((v) => v.text).join('\n\n') ?? '';

  if (isError && result.error) {
    return (
      <article className="card-enter rounded-xl border border-[var(--color-status-error-border)] bg-[var(--color-status-error-bg)] overflow-hidden">
        <div className="px-5 py-4 flex items-start gap-3">
          {/* High-contrast error icon — only intentionally saturated element */}
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-status-error)] text-white flex items-center justify-center text-xs font-bold mt-0.5 select-none">
            !
          </span>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[var(--color-ink-500)] mb-1 truncate">
              {index + 1}. {result.filename}
            </p>
            <p className="text-sm font-semibold text-[var(--color-status-error)] mb-1">
              {result.error.title}
            </p>
            <p className="text-sm text-[var(--color-ink-700)] leading-snug">{result.error.detail}</p>
          </div>

          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            {result.error.recoverable ? (
              <button
                className="text-sm font-medium text-[var(--color-status-error)] hover:underline cursor-pointer"
                onClick={() => onRegenerate?.(result.id)}
              >
                Try again
              </button>
            ) : (
              <button
                className="text-sm font-medium text-[var(--color-status-error)] hover:underline cursor-pointer"
                onClick={() => onReplaceImage?.(result.id)}
              >
                Replace image
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`card-enter rounded-xl border bg-[var(--color-card)] overflow-hidden transition-opacity duration-300 ${
        isQueued ? 'opacity-40 border-[var(--color-border)]' : 'opacity-100 border-[var(--color-border)]'
      }`}
    >
      {/* Card header */}
      <div className="px-5 py-3.5 flex items-center gap-3 border-b border-[var(--color-border)]">
        <StatusDot status={result.status} />
        <span className="flex-1 text-sm font-medium text-[var(--color-ink-700)] truncate">
          {index + 1}. {result.filename}
        </span>

        {isQueued && (
          <span className="text-xs text-[var(--color-ink-300)]">Waiting…</span>
        )}
        {isProcessing && (
          <span className="text-xs text-[var(--color-status-processing)] animate-pulse">
            Processing…
          </span>
        )}
        {isDone && (
          <div className="flex items-center gap-1">
            <CopyButton text={allVariationsText} label="Copy all variations" />
            <span className="text-[var(--color-ink-300)] text-xs select-none">·</span>
            <button
              onClick={() => onRegenerate?.(result.id)}
              className="text-xs text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)] transition-colors duration-150 px-2 py-1 rounded hover:bg-[var(--color-ink-100)] cursor-pointer"
            >
              Regenerate
            </button>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="px-5 py-4 space-y-3">
        {(isQueued || isProcessing) && (
          <div className="space-y-3 py-1">
            <SkeletonLine width="90%" />
            <SkeletonLine width="76%" />
            <SkeletonLine width="83%" />
          </div>
        )}

        {isDone && result.result && (
          <div className="space-y-3">
            {result.result.warnings.length > 0 && (
              <div className="text-xs text-[var(--color-ink-500)] bg-[var(--color-ink-100)] rounded-lg px-3 py-2 leading-relaxed">
                ⚠ {result.result.warnings.join(' · ')}
              </div>
            )}

            {result.result.variations.map((v, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface)] group"
              >
                <span className="flex-shrink-0 w-4 text-right text-xs text-[var(--color-ink-300)] mt-0.5 select-none">
                  {i + 1}
                </span>
                <p className="flex-1 text-sm leading-relaxed font-serif text-[var(--color-ink-700)]">
                  {v.text}
                </p>
                <div className="flex-shrink-0 flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity duration-150">
                  <span className="text-xs text-[var(--color-ink-300)] tabular-nums">
                    {v.characters} ch.
                  </span>
                  <CopyButton text={v.text} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
