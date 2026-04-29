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

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const image = form.get('image') as File | null;
    const controlsRaw = form.get('controls') as string | null;
    const contextRaw = form.get('context') as string | null;

    if (!image || !controlsRaw || !contextRaw) {
      return errorResponse('Missing required fields: image, controls, context.', 'input_error', 400);
    }

    if (!process.env.GEMINI_API_KEY) {
      return errorResponse(
        'API key not configured — set GEMINI_API_KEY in your environment variables.',
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

    const result = await generateAltText(base64, mimeType, controls, context);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected server error.';
    console.error('[/api/generate]', message);

    // Surface specific Gemini error messages when possible
    if (message.includes('AI returned invalid JSON')) {
      return errorResponse(message, 'service_error', 502);
    }
    if (message.includes('API key') || message.includes('API_KEY')) {
      return errorResponse('Invalid or missing Gemini API key.', 'config_error', 500);
    }
    if (message.includes('quota') || message.includes('rate')) {
      return errorResponse(
        'Gemini rate limit reached — wait a moment and try again.',
        'service_error',
        429,
      );
    }
    return errorResponse(message, 'service_error', 500);
  }
}
