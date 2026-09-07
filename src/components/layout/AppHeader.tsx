import React from 'react';
import { 
  ShieldCheck, 
  Download, 
  Play, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';

export const AppHeader: React.FC = () => {
  const { 
    activeTab,
    setActiveTab,
    answerKey, 
    candidates, 
    isEvaluating, 
    isGeminiConfigured,
    startEvaluationProcess, 
    exportToExcel, 
    resetAllData 
  } = useAssessment();

  const evaluatedCount = candidates.filter(c => c.evaluationResult).length;

  const getTabTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Operations Dashboard';
      case 'evaluations': return 'Active Assessment Batches';
      case 'answer_key': return 'Answer Key Verification Workspace';
      case 'candidates': return 'Candidate Answer Sheets';
      case 'evaluation': return 'AI Evaluation Engine';
      case 'results': return 'Evaluation Results & Reports';
      case 'reports': return 'Psychometric & Item Analysis';
      case 'settings': return 'System Settings';
      default: return 'Operations Dashboard';
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-20 px-4 md:px-6 py-2.5 flex items-center justify-between">
      {/* Title / Active Context */}
      <div className="flex items-center gap-3">
        <div className="md:hidden w-7 h-7 rounded bg-red-600 flex items-center justify-center font-bold text-white text-xs">
          Q
        </div>
        <div>
          <h1 className="text-xs md:text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{getTabTitle()}</span>
          </h1>
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <span>Batch: QMAX-TECH-2026</span>
            <span>•</span>
            <span className={answerKey.isVerified ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
              Key: {answerKey.isVerified ? 'Verified Master Rubric' : (answerKey.questions.length > 0 ? 'Verification Pending' : 'Awaiting Document')}
            </span>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        {/* Gemini API Status Badge */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
            isGeminiConfigured
              ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
              : 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700 animate-pulse'
          }`}
          title={isGeminiConfigured ? 'Google Gemini AI Connected' : 'Click to configure Google Gemini API Key'}
        >
          <Sparkles className={`w-3.5 h-3.5 ${isGeminiConfigured ? 'text-emerald-600' : 'text-red-600'}`} />
          <span className="hidden md:inline">{isGeminiConfigured ? 'Gemini AI Active' : 'Connect Gemini AI'}</span>
        </button>

        {/* Clear Workspace */}
        <button
          onClick={resetAllData}
          title="Clear current assessment data"
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600 hover:text-slate-900 transition shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Clear</span>
        </button>

        {/* Excel Export Button */}
        <button
          onClick={exportToExcel}
          disabled={evaluatedCount === 0}
          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-slate-700" />
          <span className="hidden sm:inline">Export Excel</span>
        </button>

        {/* Start Evaluation Action */}
        <button
          onClick={() => {
            setActiveTab('evaluation');
            startEvaluationProcess();
          }}
          disabled={isEvaluating || !answerKey.isVerified || candidates.length === 0}
          className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isEvaluating ? 'Evaluating...' : 'Evaluate'}</span>
        </button>
      </div>
    </header>
  );
};