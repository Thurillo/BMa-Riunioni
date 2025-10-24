import React, { useState, useEffect } from 'react';
import { CheckCircle, Loader, Circle } from 'lucide-react';

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

  // A faked progress percentage that animates but doesn't promise 100% completion
  const progressPercentage = Math.min(
    10 + (currentStep / (steps.length - 1)) * 80,
    90 // Stop at 90% to manage expectations
  );

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-8 px-4 text-center">
      <h2 className="text-2xl font-semibold text-text-primary">{title}</h2>
      
      <div className="w-full bg-bg-tertiary rounded-full h-2.5 overflow-hidden">
        <div 
          className="bg-brand-primary h-2.5 rounded-full" 
          style={{ 
            width: `${progressPercentage}%`, 
            transition: 'width 1.8s cubic-bezier(0.4, 0, 0.2, 1)' 
          }}
        ></div>
      </div>

      <div className="w-full max-w-md space-y-4 text-left self-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isInProgress = index === currentStep;
          const isPending = index > currentStep;

          return (
            <div key={step} className={`flex items-center gap-4 transition-opacity duration-500 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
              <div className="flex-shrink-0 w-6 flex items-center justify-center">
                {isCompleted ? (
                  <CheckCircle size={22} className="text-green-500" />
                ) : isInProgress ? (
                  <Loader size={22} className="animate-spin text-brand-primary" />
                ) : (
                  <Circle size={22} className="text-bg-tertiary" />
                )}
              </div>
              <p className="text-base text-text-secondary">
                {step}
              </p>
            </div>
          );
        })}
      </div>
      <p className="text-text-secondary/80 mt-4 text-sm">L'IA sta facendo la sua magia. Potrebbe volerci un momento.</p>
    </div>
  );
};

export default Spinner;