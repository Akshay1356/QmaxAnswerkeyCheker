import React from 'react';
import { 
  Cpu, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  RefreshCw, 
  ArrowRight
} from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';
import { AdminReviewWorkspace } from './AdminReviewWorkspace';

export const EvaluationPipelineView: React.FC = () => {
  const { 
    candidates, 
    answerKey, 
    isEvaluating, 
    telemetry, 
    startEvaluationProcess, 
    setActiveTab 
  } = useAssessment();

  const reviewRequiredList = candidates.filter(c => c.status === 'REVIEW_REQUIRED');

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16 md:pb-10 font-sans text-xs">
      {/* Top Console Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-red-600 font-bold uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5 text-red-600" />
              <span>AI Evaluation Engine</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Assessment Processing Console
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Verified Master Key: <strong className="text-slate-900 font-semibold">{answerKey.title}</strong> ({answerKey.totalQuestions} Questions • {answerKey.totalMaxMarks} Marks)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={startEvaluationProcess}
              disabled={isEvaluating || !answerKey.isVerified || candidates.length === 0}
              className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-xs transition flex items-center gap-2 shadow-xs"
            >
              {isEvaluating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
              <span>{isEvaluating ? 'Processing Candidates...' : 'Start Evaluation Batch →'}</span>
            </button>
          </div>
        </div>

        {/* 6-Stage Technical Pipeline Flow */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { name: '1. Doc Analysis', progress: telemetry.stageProgress.docAnalysis, label: 'Page Layout' },
            { name: '2. OCR Engine', progress: telemetry.stageProgress.hwr, label: 'Handwriting OCR' },
            { name: '3. Extraction', progress: telemetry.stageProgress.extraction, label: 'Answer Mapping' },
            { name: '4. Unit Analysis', progress: telemetry.stageProgress.unitAnalysis, label: 'Units & Quantities' },
            { name: '5. Semantic Eval', progress: telemetry.stageProgress.semanticEval, label: 'Tolerance Check' },
            { name: '6. Scoring', progress: telemetry.stageProgress.scoring, label: 'Excel Matrix' }
          ].map((s, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-semibold truncate">{s.name}</span>
                <span className="text-red-600 font-bold">{s.progress}%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-red-600 h-full transition-all duration-300"
                  style={{ width: `${s.progress}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 truncate">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Live Active Item Indicator */}
        {telemetry.currentCandidateId && (
          <div className="mt-4 p-3 rounded-lg bg-red-50/70 border border-red-200 flex items-center justify-between text-xs text-slate-800 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              <span>Evaluating: <strong className="text-slate-900">{telemetry.currentCandidateName}</strong> ({telemetry.currentCandidateId})</span>
            </div>
            <span className="text-slate-600 font-semibold">
              {telemetry.currentCandidateIndex} / {telemetry.totalCandidates} Processed
            </span>
          </div>
        )}
      </div>

      {/* Grid: Execution Log & Review Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Terminal Telemetry Log (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-[480px] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs uppercase">
              <Terminal className="w-4 h-4 text-slate-700" />
              <span>Live Engine Execution Log</span>
            </div>
            <span className="text-xs text-slate-500 font-mono">{telemetry.logs.length} events logged</span>
          </div>

          <div className="mt-3 flex-1 bg-slate-900 text-slate-100 rounded-xl p-4 text-xs overflow-y-auto space-y-1 font-mono border border-slate-800">
            {telemetry.logs.length === 0 ? (
              <div className="text-slate-500 py-16 text-center italic font-sans">
                Engine idle. Click &apos;Start Evaluation Batch&apos; to process candidates.
              </div>
            ) : (
              telemetry.logs.map((l, i) => (
                <div key={i} className="leading-relaxed">
                  {l}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Review Queue Summary Box (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between h-[480px] shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 font-bold text-amber-800 text-xs uppercase">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Uncertain Review Queue ({reviewRequiredList.length})</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">Confidence &lt; 85%</span>
            </div>

            <div className="mt-3 space-y-2 overflow-y-auto max-h-[320px] pr-1">
              {reviewRequiredList.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-90" />
                  <div className="font-bold text-slate-900 text-sm">All candidate answers verified</div>
                  <div className="text-xs text-slate-500 mt-0.5">Zero manual handwriting overrides pending.</div>
                </div>
              ) : (
                reviewRequiredList.map((cand) => (
                  <div 
                    key={cand.id}
                    className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{cand.name}</div>
                      <div className="text-xs text-slate-600">{cand.candidateId} • {cand.appliedRole}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
                      Action Required
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200">
            <button
              onClick={() => setActiveTab('results')}
              className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>View Consolidated Results →</span>
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Admin Review Component */}
      {reviewRequiredList.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <AdminReviewWorkspace />
        </div>
      )}
    </div>
  );
};
