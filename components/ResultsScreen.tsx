import React, { useState, useEffect, useMemo } from 'react';
import { Clipboard, RefreshCw, Sparkles, FileDown, Check, Search, Download, UserPlus, Edit3, Loader } from 'lucide-react';

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
                    <mark key={i} className="bg-primary/20 text-primary-hover rounded px-1 py-0.5">{part}</mark>
                ) : (
                    part
                )
            )}
        </>
    );
};

const SummaryDisplay: React.FC<{ markdown: string }> = ({ markdown }) => {
  const html = useMemo(() => {
    const lines = markdown.split('\n');
    let htmlContent = '';
    let inList = false;

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        if (inList) {
          htmlContent += '</ul>\n';
          inList = false;
        }
        htmlContent += `<h3 class="text-lg font-semibold text-foreground mt-4 mb-2">${trimmedLine.substring(2, trimmedLine.length - 2)}</h3>\n`;
      } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        if (!inList) {
          htmlContent += '<ul class="list-disc list-inside space-y-1 text-muted">\n';
          inList = true;
        }
        const itemContent = trimmedLine.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>');
        htmlContent += `  <li>${itemContent}</li>\n`;
      } else if (trimmedLine === '') {
        if (inList) {
          htmlContent += '</ul>\n';
          inList = false;
        }
      }
    });

    if (inList) {
      htmlContent += '</ul>\n';
    }
    return htmlContent;
  }, [markdown]);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
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
  const [isEditingSpeakers, setIsEditingSpeakers] = useState(false);

  useEffect(() => {
    if (detectedSpeakers.length > 0) {
      setIsEditingSpeakers(true);
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
    setIsEditingSpeakers(false);
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
  
  const handleExport = (content: string, title: string) => {
    const printableContent = `
      <!DOCTYPE html>
      <html lang="it">
        <head>
          <meta charset="UTF-8"><title>${title}</title>
          <style>
            body { font-family: system-ui, sans-serif; line-height: 1.6; color: #111; margin: 2rem; }
            h1 { font-size: 1.5rem; color: #003c7a; border-bottom: 2px solid #0054a6; padding-bottom: 0.5rem; }
            h3 { font-size: 1.2rem; color: #003c7a; margin-top: 1.5rem; }
            ul { padding-left: 1.5rem; }
            li { margin-bottom: 0.5rem; }
            pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; font-size: 1rem; }
            strong { color: #0f172a; }
            @media print { body { margin: 1in; font-size: 11pt; } }
          </style>
        </head>
        <body><h1>${title}</h1><div>${content}</div></body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(printableContent);
    printWindow?.document.close();
    printWindow?.focus();
    setTimeout(() => printWindow?.print(), 250);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Transcript Column */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">Trascrizione Completa</h3>
           <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cerca nella trascrizione..."
                    className="w-full bg-background border border-border rounded-lg py-2 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Cerca nella trascrizione"
                />
            </div>
            <div className="bg-background rounded-xl p-4 border border-border">
                <div className="max-h-96 overflow-y-auto pr-2 text-muted whitespace-pre-wrap text-sm leading-relaxed">
                    <HighlightedText text={transcript} highlight={searchQuery} />
                </div>
            </div>
            <div className="flex items-center gap-2">
                 <button onClick={() => handleCopy(transcript, 'transcript')} className="flex items-center gap-2 text-sm text-muted hover:text-primary font-semibold p-2 rounded-lg bg-background border border-border">
                    {copied === 'transcript' ? <><Check size={16} className="text-green-500" /> Copiato</> : <><Clipboard size={16} /> Copia</>}
                 </button>
                 <button onClick={() => handleExport(`<pre>${transcript}</pre>`, 'Trascrizione Riunione')} className="flex items-center gap-2 text-sm text-muted hover:text-primary font-semibold p-2 rounded-lg bg-background border border-border">
                    <FileDown size={16} /> Esporta
                 </button>
            </div>
        </div>

        {/* Summary & Actions Column */}
        <div className="space-y-6">
            <h3 className="text-xl font-semibold text-foreground">Riepilogo e Azioni</h3>
            
            {isEditingSpeakers && (
                 <div className="bg-accent/50 rounded-xl p-6 border border-primary/20">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2"><UserPlus size={18}/> Identifica Oratori</h4>
                    <p className="text-sm text-muted mb-4">
                        Assegna i nomi corretti per una maggiore chiarezza.
                    </p>
                    <div className="space-y-3">
                        {detectedSpeakers.map(speaker => (
                        <div key={speaker} className="grid grid-cols-3 items-center gap-3">
                            <label htmlFor={speaker} className="text-right text-muted font-medium text-sm">{speaker}</label>
                            <input
                            id={speaker}
                            type="text"
                            value={speakerNames[speaker] || ''}
                            onChange={(e) => handleSpeakerNameChange(speaker, e.target.value)}
                            placeholder="Nome..."
                            className="col-span-2 bg-card border border-border rounded-lg py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        ))}
                    </div>
                    <div className="flex justify-end mt-5">
                        <button onClick={handleApplyNames} className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-bold py-2 px-4 rounded-lg text-sm">
                            <Check size={16} /> Applica Nomi
                        </button>
                    </div>
                </div>
            )}

            {summary ? (
                 <div className="bg-background rounded-xl p-6 border border-border space-y-2">
                    <SummaryDisplay markdown={summary} />
                    <div className="flex items-center gap-2 pt-4">
                        <button onClick={() => handleCopy(summary, 'summary')} className="flex items-center gap-2 text-sm text-muted hover:text-primary font-semibold p-2 rounded-lg bg-card border border-border">
                           {copied === 'summary' ? <><Check size={16} className="text-green-500" /> Copiato</> : <><Clipboard size={16} /> Copia</>}
                        </button>
                        <button onClick={() => handleExport(document.querySelector('.summary-content-wrapper')?.innerHTML || '', 'Riepilogo Riunione')} className="flex items-center gap-2 text-sm text-muted hover:text-primary font-semibold p-2 rounded-lg bg-card border border-border">
                           <FileDown size={16} /> Esporta
                        </button>
                    </div>
                 </div>
            ) : (
                <div className="bg-accent/50 rounded-xl p-6 border border-primary/20 text-center">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2 justify-center"><Sparkles size={18}/> Genera Riepilogo Intelligente</h4>
                    <p className="text-sm text-muted mb-4">
                        Elenca i partecipanti (opzionale) per migliorare l'accuratezza del riepilogo.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                        type="text"
                        value={participants}
                        onChange={(e) => setParticipants(e.target.value)}
                        placeholder="es. Mario Rossi, Luca Bianchi"
                        className="flex-grow bg-card border border-border rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                        onClick={() => onGenerateSummary(participants)}
                        disabled={isSummarizing}
                        className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-bold py-2 px-5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                        {isSummarizing ? <><Loader size={18} className="animate-spin" /> Generazione...</> : 'Riepiloga'}
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6 border-t border-border mt-8">
        <button onClick={onReset} className="flex items-center justify-center gap-2 w-full sm:w-auto bg-primary hover:bg-primary-hover text-primary-foreground font-bold py-2.5 px-6 rounded-lg">
          <RefreshCw size={18} />
          Nuova Sessione
        </button>
        {audioBlob && (
          <button onClick={handleDownloadAudio} className="flex items-center justify-center gap-2 w-full sm:w-auto bg-card border-2 border-border hover:border-primary text-foreground font-bold py-2.5 px-6 rounded-lg">
            <Download size={18} />
            Scarica Audio (.webm)
          </button>
        )}
      </div>
    </div>
  );
};

export default ResultsScreen;
