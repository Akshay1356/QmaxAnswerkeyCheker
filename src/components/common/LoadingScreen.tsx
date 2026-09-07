import React, { useState, useEffect } from 'react';
import { Cpu, Sparkles, ShieldCheck, Zap, ArrowRight } from 'lucide-react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'qmax' | 'morphing' | 'qsmart'>('qmax');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 3200; // 3.2s total smooth transformation flow

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(currentProgress);

      if (currentProgress < 42) {
        setStage('qmax');
      } else if (currentProgress >= 42 && currentProgress < 52) {
        setStage('morphing');
      } else {
        setStage('qsmart');
      }

      if (elapsed >= duration) {
        clearInterval(interval);
        setIsFadingOut(true);
        setTimeout(() => {
          onComplete();
        }, 700);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [onComplete]);

  const getStatusText = () => {
    if (progress < 25) return 'INITIALIZING QMAX SYSTEMS PLATFORM';
    if (progress < 45) return 'SYNCHRONIZING ASSESSMENT ARCHITECTURE';
    if (progress < 60) return 'ACTIVATING QSMART AI ENGINE';
    if (progress < 85) return 'CONFIGURING GEMINI 3.7 FLASH OCR';
    return 'SYSTEM READY • LAUNCHING WORKSPACE';
  };

  const getStatusIcon = () => {
    if (progress < 45) return Zap;
    if (progress < 75) return Cpu;
    if (progress < 90) return Sparkles;
    return ShieldCheck;
  };

  const StatusIcon = getStatusIcon();

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white transition-all duration-700 ease-out select-none ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background High-Tech Subtle Matrix Grid & Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/90 pointer-events-none" />

      {/* Center Animated Stage Container */}
      <div className="relative z-10 flex flex-col items-center max-w-lg w-full px-6 text-center">
        
        {/* Animated Brand Emblem Lockup */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Pulsing Outer Geometric Ring */}
          <div className="absolute w-28 h-28 rounded-2xl border-2 border-red-500/20 animate-ping duration-1000" />
          <div className="absolute w-24 h-24 rounded-2xl border border-red-500/30 animate-pulse" />
          
          {/* Rotating Subtle Dash Ring */}
          <div className="absolute w-28 h-28 rounded-full border border-dashed border-slate-300 animate-spin [animation-duration:12s]" />

          {/* Center Brand Badge with Stage Morph */}
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 shadow-xl shadow-red-600/30 flex items-center justify-center border border-red-400/40 transform transition-all duration-500">
            <span className="text-4xl font-black text-white font-sans tracking-tighter drop-shadow-md">
              Q
            </span>
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white animate-pulse" />
          </div>
        </div>

        {/* Morphing Typography Area with Fixed Height to Prevent Layout Shift */}
        <div className="h-24 flex flex-col items-center justify-center relative w-full overflow-hidden">
          
          {/* STAGE 1: QMAX SYSTEMS (Visible when stage === 'qmax') */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-in-out ${
              stage === 'qmax'
                ? 'opacity-100 translate-y-0 scale-100 filter-none'
                : 'opacity-0 -translate-y-4 scale-95 pointer-events-none blur-xs'
            }`}
          >
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-[0.25em] uppercase font-sans">
              QMAX <span className="text-red-600">SYSTEMS</span>
            </h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="h-px w-6 bg-red-500/60" />
              <p className="text-[11px] font-extrabold tracking-[0.25em] text-slate-500 uppercase font-mono">
                ENGINEERING EXCELLENCE
              </p>
              <span className="h-px w-6 bg-red-500/60" />
            </div>
          </div>

          {/* STAGE 2: Qsmart (Visible when stage === 'qsmart' or morphing into it) */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-in-out ${
              stage === 'qsmart'
                ? 'opacity-100 translate-y-0 scale-100 filter-none'
                : 'opacity-0 translate-y-4 scale-95 pointer-events-none blur-xs'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <div className="flex items-baseline font-sans tracking-tight">
                <span className="text-4xl sm:text-5xl font-black text-red-600">Q</span>
                <span className="text-4xl sm:text-5xl font-extrabold text-slate-900">smart</span>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200 shadow-2xs">
                PRO
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="h-px w-6 bg-red-500/60" />
              <p className="text-[11px] font-bold tracking-[0.2em] text-slate-500 uppercase font-mono">
                AI Assessment & Evaluation Engine
              </p>
              <span className="h-px w-6 bg-red-500/60" />
            </div>
          </div>

        </div>

        {/* Diagnostic Telemetry & Micro Progress Bar */}
        <div className="w-full mt-6 mb-4 max-w-sm">
          <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-slate-600 mb-1.5 px-0.5">
            <span className="flex items-center gap-1.5 text-slate-700 tracking-wide truncate">
              <StatusIcon className="w-3.5 h-3.5 text-red-600 shrink-0 animate-pulse" />
              <span>{getStatusText()}</span>
            </span>
            <span className="text-red-600 font-bold ml-2 shrink-0">{progress}%</span>
          </div>

          {/* Progress Bar Track */}
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-red-500 to-red-600 transition-all duration-75 ease-out rounded-full shadow-[0_0_8px_rgba(220,38,38,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Footer Technical Security Stamp */}
        <div className="mt-2 flex items-center justify-center gap-2 text-[10px] font-mono text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>GEMINI 3.7 FLASH AI PIPELINE • CONFIDENTIAL</span>
        </div>

      </div>
    </div>
  );
};
