import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import type { AIResponse, Controls, Context } from './types';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts';

const GEMINI_MODEL = 'gemini-2.0-flash';
const ANTHROPIC_MODEL = 'claude-haiku-4-5';
const GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

type AnthropicMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
type Provider = 'gemini' | 'anthropic' | 'groq';

function getProvider(): Provider {
  const configured = process.env.AI_PROVIDER?.toLowerCase();
  if (configured === 'anthropic' || configured === 'gemini' || configured === 'groq') return configured;
  if (process.env.GROQ_API_KEY) return 'groq';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  return 'gemini';
}

/** Recalculates character counts on the server side to correct any AI miscounts. */
export function recalculateCharacters(response: AIResponse): AIResponse {
  return {
    ...response,
    variations: response.variations.map((v) => ({
      ...v,
      characters: v.text.length,
    })),
  };
}

function parseAIResponse(rawText: string): AIResponse {
  let parsed: AIResponse;
  try {
    // Strip markdown fences if the model wraps the JSON anyway
    const cleaned = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    parsed = JSON.parse(cleaned) as AIResponse;
  } catch {
    throw new Error('AI returned invalid JSON — please try again.');
  }

  if (!Array.isArray(parsed.variations)) {
    throw new Error('AI response is missing the variations array.');
  }

  return recalculateCharacters(parsed);
}

async function generateWithGemini(
  imageBase64: string,
  mimeType: string,
  controls: Controls,
  context: Context,
): Promise<AIResponse> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY environment variable is not set.');
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: SYSTEM_PROMPT,
  });

  const userPrompt = buildUserPrompt(controls, context);

  const result = await model.generateContent([
    userPrompt,
    {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    },
  ]);

  return parseAIResponse(result.response.text());
}

async function generateWithAnthropic(
  imageBase64: string,
  mimeType: string,
  controls: Controls,
  context: Context,
): Promise<AIResponse> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set.');
  }

  const anthropic = new Anthropic({ apiKey: key });
  const userPrompt = buildUserPrompt(controls, context);

  const message = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType as AnthropicMediaType,
              data: imageBase64,
            },
          },
          { type: 'text', text: userPrompt },
        ],
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('AI returned invalid JSON — please try again.');
  }

  return parseAIResponse(textBlock.text);
}

async function generateWithGroq(
  imageBase64: string,
  mimeType: string,
  controls: Controls,
  context: Context,
): Promise<AIResponse> {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error('GROQ_API_KEY environment variable is not set.');
  }

  const userPrompt = buildUserPrompt(controls, context);

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Groq API error (${response.status}): ${body}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== 'string') {
    throw new Error('AI returned invalid JSON — please try again.');
  }

  return parseAIResponse(text);
}

export async function generateAltText(
  imageBase64: string,
  mimeType: string,
  controls: Controls,
  context: Context,
): Promise<AIResponse> {
  const provider = getProvider();
  if (provider === 'groq') return generateWithGroq(imageBase64, mimeType, controls, context);
  if (provider === 'anthropic') return generateWithAnthropic(imageBase64, mimeType, controls, context);
  return generateWithGemini(imageBase64, mimeType, controls, context);
}
