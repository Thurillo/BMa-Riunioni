import { GoogleGenAI } from "@google/genai";
import { AIConfig, AIProvider } from "../types";

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64Data = reader.result.split(',')[1];
        resolve(base64Data);
      } else {
        reject(new Error("Failed to read blob as string"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};


export const transcribeAudio = async (audioBlob: Blob, aiConfig: AIConfig): Promise<string> => {
    if (aiConfig.provider !== AIProvider.GEMINI) {
        throw new Error('Solo Gemini è supportato in questa versione.');
    }
    
    // FIX: Initialize GoogleGenAI with apiKey from process.env.API_KEY as per guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const audioBase64 = await blobToBase64(audioBlob);
    
    const audioPart = {
        inlineData: {
            mimeType: audioBlob.type,
            data: audioBase64,
        },
    };
    
    const textPart = {
        text: `Sei un assistente AI specializzato nella trascrizione di riunioni audio.
Trascrivi l'audio fornito in modo accurato.
Identifica i diversi oratori e etichettali come "Oratore 1", "Oratore 2", e così via.
Formatta la trascrizione in modo chiaro e leggibile, con ogni intervento di un oratore su una nuova riga.
Esempio:
Oratore 1: Ciao a tutti.
Oratore 2: Ciao, benvenuto.
Trascrivi l'audio seguente:`,
    };

    // FIX: Use ai.models.generateContent to make API call for multimodal input.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: [{ parts: [textPart, audioPart] }],
    });
    
    // FIX: Extract text from response using response.text as per guidelines.
    return response.text;
};

export const summarizeTranscript = async (transcript: string, participants: string, aiConfig: AIConfig): Promise<string> => {
    if (aiConfig.provider !== AIProvider.GEMINI) {
        throw new Error('Solo Gemini è supportato in questa versione.');
    }
    
    // FIX: Initialize GoogleGenAI with apiKey from process.env.API_KEY as per guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let prompt = `Sei un assistente AI specializzato nel riassumere trascrizioni di riunioni.
Il tuo compito è creare un riepilogo conciso, chiaro e ben strutturato della trascrizione fornita.

Il riepilogo deve includere:
- **Argomenti Principali**: Elenca i punti chiave discussi durante la riunione.
- **Decisioni Prese**: Evidenzia tutte le decisioni finali che sono state prese.
- **Azioni da Intraprendere (Action Items)**: Elenca i compiti assegnati, specificando chi è responsabile (se menzionato) e le scadenze (se menzionate).

Formatta l'output in Markdown. Usa titoli in grassetto (es. **Argomenti Principali**) e liste puntate per la chiarezza.

Questa è la trascrizione della riunione:
---
${transcript}
---
`;

    if (participants) {
        prompt += `\nI partecipanti alla riunione erano: ${participants}. Tieni conto di questo nel riepilogo se rilevante.`;
    }

    // FIX: Use ai.models.generateContent to make API call for text generation.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    // FIX: Extract text from response using response.text as per guidelines.
    return response.text;
};
