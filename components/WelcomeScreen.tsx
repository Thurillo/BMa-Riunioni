import React, { useRef, useState } from 'react';
import { Mic, Upload, Loader, CheckCircle, XCircle, Settings, BrainCircuit } from 'lucide-react';
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
    <div className="flex flex-col items-center justify-center gap-10 py-8">
      <div className="text-center max-w-2xl">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Come vuoi iniziare?
        </h2>
        <p className="text-muted text-lg">
          Registra un nuovo audio o carica un file esistente. L'IA si occuperà del resto.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-2xl">
        <button
          onClick={onStartRecording}
          className="flex items-center justify-center gap-3 w-full sm:w-auto bg-primary text-primary-foreground font-semibold px-8 py-4 rounded-lg transition-colors duration-200 hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary/30"
          aria-label="Inizia a registrare"
        >
          <Mic size={22} />
          <span className="text-lg">Registra Audio</span>
        </button>

        <button
          onClick={handleUploadClick}
          className="flex items-center justify-center gap-3 w-full sm:w-auto bg-transparent text-primary font-semibold px-8 py-4 rounded-lg transition-colors duration-200 border-2 border-primary hover:bg-primary hover:text-primary-foreground focus:outline-none focus:ring-4 focus:ring-primary/30"
          aria-label="Carica un file audio"
        >
          <Upload size={22} />
          <span className="text-lg">Carica File</span>
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

      <div className="w-full max-w-2xl mt-8 pt-8 border-t border-border">
        <h3 className="text-lg font-semibold text-foreground text-center mb-4 flex items-center justify-center gap-2">
          <BrainCircuit size={20} />
          Provider Intelligenza Artificiale
        </h3>
        <div className="flex justify-center p-1 bg-slate-100 rounded-xl max-w-sm mx-auto">
          <button onClick={() => handleProviderChange(AIProvider.GEMINI)} className={`w-full text-center px-4 py-2 rounded-lg font-semibold transition-all ${aiConfig.provider === AIProvider.GEMINI ? 'bg-background shadow-sm text-primary' : 'text-muted hover:text-foreground'}`}>
            Google Gemini
          </button>
          <button onClick={() => handleProviderChange(AIProvider.OLLAMA)} className={`w-full text-center px-4 py-2 rounded-lg font-semibold transition-all ${aiConfig.provider === AIProvider.OLLAMA ? 'bg-background shadow-sm text-primary' : 'text-muted hover:text-foreground'}`}>
            Ollama (Locale)
          </button>
        </div>

        {aiConfig.provider === AIProvider.OLLAMA && (
            <div className="bg-accent/50 p-6 rounded-2xl space-y-4 max-w-lg mx-auto mt-6 border border-border">
              <h4 className="font-semibold text-foreground flex items-center gap-2"><Settings size={16} /> Impostazioni Ollama</h4>
              <div>
                <label htmlFor="serverUrl" className="block text-sm font-medium text-foreground mb-1">URL del Server</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    id="serverUrl"
                    name="serverUrl"
                    value={aiConfig.serverUrl}
                    onChange={handleOllamaChange}
                    className="flex-grow bg-background border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button onClick={handleTestConnection} className="px-3 py-2 bg-muted/20 hover:bg-muted/30 text-muted font-semibold rounded-lg flex items-center justify-center w-28 shrink-0" disabled={testStatus === 'testing'}>
                    {testStatus === 'testing' && <Loader size={18} className="animate-spin" />}
                    {testStatus === 'idle' && 'Test'}
                    {testStatus === 'success' && <CheckCircle size={18} className="text-green-500"/>}
                    {testStatus === 'error' && <XCircle size={18} className="text-destructive"/>}
                  </button>
                </div>
                 {testStatus === 'success' && <p className="text-sm text-green-600 mt-1">Connessione riuscita!</p>}
                {testStatus === 'error' && <p className="text-sm text-destructive mt-1">Connessione fallita. Controlla l'URL.</p>}
              </div>
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-foreground mb-1">Nome Modello</label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={aiConfig.model}
                  onChange={handleOllamaChange}
                  placeholder="es. llava"
                  className="w-full bg-background border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                 <p className="text-xs text-muted mt-1">Per la trascrizione, assicurati di usare un modello multimodale (es. LLaVA).</p>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default WelcomeScreen;