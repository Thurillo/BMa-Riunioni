import React, { useEffect, useState } from 'react';
import useAudioRecorder from '../hooks/useAudioRecorder';
import AudioVisualizer from './AudioVisualizer';
import { Square } from 'lucide-react';

interface RecordingScreenProps {
  onRecordingComplete: (blob: Blob) => void;
}

const RecordingScreen: React.FC<RecordingScreenProps> = ({ onRecordingComplete }) => {
  const { isRecording, startRecording, stopRecording, audioData } = useAudioRecorder({ onRecordingComplete });
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    startRecording();
  }, [startRecording]);

  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRecording]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60).toString().padStart(2, '0');
    const seconds = (time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <div className="text-center">
        <p className="text-xl text-text-secondary">Registrazione in corso...</p>
        <p className="text-6xl font-bold text-text-primary tracking-wider mt-2">
          {formatTime(elapsedTime)}
        </p>
      </div>
      
      <AudioVisualizer audioData={audioData} />

      <button
        onClick={stopRecording}
        className="flex items-center justify-center gap-3 bg-brand-secondary hover:bg-red-700 text-white font-bold py-4 px-8 rounded-full transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-brand-secondary/50 shadow-lg"
        aria-label="Interrompi Registrazione"
      >
        <Square size={24} fill="white" />
        Interrompi Registrazione
      </button>
    </div>
  );
};


const LucideSquare: React.FC<{ size: number, fill?: string }> = ({ size, fill = 'none' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>
);

export { LucideSquare as Square };
export default RecordingScreen;