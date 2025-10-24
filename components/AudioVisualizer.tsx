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
    
    let x = 0;
    const sliceWidth = (width * 1.0) / audioData.length;

    context.lineWidth = 2;
    context.strokeStyle = '#0054a6'; // brand-primary
    context.clearRect(0, 0, width, height);
    context.beginPath();
    context.moveTo(0, height / 2);

    for (const item of audioData) {
      const y = (item / 255.0) * height;
      context.lineTo(x, y);
      x += sliceWidth;
    }

    context.lineTo(x, height / 2);
    context.stroke();
  }, [audioData]);

  return <canvas ref={canvasRef} width="600" height="150" className="w-full h-36 rounded-lg bg-bg-tertiary" />;
};

export default AudioVisualizer;
