import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

const useAudioRecorder = ({ onRecordingComplete }: UseAudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState(new Uint8Array(0));
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const visualize = useCallback(() => {
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
      setAudioData(new Uint8Array(dataArrayRef.current));
    }
    animationFrameRef.current = requestAnimationFrame(visualize);
  }, []);

  const startRecording = useCallback(async () => {
    // Check for browser support and secure context (HTTPS/localhost)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Funzionalità di registrazione non supportata. Assicurati di eseguire l\'app in un contesto sicuro (HTTPS o localhost) e di utilizzare un browser moderno.');
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      setError(null);
      audioChunksRef.current = [];

      // Setup visualizer
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      source.connect(analyserRef.current);
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      visualize();
      
      // Setup recorder
      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (typeof event.data === 'undefined') return;
        if (event.data.size === 0) return;
        audioChunksRef.current.push(event.data);
      });

      mediaRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      });

      mediaRecorder.start();
    } catch (err) {
      console.error('Error starting recording:', err);
      let message = 'Si è verificato un errore sconosciuto durante l\'avvio della registrazione.';
      if (err instanceof DOMException) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
              message = 'Accesso al microfono negato. Per favore, consenti l\'accesso al microfono nelle impostazioni del tuo browser e ricarica la pagina.';
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
              message = 'Nessun microfono trovato. Assicurati che un microfono sia collegato e funzionante.';
          } else if (err.name === 'NotReadableError') {
              message = 'Impossibile accedere al microfono. Potrebbe essere in uso da un\'altra applicazione.';
          }
      } else if (err instanceof Error) {
          message = `Errore tecnico: ${err.message}`;
      }
      setError(message);
      setIsRecording(false);
    }
  }, [onRecordingComplete, visualize]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setAudioData(new Uint8Array(0));
    }
  }, []);
  
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  return { isRecording, startRecording, stopRecording, audioData, error };
};

export default useAudioRecorder;