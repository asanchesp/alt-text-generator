import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIResponse, Controls, Context } from './types';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts';

const GEMINI_MODEL = 'gemini-1.5-flash';

function getClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY environment variable is not set.');
  }
  return new GoogleGenerativeAI(key);
}

/** Recalculates character counts on the frontend side to correct any AI miscounts. */
export function recalculateCharacters(response: AIResponse): AIResponse {
  return {
    ...response,
    variations: response.variations.map((v) => ({
      ...v,
      characters: v.text.length,
    })),
  };
}

export async function generateAltText(
  imageBase64: string,
  mimeType: string,
  controls: Controls,
  context: Context,
): Promise<AIResponse> {
  const genAI = getClient();

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

  const rawText = result.response.text().trim();

  let parsed: AIResponse;
  try {
    // Strip markdown fences if the model wraps the JSON anyway
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    parsed = JSON.parse(cleaned) as AIResponse;
  } catch {
    throw new Error('AI returned invalid JSON — please try again.');
  }

  if (!Array.isArray(parsed.variations)) {
    throw new Error('AI response is missing the variations array.');
  }

  // Recalculate character counts to correct any model miscounts
  return recalculateCharacters(parsed);
}
