
import React, { useState } from 'react';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to UrbanFlow+",
      description: "The fastest way to navigate your city with the power of Gemini AI.",
      icon: "🌐",
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Smart Real-Time Routing",
      description: "GTFS integration meets AI logic. We don't just find routes, we optimize them.",
      icon: "⚡",
      color: "from-indigo-500 to-purple-500"
    },
    {
      title: "Eco-Conscious Travel",
      description: "Track your CO2 savings and earn rewards for choosing greener paths.",
      icon: "🌱",
      color: "from-green-500 to-emerald-500"
    }
  ];

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className={`h-full w-full bg-gradient-to-br ${steps[step].color} flex flex-col items-center justify-center p-8 text-white text-center transition-all duration-700`}>
      <div className="text-8xl mb-8 animate-bounce">{steps[step].icon}</div>
      <h1 className="text-4xl font-black tracking-tighter mb-4">{steps[step].title}</h1>
      <p className="text-lg opacity-90 max-w-xs mx-auto mb-12 leading-relaxed">
        {steps[step].description}
      </p>
      
      <div className="flex gap-2 mb-12">
        {steps.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all ${step === i ? 'w-8 bg-white' : 'bg-white/30'}`}></div>
        ))}
      </div>

      <button 
        onClick={next}
        className="bg-white text-black px-12 py-4 rounded-full font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition"
      >
        {step === steps.length - 1 ? "Let's Go" : "Next"}
      </button>
    </div>
  );
};

export default Onboarding;
