'use client';

import { useRef, useState, useCallback } from 'react';
import type { ImageResult } from '@/lib/types';

const MAX_FILES = 10;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const ACCEPTED_EXTENSIONS = '.png,.jpg,.jpeg,.webp';

interface Props {
  images: ImageResult[];
  onChange: (images: ImageResult[]) => void;
}

type BuildResult = ImageResult | { validationError: string };

function buildImageResult(file: File): BuildResult {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return { validationError: `"${file.name}" is not a supported format (PNG, JPG, WebP only).` };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { validationError: `"${file.name}" exceeds the 5 MB limit.` };
  }
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    filename: file.name,
    file,
    previewUrl: URL.createObjectURL(file),
    status: 'queued',
  };
}

export function UploadZone({ images, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      const errors: string[] = [];
      const next: ImageResult[] = [...images];

      for (const file of files) {
        if (next.length >= MAX_FILES) {
          errors.push(`Maximum of ${MAX_FILES} images reached — some files were skipped.`);
          break;
        }
        const result = buildImageResult(file);
        if ('validationError' in result) {
          errors.push(result.validationError);
        } else {
          next.push(result);
        }
      }

      setValidationErrors(errors);
      onChange(next);
    },
    [images, onChange],
  );

  const removeImage = (id: string) => {
    const removed = images.find((img) => img.id === id);
    if (removed) URL.revokeObjectURL(removed.previewUrl);
    onChange(images.filter((img) => img.id !== id));
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => setDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  };

  const atLimit = images.length >= MAX_FILES;

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      {!atLimit && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload images — drag and drop or click to browse"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          className={`
            relative rounded-xl border-2 border-dashed px-8 py-12 text-center cursor-pointer
            transition-colors duration-150
            ${
              dragging
                ? 'border-[var(--color-ink-700)] bg-[var(--color-ink-100)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-ink-300)] hover:bg-[var(--color-ink-100)]'
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            multiple
            className="sr-only"
            onChange={onInputChange}
            aria-hidden
          />
          <div className="space-y-2 pointer-events-none">
            <div className="text-2xl">↑</div>
            <p className="text-sm font-medium text-[var(--color-ink-700)]">
              Drag images here, or{' '}
              <span className="underline underline-offset-2">click to browse</span>
            </p>
            <p className="text-xs text-[var(--color-ink-300)]">
              PNG, JPG, WebP · max 5 MB each · up to {MAX_FILES} images
            </p>
          </div>
        </div>
      )}

      {atLimit && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-ink-100)] px-5 py-4 text-center text-sm text-[var(--color-ink-500)]">
          Maximum reached — remove an image to add another.
        </div>
      )}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <ul className="space-y-1">
          {validationErrors.map((err, i) => (
            <li key={i} className="text-xs text-[var(--color-status-error)]">
              {err}
            </li>
          ))}
        </ul>
      )}

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.previewUrl}
                alt={img.filename}
                className="w-20 h-20 object-cover rounded-lg border border-[var(--color-border)]"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(img.id);
                }}
                aria-label={`Remove ${img.filename}`}
                className="
                  absolute -top-1.5 -right-1.5
                  w-5 h-5 rounded-full
                  bg-[var(--color-ink-900)] text-white text-xs
                  flex items-center justify-center
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-150
                  cursor-pointer
                "
              >
                ×
              </button>
              <p className="mt-1 text-xs text-[var(--color-ink-300)] truncate w-20 text-center">
                {img.filename}
              </p>
            </div>
          ))}
          {!atLimit && (
            <button
              onClick={() => inputRef.current?.click()}
              aria-label="Add more images"
              className="
                w-20 h-20 rounded-lg border-2 border-dashed border-[var(--color-border)]
                flex items-center justify-center
                text-[var(--color-ink-300)] text-2xl
                hover:border-[var(--color-ink-300)] hover:text-[var(--color-ink-500)]
                transition-colors duration-150 cursor-pointer
              "
            >
              +
            </button>
          )}
        </div>
      )}
    </div>
  );
}
