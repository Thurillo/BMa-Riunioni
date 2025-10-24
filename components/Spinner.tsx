import React, { useState, useEffect } from 'react';
import { CheckCircle, Loader, CircleDot } from 'lucide-react';

interface SpinnerProps {
  title: string;
  steps: string[];
}

const Spinner: React.FC<SpinnerProps> = ({ title, steps }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        // Don't auto-complete the last step; it completes when the parent moves to the next state
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1800); // Faked progress interval

    return () => clearInterval(interval);
  }, [steps.length]);

  const progressPercentage = 10 + (currentStep / (steps.length - 1)) * 85;

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-8 px-4 text-center">
      <div className="flex items-center gap-4">
        <Loader size={32} className="animate-spin text-primary" />
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
      </div>
      
      <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
        <div 
          className="bg-primary h-2.5 rounded-full" 
          style={{ 
            width: `${progressPercentage}%`, 
            transition: 'width 1.8s cubic-bezier(0.4, 0, 0.2, 1)' 
          }}
        ></div>
      </div>

      <div className="w-full max-w-lg space-y-4 text-left self-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isInProgress = index === currentStep;

          return (
            <div key={step} className={`flex items-start gap-4 transition-opacity duration-500 ${!isCompleted && !isInProgress ? 'opacity-50' : 'opacity-100'}`}>
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center mt-0.5">
                {isCompleted ? (
                  <CheckCircle size={22} className="text-green-500" />
                ) : isInProgress ? (
                  <CircleDot size={22} className="animate-pulse text-primary" />
                ) : (
                  <div className="w-3.5 h-3.5 bg-border rounded-full" />
                )}
              </div>
              <p className={`text-base ${isInProgress ? 'text-foreground font-semibold' : 'text-muted'}`}>
                {step}
              </p>
            </div>
          );
        })}
      </div>
      <p className="text-muted/80 mt-4 text-sm">L'IA sta elaborando i dati. Questo processo potrebbe richiedere alcuni istanti.</p>
    </div>
  );
};

export default Spinner;