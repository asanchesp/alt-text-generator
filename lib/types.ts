export type DetailLevel = 'basic' | 'medium' | 'rich';
export type Tone = 'factual' | 'contextual';

export interface Controls {
  detailLevel: DetailLevel;
  maxCharacters: number;
  variationsCount: number;
  tone: Tone;
}

export interface Context {
  siteType: string;
  audience: string;
  purpose: string;
  namedEntities: string;
}

export interface Variation {
  text: string;
  characters: number;
}

export interface AIResponse {
  variations: Variation[];
  warnings: string[];
}

export type ImageStatus = 'queued' | 'processing' | 'done' | 'error';

export interface ImageResult {
  id: string;
  filename: string;
  file: File;
  previewUrl: string;
  status: ImageStatus;
  result?: AIResponse;
  error?: { title: string; detail: string; recoverable: boolean };
}
