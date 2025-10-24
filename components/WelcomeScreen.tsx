import React, { useRef, useState } from 'react';
import { Mic, Upload, Loader, CheckCircle, XCircle } from 'lucide-react';
import { AIConfig, AIProvider } from '../types';
import { testOllamaConnection } from '../services/geminiService';

interface WelcomeScreenProps {
  onStartRecording: () => void;
  onFileUpload: (file: File) => void;
  aiConfig: AIConfig;
  onAiConfigChange: (config: AIConfig) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartRecording,
  onFileUpload,
  aiConfig,
  onAiConfigChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleProviderChange = (provider: AIProvider) => {
    if (provider === AIProvider.OLLAMA) {
      onAiConfigChange({
        provider: AIProvider.OLLAMA,
        serverUrl: 'http://localhost:11434',
        model: 'llava',
      });
    } else {
      onAiConfigChange({ provider: AIProvider.GEMINI });
    }
    setTestStatus('idle');
  };

  const handleOllamaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (aiConfig.provider === AIProvider.OLLAMA) {
      onAiConfigChange({
        ...aiConfig,
        [e.target.name]: e.target.value,
      });
      if (testStatus !== 'idle') {
        setTestStatus('idle');
      }
    }
  };

  const handleTestConnection = async () => {
    if (aiConfig.provider === AIProvider.OLLAMA) {
      setTestStatus('testing');
      const success = await testOllamaConnection(aiConfig.serverUrl);
      setTestStatus(success ? 'success' : 'error');
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-8">
      <div className="text-center max-w-2xl">
        <h3 className="text-2xl font-semibold text-text-primary mb-2">
          Pronto a Iniziare?
        </h3>
        <p className="text-text-secondary">
          Scegli un'opzione per iniziare. Puoi registrare l'audio dal vivo o caricare un file audio esistente. L'IA analizzerà l'audio per fornirti una trascrizione completa e un riepilogo intelligente.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button
          onClick={onStartRecording}
          className="flex-1 flex flex-col items-center justify-center gap-4 bg-brand-primary hover:bg-brand-dark text-white font-bold p-8 rounded-xl transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-brand-primary/50 shadow-lg"
          aria-label="Inizia a registrare"
        >
          <Mic size={48} />
          <span className="text-xl">Registra Audio</span>
        </button>

        <button
          onClick={handleUploadClick}
          className="flex-1 flex flex-col items-center justify-center gap-4 bg-bg-tertiary hover:bg-slate-300 text-text-primary font-bold p-8 rounded-xl transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-slate-400/50 shadow-lg"
          aria-label="Carica un file audio"
        >
          <Upload size={48} />
          <span className="text-xl">Carica File</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="audio/*"
          className="hidden"
          aria-hidden="true"
        />
      </div>

      <div className="w-full max-w-2xl mt-8 pt-6 border-t border-bg-tertiary">
        <h3 className="text-xl font-semibold text-text-primary text-center mb-4">
          Impostazioni Provider AI
        </h3>
        <div className="flex justify-center gap-4 mb-6">
          <button onClick={() => handleProviderChange(AIProvider.GEMINI)} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${aiConfig.provider === AIProvider.GEMINI ? 'bg-brand-primary text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-slate-300'}`}>
            Google Gemini
          </button>
          <button onClick={() => handleProviderChange(AIProvider.OLLAMA)} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${aiConfig.provider === AIProvider.OLLAMA ? 'bg-brand-primary text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-slate-300'}`}>
            Ollama (LLM Locale)
          </button>
        </div>

        {aiConfig.provider === AIProvider.OLLAMA && (
            <div className="bg-brand-light/50 p-4 rounded-lg space-y-4 max-w-lg mx-auto">
              <div>
                <label htmlFor="serverUrl" className="block text-sm font-medium text-text-primary mb-1">URL del Server</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="serverUrl"
                    name="serverUrl"
                    value={aiConfig.serverUrl}
                    onChange={handleOllamaChange}
                    className="flex-grow bg-bg-secondary border border-bg-tertiary rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                  <button onClick={handleTestConnection} className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white font-semibold rounded-lg flex items-center justify-center w-32" disabled={testStatus === 'testing'}>
                    {testStatus === 'testing' && <Loader size={18} className="animate-spin" />}
                    {testStatus === 'idle' && 'Test'}
                    {testStatus === 'success' && <CheckCircle size={18} />}
                    {testStatus === 'error' && <XCircle size={18} />}
                  </button>
                </div>
                {testStatus === 'success' && <p className="text-sm text-green-600 mt-1">Connessione riuscita!</p>}
                {testStatus === 'error' && <p className="text-sm text-red-600 mt-1">Connessione fallita.</p>}
              </div>
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-text-primary mb-1">Nome Modello</label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={aiConfig.model}
                  onChange={handleOllamaChange}
                  placeholder="es. llava"
                  className="w-full bg-bg-secondary border border-bg-tertiary rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
                 <p className="text-xs text-text-secondary mt-1">Per la trascrizione, assicurati di usare un modello multimodale (es. LLaVA).</p>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default WelcomeScreen;