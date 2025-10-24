import React, { useRef } from 'react';
import { AIConfig } from '../types';
import { Mic, Upload, BrainCircuit } from 'lucide-react';

interface WelcomeScreenProps {
  onStartRecording: () => void;
  onFileUpload: (file: File) => void;
  aiConfig: AIConfig;
  onAiConfigChange: (config: AIConfig) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartRecording,
  onFileUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center text-center gap-10 py-8">
      <div className="max-w-3xl">
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
          Come vuoi iniziare?
        </h2>
        <p className="text-base md:text-lg text-muted">
          Puoi avviare una nuova registrazione per catturare l'audio dal vivo, oppure caricare un file audio esistente per analizzarlo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* Start Recording Card */}
        <div 
            className="bg-card border-2 border-border hover:border-primary p-8 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-card"
            onClick={onStartRecording}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && onStartRecording()}
        >
          <div className="bg-primary/10 p-5 rounded-full mb-5">
            <Mic className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Registra Audio</h3>
          <p className="text-muted">
            Cattura l'audio della riunione direttamente dal tuo microfono.
          </p>
        </div>

        {/* Upload File Card */}
        <div 
            className="bg-card border-2 border-border hover:border-primary p-8 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-card"
            onClick={handleUploadClick}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && handleUploadClick()}
        >
          <div className="bg-primary/10 p-5 rounded-full mb-5">
            <Upload className="h-10 w-10 text-primary" />
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="audio/*"
          />
          <h3 className="text-xl font-bold text-foreground mb-2">Carica File</h3>
          <p className="text-muted">
            Analizza una registrazione audio esistente dal tuo dispositivo.
          </p>
        </div>
      </div>
      
      {/* AI Settings - Kept simple as only Gemini is supported */}
      <div className="mt-8 w-full max-w-md">
        <div className="bg-background border border-border rounded-xl p-4 flex items-center justify-center gap-3">
          <BrainCircuit size={20} className="text-primary"/>
          <p className="text-sm font-semibold text-muted">
              Powered by <span className="text-foreground">Google Gemini</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
