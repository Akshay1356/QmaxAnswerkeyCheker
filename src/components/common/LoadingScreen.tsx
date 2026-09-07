import React, { useState, useEffect } from 'react';
import { Cpu, Sparkles, ShieldCheck, Zap } from 'lucide-react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const phases = [
    { text: 'INITIALIZING QMAX SYSTEMS ENGINE', icon: Zap },
    { text: 'CONFIGURING GEMINI 3.7 FLASH AI CORE', icon: Cpu },
    { text: 'CALIBRATING HANDWRITING & OCR RUBRICS', icon: Sparkles },
    { text: 'VERIFYING SECURE EVALUATION ENVIRONMENT', icon: ShieldCheck },
    { text: 'LAUNCHING QSMART WORKSPACE', icon: Zap }
  ];

  useEffect(() => {
    const startTime = Date.now();
    const duration = 2200; // 2.2s total smooth load time

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(currentProgress);

      const step = Math.min(phases.length - 1, Math.floor((currentProgress / 100) * phases.length));
      setPhaseIndex(step);

      if (elapsed >= duration) {
        clearInterval(interval);
        setIsFadingOut(true);
        setTimeout(() => {
          onComplete();
        }, 600); // Wait for fade-out transition
      }
    }, 25);

    return () => clearInterval(interval);
  }, [onComplete]);

  const CurrentIcon = phases[phaseIndex].icon;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white transition-all duration-700 ease-out select-none ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background High-Tech Subtle Grid & Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/80 pointer-events-none" />

      {/* Center Animated Core */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6 text-center">
        {/* Animated Brand Emblem */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Pulsing Outer Rings */}
          <div className="absolute w-28 h-28 rounded-2xl border-2 border-red-500/20 animate-ping duration-1000" />
          <div className="absolute w-24 h-24 rounded-2xl border border-red-500/30 animate-pulse" />
          
          {/* Rotating Subtle Dash Ring */}
          <div className="absolute w-28 h-28 rounded-full border border-dashed border-slate-300 animate-spin [animation-duration:12s]" />

          {/* Core Emblem Box */}
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 shadow-xl shadow-red-600/30 flex items-center justify-center border border-red-400/40 transform transition-transform hover:scale-105">
            {/* Inner Glowing 'Q' */}
            <span className="text-4xl font-extrabold text-white font-sans tracking-tighter drop-shadow-md">
              Q
            </span>

            {/* Glowing Accent Corner Dot */}
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white animate-pulse" />
          </div>
        </div>

        {/* Brand Name with sleek typography */}
        <div className="mb-2">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-[0.2em] uppercase font-sans">
            QMAX <span className="text-red-600">SYSTEMS</span>
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="h-px w-6 bg-red-500/60" />
            <p className="text-[11px] font-bold tracking-[0.3em] text-slate-500 uppercase font-mono">
              Qsmart Assessment Platform
            </p>
            <span className="h-px w-6 bg-red-500/60" />
          </div>
        </div>

        {/* Micro Progress Bar */}
        <div className="w-full mt-8 mb-4">
          <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-slate-600 mb-1.5 px-0.5">
            <span className="flex items-center gap-1.5 text-slate-700">
              <CurrentIcon className="w-3.5 h-3.5 text-red-600 animate-pulse" />
              {phases[phaseIndex].text}
            </span>
            <span className="text-red-600 font-bold">{progress}%</span>
          </div>

          {/* Progress Track */}
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-red-500 to-red-600 transition-all duration-75 ease-out rounded-full shadow-[0_0_8px_rgba(220,38,38,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Footer Technical Stamp */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-mono text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>GEMINI 3.7 FLASH AI ENGINE • STRICTLY CONFIDENTIAL</span>
        </div>
      </div>
    </div>
  );
};
