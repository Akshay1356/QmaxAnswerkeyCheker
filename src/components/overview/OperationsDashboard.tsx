import React from 'react';
import { 
  KeyRound, 
  Users, 
  Cpu, 
  CheckSquare, 
  ArrowRight, 
  ShieldCheck, 
  Play, 
  AlertTriangle,
  Layers,
  Camera,
  Sparkles
} from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';

interface OperationsDashboardProps {
  onOpenScanner: () => void;
}

export const OperationsDashboard: React.FC<OperationsDashboardProps> = ({ onOpenScanner }) => {
  const { 
    answerKey, 
    candidates, 
    setActiveTab, 
    startEvaluationProcess, 
    loadTemplateData,
    isGeminiConfigured,
    setSelectedCandidateId
  } = useAssessment();

  const total = candidates.length;
  const evaluatedList = candidates.filter(c => c.evaluationResult);
  const evaluatedCount = evaluatedList.length;
  const reviewList = candidates.filter(c => c.status === 'REVIEW_REQUIRED');
  const reviewCount = reviewList.length;
  const pendingCount = total - evaluatedCount;

  const passCount = evaluatedList.filter(c => c.evaluationResult?.isPassed).length;
  const passRate = evaluatedCount > 0 ? Math.round((passCount / evaluatedCount) * 100) : 0;

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16 md:pb-10 font-sans">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-red-600 font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              <span>Operations Console</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {isGeminiConfigured ? 'Gemini AI Active' : 'Offline Evaluation Mode'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              <span className="text-red-600">Q</span>smart
            </h1>
            <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
              AI-powered handwritten technical answer sheet evaluation system for Qmax Systems.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('answer_key')}
              className="px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-300 text-xs text-slate-800 font-semibold transition flex items-center gap-2 shadow-2xs"
            >
              <KeyRound className="w-3.5 h-3.5 text-red-600" />
              <span>{answerKey.isVerified ? 'Answer Key (Verified ✓)' : 'Verify Answer Key'}</span>
            </button>

            <button
              onClick={onOpenScanner}
              className="px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-300 text-xs text-slate-800 font-semibold transition flex items-center gap-2 shadow-2xs"
            >
              <Camera className="w-3.5 h-3.5 text-red-600" />
              <span>+ Add Candidate</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('evaluation');
                startEvaluationProcess();
              }}
              disabled={!answerKey.isVerified || candidates.length === 0}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 text-xs font-bold text-white transition flex items-center gap-2 shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Evaluation</span>
            </button>
          </div>
        </div>

        {/* Active Assessment Summary Bar */}
        <div className="mt-5 p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white text-red-600 border border-slate-200 shadow-2xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Active Assessment Batch</div>
              <div className="text-slate-900 font-bold">{answerKey.title}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <div>
              <span className="text-slate-500">Key Status: </span>
              <span className={answerKey.isVerified ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                {answerKey.isVerified ? 'Verified & Locked ✓' : (answerKey.questions.length > 0 ? 'Verification Pending' : 'Awaiting Ingestion')}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Progress: </span>
              <span className="text-slate-900 font-bold">{evaluatedCount} / {total} candidates evaluated</span>
            </div>
          </div>
        </div>
      </div>

      {/* When Empty: Display Clean Guided Setup */}
      {candidates.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-6 shadow-xs">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Ready for Assessment Evaluation
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upload your official master Answer Key and candidate handwritten answer sheets to start automated OCR extraction and engineering grading.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-red-600 font-bold uppercase">Step 01</span>
                  {answerKey.isVerified ? (
                    <span className="text-emerald-700 text-xs font-bold">Ready ✓</span>
                  ) : (
                    <span className="text-amber-700 text-xs font-bold">Required</span>
                  )}
                </div>
                <div className="text-sm font-bold text-slate-900">Master Answer Key</div>
                <p className="text-xs text-slate-600">
                  Upload official Answer Key PDF. Extracts all 20 questions for Sets A, B, and C automatically.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('answer_key')}
                className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-black text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>{answerKey.isVerified ? 'View Answer Key' : 'Upload Answer Key'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-red-600 font-bold uppercase">Step 02</span>
                  <span className="text-slate-500 text-xs font-medium">0 Ingested</span>
                </div>
                <div className="text-sm font-bold text-slate-900">Candidate Answer Sheets</div>
                <p className="text-xs text-slate-600">
                  Upload batch PDF/images or scan physical sheets directly using your camera.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('candidates')}
                  className="flex-1 py-2.5 rounded-lg bg-slate-900 hover:bg-black text-white font-bold text-xs transition shadow-xs"
                >
                  Upload Sheets
                </button>
                <button
                  onClick={onOpenScanner}
                  className="px-3.5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-xs"
                  title="Open Camera Scanner"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-red-600 font-bold uppercase">Step 03</span>
                  <span className={isGeminiConfigured ? 'text-emerald-700 text-xs font-bold' : 'text-amber-700 text-xs font-bold'}>
                    {isGeminiConfigured ? 'AI Active' : 'API Key Setup'}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900">Gemini AI Vision Engine</div>
                <p className="text-xs text-slate-600">
                  Connect your Google Gemini API key for handwriting recognition and evaluation.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('settings')}
                className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-black text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>System Settings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-center gap-2">
            <button
              onClick={loadTemplateData}
              className="text-xs text-red-600 hover:text-red-700 font-semibold underline flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Or load standard Qmax engineering assessment template for instant demo</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 4 Operations Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* TOTAL */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between shadow-xs">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Candidates</div>
                <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">{total}</div>
                <div className="text-xs text-slate-500 mt-0.5">{pendingCount} pending</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* EVALUATED */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between shadow-xs">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Evaluated</div>
                <div className="text-2xl md:text-3xl font-extrabold text-emerald-700 mt-1">{evaluatedCount}</div>
                <div className="text-xs text-emerald-600 font-semibold mt-0.5">
                  {total > 0 ? Math.round((evaluatedCount / total) * 100) : 0}% processed
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckSquare className="w-5 h-5" />
              </div>
            </div>

            {/* HUMAN REVIEW */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between shadow-xs">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Review Required</div>
                <div className="text-2xl md:text-3xl font-extrabold text-amber-700 mt-1">{reviewCount}</div>
                <div className="text-xs text-amber-700 font-semibold mt-0.5">
                  {reviewCount > 0 ? 'Needs evaluator check' : 'All verified ✓'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            {/* QUALIFIED PASS RATE */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between shadow-xs">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Pass Rate</div>
                <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">{passRate}%</div>
                <div className="text-xs text-slate-500 mt-0.5">{passCount} qualified candidates</div>
              </div>
              <div className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-200">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Candidate Cohort Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Candidate Submissions Cohort
                </h3>
                <p className="text-xs text-slate-500">
                  Live status and results for all uploaded candidate answer sheets.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('candidates')}
                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-bold"
              >
                <span>View All In Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200 bg-slate-50 font-bold">
                    <th className="p-3">ID</th>
                    <th className="p-3">NAME</th>
                    <th className="p-3">SET</th>
                    <th className="p-3">ROLE</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3">SCORE</th>
                    <th className="p-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidates.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-bold text-slate-900 font-mono">{c.candidateId}</td>
                      <td className="p-3 font-semibold text-slate-900">{c.name}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-300 text-slate-800">
                          {(c.assignedSet || 'SET_A').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{c.appliedRole}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          c.status === 'REVIEW_REQUIRED'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : c.evaluationResult?.isPassed
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {c.evaluationResult ? (
                          <span className="font-bold text-slate-900">
                            {c.evaluationResult.totalMarksAwarded}/{c.evaluationResult.maxMarksPossible} ({c.evaluationResult.percentage}%)
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedCandidateId(c.id);
                            setActiveTab('results');
                          }}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-semibold transition"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
