import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  audioData: Uint8Array;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const height = canvas.height;
    const width = canvas.width;
    const context = canvas.getContext('2d');
    if (!context) return;

    const barWidth = 4;
    const numBars = Math.floor(width / (barWidth + 2)); // +2 for spacing
    const dataPointsPerBar = Math.floor(audioData.length / numBars);
    
    context.clearRect(0, 0, width, height);

    for (let i = 0; i < numBars; i++) {
        let sum = 0;
        for (let j = 0; j < dataPointsPerBar; j++) {
            sum += audioData[i * dataPointsPerBar + j];
        }
        const avg = dataPointsPerBar > 0 ? sum / dataPointsPerBar : 0;
        
        // Normalize the average to be between 0 and 1
        const normalized = avg / 255;
        
        // Make the bar height react more dynamically
        const barHeight = Math.pow(normalized, 2) * height * 0.9 + (height * 0.05);

        const x = i * (barWidth + 2);
        const y = (height - barHeight) / 2;
        
        const gradient = context.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, '#0054a6'); // primary
        gradient.addColorStop(1, '#e6f0fa'); // accent
        context.fillStyle = gradient;

        context.fillRect(x, y, barWidth, barHeight);
    }
  }, [audioData]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

export default AudioVisualizer;