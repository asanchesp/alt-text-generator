import { NextRequest, NextResponse } from 'next/server';
import { generateAltText } from '@/lib/aiClient';
import type { Controls, Context } from '@/lib/types';

interface ErrorBody {
  error: string;
  code: 'input_error' | 'service_error' | 'config_error';
}

function errorResponse(message: string, code: ErrorBody['code'], status: number) {
  return NextResponse.json<ErrorBody>({ error: message, code }, { status });
}

function classifyError(message: string): { title: string; code: ErrorBody['code']; status: number } {
  if (message.includes('AI returned invalid JSON')) {
    return { title: message, code: 'service_error', status: 502 };
  }
  if (message.includes('API key') || message.includes('API_KEY') || message.includes('PERMISSION_DENIED') || message.includes('authentication')) {
    return { title: 'Invalid or missing AI provider API key.', code: 'config_error', status: 500 };
  }
  if (message.includes('quota') || message.includes('rate') || message.includes('429') || message.includes('RESOURCE_EXHAUSTED') || message.includes('overloaded')) {
    return { title: 'AI provider rate limit reached — wait a moment and try again.', code: 'service_error', status: 429 };
  }
  if (message.includes('not found') || message.includes('404') || message.includes('MODEL_NOT_FOUND')) {
    return { title: 'AI model not available — try again.', code: 'service_error', status: 502 };
  }
  return { title: message, code: 'service_error', status: 500 };
}

/** Simple retry with exponential backoff for transient errors (rate limits, 5xx). */
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : '';
      const isRetryable =
        msg.includes('quota') ||
        msg.includes('rate') ||
        msg.includes('429') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('500') ||
        msg.includes('503');

      if (!isRetryable || attempt === maxAttempts) break;

      // Backoff: 1s, 2s
      await new Promise((r) => setTimeout(r, attempt * 1000));
    }
  }
  throw lastError;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const image = form.get('image') as File | null;
    const controlsRaw = form.get('controls') as string | null;
    const contextRaw = form.get('context') as string | null;

    if (!image || !controlsRaw || !contextRaw) {
      return errorResponse('Missing required fields: image, controls, context.', 'input_error', 400);
    }

    if (!process.env.GEMINI_API_KEY && !process.env.ANTHROPIC_API_KEY && !process.env.GROQ_API_KEY) {
      return errorResponse(
        'API key not configured — set GEMINI_API_KEY, ANTHROPIC_API_KEY, or GROQ_API_KEY in your environment variables.',
        'config_error',
        500,
      );
    }

    let controls: Controls;
    let context: Context;
    try {
      controls = JSON.parse(controlsRaw);
      context = JSON.parse(contextRaw);
    } catch {
      return errorResponse('Invalid controls or context JSON.', 'input_error', 400);
    }

    const arrayBuffer = await image.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = image.type;

    const result = await withRetry(() => generateAltText(base64, mimeType, controls, context));
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected server error.';
    console.error('[/api/generate]', message);
    const { title, code, status } = classifyError(message);
    return errorResponse(title, code, status);
  }
}
