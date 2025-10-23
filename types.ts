export enum AppState {
  WELCOME,
  RECORDING,
  PROCESSING_TRANSCRIPTION,
  PROCESSING_SUMMARY,
  RESULTS,
}

export enum AIProvider {
  GEMINI = 'gemini',
  OLLAMA = 'ollama',
}

export interface GeminiConfig {
  provider: AIProvider.GEMINI;
}

export interface OllamaConfig {
  provider: AIProvider.OLLAMA;
  serverUrl: string;
  model: string;
}

export type AIConfig = GeminiConfig | OllamaConfig;
