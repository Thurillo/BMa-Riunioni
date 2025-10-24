import { GoogleGenAI } from "@google/genai";
import { AIConfig, AIProvider, OllamaConfig } from '../types';

// Helper function to convert a Blob to a base64 encoded string.
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        // The result includes the data URL prefix (e.g., "data:audio/webm;base64,"),
        // which we need to remove to get just the base64 part.
        const base64String = reader.result.split(",")[1];
        resolve(base64String);
      } else {
        reject(new Error("Failed to convert blob to base64 string."));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const testOllamaConnection = async (serverUrl: string): Promise<boolean> => {
    if (!serverUrl) return false;
    try {
        // Use a more specific endpoint like /api/tags to check for a valid Ollama response
        const response = await fetch(new URL('/api/tags', serverUrl));
        return response.ok;
    } catch (error) {
        console.error("Ollama connection test failed:", error);
        return false;
    }
};

/**
 * Transcribes the given audio blob using the configured AI provider.
 * @param audioBlob The audio recording as a Blob.
 * @param config The AI provider configuration.
 * @returns A promise that resolves to the transcript text.
 */
export const transcribeAudio = async (
  audioBlob: Blob,
  config: AIConfig
): Promise<string> => {
  if (config.provider === AIProvider.OLLAMA) {
    const ollamaConfig = config as OllamaConfig;
    if (!ollamaConfig.serverUrl || !ollamaConfig.model) {
      throw new Error("URL del server e nome del modello di Ollama devono essere configurati.");
    }

    // Critical check: Transcription with this method requires a multimodal model.
    if (ollamaConfig.model !== 'llava') {
        throw new Error(`Per la trascrizione audio con Ollama, è necessario utilizzare un modello multimodale come 'llava'. Il modello selezionato '${ollamaConfig.model}' non è supportato per questa operazione.`);
    }

    const audioData = await blobToBase64(audioBlob);
    try {
      const response = await fetch(new URL('/api/generate', ollamaConfig.serverUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ollamaConfig.model,
          prompt: "Questo è un file audio di una riunione. Per favore, trascrivilo. Identifica i diversi oratori e etichettali come 'Oratore 1', 'Oratore 2', ecc. Aggiungi un timestamp nel formato [MM:SS] all'inizio di ogni frase o cambio di oratore. Fornisci solo la trascrizione completa.",
          images: [audioData],
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Errore del server Ollama: ${response.status} ${errorBody}`);
      }

      const result = await response.json();
      if (!result.response) {
        throw new Error("La risposta di Ollama non contiene un campo 'response'.");
      }
      return result.response.trim();
    } catch (error) {
      console.error("Errore durante la trascrizione con Ollama:", error);
      if (error instanceof TypeError) {
         throw new Error("Trascrizione con Ollama non riuscita. Controlla la configurazione del server Ollama (CORS/Host) e la connessione di rete.");
      }
      throw new Error(`Trascrizione con Ollama non riuscita. ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    }
  }

  // Gemini logic
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("La variabile d'ambiente API_KEY non è impostata.");
  }
  const ai = new GoogleGenAI({ apiKey });
  const audioData = await blobToBase64(audioBlob);
  const audioPart = {
    inlineData: {
      mimeType: audioBlob.type,
      data: audioData,
    },
  };
  const textPart = {
    text: "Trascrivi questo audio di una riunione. Identifica i diversi oratori e etichettali come 'Oratore 1', 'Oratore 2', ecc. in modo sequenziale. Aggiungi un timestamp nel formato [MM:SS] all'inizio di ogni frase o cambio di oratore. Fornisci solo la trascrizione completa.",
  };
  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: { parts: [audioPart, textPart] },
  });
  return response.text;
};

/**
 * Summarizes the given transcript using the configured AI provider.
 * @param transcript The meeting transcript.
 * @param participants A string listing the meeting participants.
 * @param config The AI provider configuration.
 * @returns A promise that resolves to the summary text.
 */
export const summarizeTranscript = async (
  transcript: string,
  participants: string,
  config: AIConfig
): Promise<string> => {
  const prompt = `
Sei un assistente AI specializzato nel riepilogare le trascrizioni delle riunioni in italiano.

**Trascrizione della Riunione:**
---
${transcript}
---

**Partecipanti noti:** ${participants || "Non specificato"}

**Istruzioni:**
Crea un riepilogo conciso ma completo della riunione. Struttura il riepilogo usando la formattazione Markdown come segue:

**Punti Chiave:**
- Elenca qui i principali argomenti discussi.

**Decisioni Prese:**
- Elenca qui tutte le decisioni finali raggiunte.

**Azioni da Intraprendere:**
- Elenca qui le azioni assegnate, specificando chi è responsabile (usando i nomi forniti se disponibili, altrimenti le etichette come 'Oratore 1') e, se menzionate, le scadenze.

Sii oggettivo e basati esclusivamente sulle informazioni presenti nella trascrizione.
`;

  if (config.provider === AIProvider.OLLAMA) {
    const ollamaConfig = config as OllamaConfig;
    if (!ollamaConfig.serverUrl || !ollamaConfig.model) {
      throw new Error("URL del server e nome del modello di Ollama devono essere configurati.");
    }
    try {
      const response = await fetch(new URL('/api/generate', ollamaConfig.serverUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ollamaConfig.model,
          prompt: prompt,
          stream: false,
        }),
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Errore del server Ollama: ${response.status} ${errorBody}`);
      }
      const result = await response.json();
      if (!result.response) {
        throw new Error("La risposta di Ollama non contiene un campo 'response'.");
      }
      return result.response.trim();
    } catch(error) {
      console.error("Errore durante il riepilogo con Ollama:", error);
      if (error instanceof TypeError) {
         throw new Error("Riepilogo con Ollama non riuscito. Controlla la configurazione del server Ollama (CORS/Host) e la connessione di rete.");
      }
      throw new Error(`Riepilogo con Ollama non riuscito. ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    }
  }

  // Gemini logic
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("La variabile d'ambiente API_KEY non è impostata.");
  }
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  return response.text;
};