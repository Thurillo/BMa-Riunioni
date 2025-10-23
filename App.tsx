
import React, { useState, useCallback } from 'react';
import { AppState, AIConfig, AIProvider } from './types';
import WelcomeScreen from './components/WelcomeScreen';
import RecordingScreen from './components/RecordingScreen';
import ResultsScreen from './components/ResultsScreen';
import Spinner from './components/Spinner';
import { transcribeAudio, summarizeTranscript } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [detectedSpeakers, setDetectedSpeakers] = useState<string[]>([]);
  const [aiConfig, setAiConfig] = useState<AIConfig>({ provider: AIProvider.GEMINI });


  const handleStartRecording = () => {
    setAppState(AppState.RECORDING);
    setError(null);
  };

  const handleRecordingComplete = useCallback(async (blob: Blob) => {
    setAudioBlob(blob);
    setAppState(AppState.PROCESSING_TRANSCRIPTION);
    try {
      const transcriptText = await transcribeAudio(blob, aiConfig);
      setTranscript(transcriptText);

      // Detect speakers from the transcript
      const speakerRegex = /(Oratore\s*\d+):/gi;
      const matches = transcriptText.match(speakerRegex);
      if (matches) {
          const uniqueSpeakers = [...new Set(matches.map(s => s.slice(0, -1).trim()))];
          setDetectedSpeakers(uniqueSpeakers);
      } else {
          setDetectedSpeakers([]);
      }

      setAppState(AppState.RESULTS);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Trascrizione audio non riuscita. Riprova.';
      setError(errorMessage);
      setAppState(AppState.WELCOME);
    }
  }, [aiConfig]);

  const handleFileUpload = (file: File) => {
    const audioBlob = new Blob([file], { type: file.type });
    handleRecordingComplete(audioBlob);
  };
  
  const handleGenerateSummary = async (participants: string) => {
    setAppState(AppState.PROCESSING_SUMMARY);
    setError(null);
    try {
      const summaryText = await summarizeTranscript(transcript, participants, aiConfig);
      setSummary(summaryText);
      setAppState(AppState.RESULTS);
    } catch (err)
 {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Generazione del riepilogo non riuscita. Riprova.';
      setError(errorMessage);
      setAppState(AppState.RESULTS); // Go back to results to allow retry
    }
  };

  const handleUpdateSpeakerNames = (speakerNameMap: Record<string, string>) => {
    let newTranscript = transcript;
    Object.entries(speakerNameMap).forEach(([speakerLabel, name]) => {
        if(name.trim()){
            const regex = new RegExp(speakerLabel + ':', 'g');
            newTranscript = newTranscript.replace(regex, name.trim() + ':');
        }
    });
    setTranscript(newTranscript);
    setDetectedSpeakers([]); // Hide the speaker name form
  };

  const handleReset = () => {
    setAppState(AppState.WELCOME);
    setAudioBlob(null);
    setTranscript('');
    setSummary('');
    setError(null);
    setDetectedSpeakers([]);
  };

  const renderContent = () => {
    switch (appState) {
      case AppState.WELCOME:
        return (
          <WelcomeScreen 
            onStartRecording={handleStartRecording} 
            onFileUpload={handleFileUpload}
            aiConfig={aiConfig}
            onAiConfigChange={setAiConfig}
          />
        );
      case AppState.RECORDING:
        return <RecordingScreen onRecordingComplete={handleRecordingComplete} />;
      case AppState.PROCESSING_TRANSCRIPTION:
        return (
          <Spinner
            title="Trascrizione della Riunione"
            steps={[
              'Caricamento del file audio',
              'Analisi dei modelli vocali',
              'Generazione della trascrizione completa',
            ]}
          />
        );
      // Fix: Render ResultsScreen for both PROCESSING_SUMMARY and RESULTS states
      // This allows the summary generation to show a loading state on the results page
      // instead of switching to a full-screen spinner, and resolves the TypeScript error.
      case AppState.PROCESSING_SUMMARY:
      case AppState.RESULTS:
        return (
          <ResultsScreen
            transcript={transcript}
            summary={summary}
            audioBlob={audioBlob}
            onGenerateSummary={handleGenerateSummary}
            onReset={handleReset}
            isSummarizing={appState === AppState.PROCESSING_SUMMARY}
            detectedSpeakers={detectedSpeakers}
            onUpdateSpeakerNames={handleUpdateSpeakerNames}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
                <h1 className="text-6xl font-extrabold" aria-label="BMA">
                    <span className="text-brand-primary">B</span>
                    <span className="text-brand-primary">M</span>
                    <span className="text-brand-secondary">A</span>
                </h1>
            </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
            Riepilogo Riunioni AI
          </h2>
          <p className="mt-3 text-lg text-text-secondary">
            Registra, trascrivi e riepiloga le tue riunioni con la potenza dell'IA.
          </p>
        </header>
        <main className="bg-bg-secondary shadow-xl rounded-2xl p-6 sm:p-8 transition-all duration-300">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
              <strong className="font-bold">Errore: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {renderContent()}
        </main>
        <footer className="text-center mt-8 text-sm text-gray-500">
          <p>Realizzato per BMA Sansepolcro</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
