import React, { useState, useEffect } from 'react';
import { Clipboard, RefreshCw, Sparkles, FileDown, Check, Search, Download } from 'lucide-react';

interface ResultsScreenProps {
  transcript: string;
  summary: string;
  audioBlob: Blob | null;
  onGenerateSummary: (participants: string) => void;
  onReset: () => void;
  isSummarizing: boolean;
  detectedSpeakers: string[];
  onUpdateSpeakerNames: (speakerNameMap: Record<string, string>) => void;
}

const HighlightedText: React.FC<{text: string; highlight: string}> = ({ text, highlight }) => {
    if (!highlight.trim()) {
        return <>{text}</>;
    }
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedHighlight})`, 'gi');
    const parts = text.split(regex);
    
    return (
        <>
            {parts.map((part, i) =>
                i % 2 === 1 ? (
                    <mark key={i} className="bg-brand-light text-brand-dark rounded px-0.5">{part}</mark>
                ) : (
                    part
                )
            )}
        </>
    );
};


const ResultsScreen: React.FC<ResultsScreenProps> = ({
  transcript,
  summary,
  audioBlob,
  onGenerateSummary,
  onReset,
  isSummarizing,
  detectedSpeakers,
  onUpdateSpeakerNames,
}) => {
  const [participants, setParticipants] = useState('');
  const [copied, setCopied] = useState<'transcript' | 'summary' | null>(null);
  const [speakerNames, setSpeakerNames] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (detectedSpeakers.length > 0) {
      const initialNames = detectedSpeakers.reduce((acc, speaker) => {
        acc[speaker] = '';
        return acc;
      }, {} as Record<string, string>);
      setSpeakerNames(initialNames);
    }
  }, [detectedSpeakers]);

  const handleCopy = (text: string, type: 'transcript' | 'summary') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSpeakerNameChange = (speaker: string, name: string) => {
    setSpeakerNames(prev => ({ ...prev, [speaker]: name }));
  };

  const handleApplyNames = () => {
    onUpdateSpeakerNames(speakerNames);
    const participantList = Object.values(speakerNames).filter(name => typeof name === 'string' && name.trim()).join(', ');
    setParticipants(participantList);
  };

  const handleDownloadAudio = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'registrazione-riunione.webm';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  const handleExportTranscript = () => {
    const printableContent = `
      <!DOCTYPE html>
      <html lang="it">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Trascrizione Riunione</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6; 
              color: #111827;
              margin: 2rem;
            }
            h1 { font-size: 1.5em; color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 0.5rem; margin-bottom: 1.5rem; }
            pre { white-space: pre-wrap; word-wrap: break-word; font-size: 1em; }
            @media print {
              body { margin: 0; font-size: 10pt; }
            }
          </style>
        </head>
        <body>
          <h1>Trascrizione Completa</h1>
          <pre>${transcript}</pre>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printableContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } else {
      alert('Per favore, consenti i pop-up per esportare la trascrizione.');
    }
  };

  const handleExportSummary = () => {
    const markdownToHtml = (markdown: string): string => {
      const lines = markdown.split('\n');
      let html = '';
      let inList = false;

      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('**') && trimmedLine.endsWith(':')) {
          if (inList) {
            html += '</ul>\n';
            inList = false;
          }
          html += `<h3>${trimmedLine.substring(2, trimmedLine.length - 1)}</h3>\n`;
        } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
          if (!inList) {
            html += '<ul>\n';
            inList = true;
          }
          const itemContent = trimmedLine.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          html += `  <li>${itemContent}</li>\n`;
        } else if (trimmedLine === '') {
          if (inList) {
            html += '</ul>\n';
            inList = false;
          }
        } else {
          if (inList) {
            html += '</ul>\n';
            inList = false;
          }
          if (trimmedLine.length > 0) {
            const pLine = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            html += `<p>${pLine}</p>\n`;
          }
        }
      });

      if (inList) {
        html += '</ul>\n';
      }
      return html;
    };

    const printableContent = `
      <!DOCTYPE html>
      <html lang="it">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Riepilogo Riunione</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6; 
              color: #111827;
              margin: 2rem;
            }
            h1 { 
              font-size: 2em;
              color: #1e3a8a; 
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 0.5rem;
              margin-bottom: 1.5rem;
            }
            h3 { 
              font-size: 1.25em;
              color: #1e40af;
              margin-top: 2rem; 
              margin-bottom: 1rem;
              font-weight: 600;
            }
            ul { 
              padding-left: 1.5rem; 
              list-style-type: disc;
              margin-bottom: 1rem;
            }
            li { 
              margin-bottom: 0.5rem; 
            }
            p {
              margin-bottom: 1rem;
            }
            strong {
              font-weight: 600;
            }
            @media print {
              body { 
                margin: 0; 
                font-size: 10pt;
              }
            }
          </style>
        </head>
        <body>
          <h1>Riepilogo Riunione AI</h1>
          ${markdownToHtml(summary)}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printableContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } else {
      alert('Per favore, consenti i pop-up per esportare il riepilogo.');
    }
  };

  const ResultCard: React.FC<{ title: string; content: React.ReactNode; onCopy: () => void; copyType: 'transcript' | 'summary', onExport?: () => void }> = ({ title, content, onCopy, copyType, onExport }) => (
    <div className="bg-bg-primary rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-text-primary">{title}</h3>
        <div className="flex items-center gap-2">
            {onExport && (
              <button onClick={onExport} className="text-text-secondary hover:text-brand-primary transition-colors p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary" aria-label={`Esporta ${title}`}>
                <FileDown size={18} />
              </button>
            )}
            <button onClick={onCopy} className="text-text-secondary hover:text-brand-primary transition-colors p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary" aria-label={`Copia ${title}`}>
              {copied === copyType ? 'Copiato!' : <Clipboard size={18} />}
            </button>
        </div>
      </div>
      <div className="max-h-60 overflow-y-auto p-4 bg-bg-secondary border border-bg-tertiary rounded-md text-text-secondary whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {transcript && (
        <div className="space-y-4">
            <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cerca nella trascrizione..."
                    className="w-full bg-bg-secondary border border-bg-tertiary rounded-lg py-2 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    aria-label="Cerca nella trascrizione"
                />
            </div>

            <ResultCard 
              title="Trascrizione Completa" 
              content={<HighlightedText text={transcript} highlight={searchQuery} />}
              onCopy={() => handleCopy(transcript, 'transcript')}
              copyType="transcript"
              onExport={handleExportTranscript}
            />
        </div>
      )}

      {detectedSpeakers.length > 0 && (
        <div className="bg-bg-primary rounded-lg p-6">
          <h3 className="text-xl font-semibold text-text-primary mb-4">Identifica Oratori</h3>
          <p className="text-text-secondary mb-4">
            Sostituisci le etichette degli oratori con i nomi reali per una trascrizione e un riepilogo più chiari.
          </p>
          <div className="space-y-3">
            {detectedSpeakers.map(speaker => (
              <div key={speaker} className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2 sm:gap-4">
                <label htmlFor={speaker} className="sm:text-right text-text-secondary font-medium">{speaker}</label>
                <input
                  id={speaker}
                  type="text"
                  value={speakerNames[speaker] || ''}
                  onChange={(e) => handleSpeakerNameChange(speaker, e.target.value)}
                  placeholder="Inserisci nome..."
                  className="sm:col-span-2 bg-bg-secondary border border-bg-tertiary rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={handleApplyNames}
              className="flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-dark text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
              <Check size={18} />
              Applica Nomi
            </button>
          </div>
        </div>
      )}
      
      {summary && (
        <ResultCard 
          title="Riepilogo AI" 
          content={summary}
          onCopy={() => handleCopy(summary, 'summary')}
          copyType="summary"
          onExport={handleExportSummary}
        />
      )}

      {!summary && transcript && (
        <div className="bg-bg-primary rounded-lg p-6">
          <h3 className="text-xl font-semibold text-text-primary mb-4">Genera Riepilogo</h3>
          <p className="text-text-secondary mb-4">
            Per migliorare il riepilogo, elenca i partecipanti alla riunione qui sotto (opzionale, separati da virgola).
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder="es. Alice, Bob, Charlie"
              className="flex-grow bg-bg-secondary border border-bg-tertiary rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <button
              onClick={() => onGenerateSummary(participants)}
              disabled={isSummarizing}
              className="flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-dark text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles size={18} />
              {isSummarizing ? 'Generazione...' : 'Riepiloga'}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4 border-t border-bg-tertiary mt-8">
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 w-full sm:w-auto bg-slate-500 hover:bg-slate-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
        >
          <RefreshCw size={18} />
          Inizia Nuova Sessione
        </button>
        {audioBlob && (
          <button
            onClick={handleDownloadAudio}
            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-bg-tertiary hover:bg-slate-300 text-text-primary font-bold py-2 px-6 rounded-lg transition-colors"
          >
            <Download size={18} />
            Scarica Audio
          </button>
        )}
      </div>
    </div>
  );
};


const LucideClipboard: React.FC<{ size: number }> = ({ size }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
);
const LucideRefreshCw: React.FC<{ size: number }> = ({ size }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
);
const LucideSparkles: React.FC<{ size: number }> = ({ size }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.94 18.06 12 22l2.06-3.94"/><path d="M3.94 6.06 6 10l2.06-3.94"/><path d="M12 22V10"/><path d="M6 10H2"/><path d="M10 6V2"/><path d="M10 6H2"/><path d="m18 14 2.06 3.94L22 14l-2.06-3.94L18 14Z"/><path d="M18 14h4"/><path d="M14 18v4"/><path d="M14 18h4"/></svg>
);
const LucideFileDown: React.FC<{ size: number }> = ({ size }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/></svg>
);
const LucideCheck: React.FC<{ size: number }> = ({ size }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
);
const LucideSearch: React.FC<{ size: number, className?: string }> = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);
const LucideDownload: React.FC<{ size: number }> = ({ size }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
);

export { LucideClipboard as Clipboard, LucideRefreshCw as RefreshCw, LucideSparkles as Sparkles, LucideFileDown as FileDown, LucideCheck as Check, LucideSearch as Search, LucideDownload as Download };
export default ResultsScreen;