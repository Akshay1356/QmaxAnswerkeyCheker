import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  Edit3
} from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';

interface CandidateDetailWorkspaceProps {
  candidateId: string;
  onBack: () => void;
}

export const CandidateDetailWorkspace: React.FC<CandidateDetailWorkspaceProps> = ({
  candidateId,
  onBack
}) => {
  const { candidates, overrideAnswer } = useAssessment();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeHighlightQNum, setActiveHighlightQNum] = useState<number | null>(null);
  const [editingQNum, setEditingQNum] = useState<number | null>(null);
  const [overrideInput, setOverrideInput] = useState('');

  const candidate = candidates.find(c => c.id === candidateId || c.candidateId === candidateId);
  if (!candidate) return <div className="p-8 text-center text-slate-500 font-sans">Candidate record not found.</div>;

  const res = candidate.evaluationResult;
  const activePage = candidate.pages[currentPageIndex] || candidate.pages[0];

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(2.5, Math.max(0.6, Number((prev + delta).toFixed(2)))));
  };

  const handleSaveOverride = (qNum: number) => {
    if (!overrideInput.trim()) return;
    overrideAnswer(candidate.candidateId, qNum, overrideInput.trim());
    setEditingQNum(null);
    setOverrideInput('');
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16 md:pb-10 font-sans text-xs">
      {/* Top Banner & Metadata Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition"
              title="Back to results list"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-900 text-sm font-mono">{candidate.candidateId}</span>
                <span className="text-slate-900 text-base font-extrabold">{candidate.name}</span>
                <span className="text-slate-500 text-xs font-mono">({candidate.registrationNumber})</span>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold border bg-red-50 border-red-200 text-red-700">
                  {(candidate.assignedSet || 'SET_A').replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Role: {candidate.appliedRole} • Batch: {candidate.batchCode || 'QMAX-TECH-2026'}
              </p>
            </div>
          </div>

          {/* Score & Evaluation Badges */}
          {res && (
            <div className="flex items-center gap-4 bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-center pr-4 border-r border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Final Score</div>
                <div className={`text-lg font-extrabold ${res.isPassed ? 'text-emerald-700' : 'text-red-600'}`}>
                  {res.totalMarksAwarded} / {res.maxMarksPossible} ({res.percentage}%)
                </div>
              </div>

              <div className="text-center text-xs">
                <span className="text-emerald-700 font-bold">{res.correctCount} Correct</span>
                <span className="text-slate-300 mx-2">•</span>
                <span className="text-red-600 font-bold">{res.incorrectCount} Incorrect</span>
                {res.reviewRequiredCount > 0 && (
                  <>
                    <span className="text-slate-300 mx-2">•</span>
                    <span className="text-amber-700 font-bold">{res.reviewRequiredCount} Review</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Two-Panel Layout (Desktop: 12 Cols | Mobile: Stacked) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT PANEL: Handwritten Document Viewer (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-[740px] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase">
              <Layers className="w-4 h-4 text-red-600" />
              <span>Handwritten Sheet (Page {currentPageIndex + 1}/{candidate.pages.length})</span>
            </div>

            <div className="flex items-center gap-2">
              {candidate.pages.length > 1 && (
                <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-300">
                  <button
                    disabled={currentPageIndex === 0}
                    onClick={() => setCurrentPageIndex(p => p - 1)}
                    className="p-0.5 hover:text-slate-900 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs px-1 font-bold">P{currentPageIndex + 1}</span>
                  <button
                    disabled={currentPageIndex === candidate.pages.length - 1}
                    onClick={() => setCurrentPageIndex(p => p + 1)}
                    className="p-0.5 hover:text-slate-900 disabled:opacity-30"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-300">
                <button onClick={() => handleZoom(-0.15)} className="p-0.5 hover:text-slate-900">
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs px-1 font-mono">{Math.round(zoomLevel * 100)}%</span>
                <button onClick={() => handleZoom(0.15)} className="p-0.5 hover:text-slate-900">
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setZoomLevel(1)} className="p-0.5 hover:text-slate-900 text-slate-500">
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Canvas Viewport */}
          <div className="mt-3 flex-1 bg-slate-900 rounded-xl border border-slate-300 relative overflow-auto p-4 flex items-start justify-center">
            <div 
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center', transition: 'transform 0.1s ease' }}
              className="relative shadow-2xl rounded overflow-hidden"
            >
              <img
                src={activePage.originalImageUrl}
                alt={`Candidate Sheet Page ${activePage.pageNumber}`}
                className="max-w-none w-[680px] h-auto block select-none bg-white"
              />

              {/* Bounding box overlays */}
              {activePage.answerRegions.map(reg => {
                const isHighlighted = activeHighlightQNum === reg.questionNumber;
                const scale = 680 / 1240;
                const left = reg.bbox.x * scale;
                const top = reg.bbox.y * scale;
                const width = reg.bbox.width * scale;
                const height = reg.bbox.height * scale;

                return (
                  <div
                    key={reg.questionNumber}
                    onClick={() => setActiveHighlightQNum(reg.questionNumber)}
                    style={{ left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` }}
                    className={`absolute cursor-pointer transition-all rounded ${
                      isHighlighted 
                        ? 'ring-2 ring-red-600 bg-red-600/25 z-20' 
                        : reg.status === 'REVIEW' || reg.status === 'UNREADABLE'
                        ? 'border border-amber-500 bg-amber-500/20'
                        : 'border border-blue-600/60 bg-blue-500/10 hover:bg-blue-500/20'
                    }`}
                    title={`Q${reg.questionNumber}: ${reg.normalizedAnswer} - Click to inspect`}
                  >
                    <span className="absolute -top-3.5 left-0 text-[9px] font-bold font-mono px-1 rounded bg-slate-900 text-white shadow-xs">
                      Q{reg.questionNumber}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Question-by-Question Analysis (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-[740px] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="font-bold text-slate-900 uppercase text-xs">
              Itemized Evaluation Breakdown
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {res?.questionResults.length || 0} Questions Evaluated
            </span>
          </div>

          <div className="mt-3 flex-1 overflow-y-auto space-y-3 pr-1">
            {res?.questionResults.map((q) => {
              const isHighlighted = activeHighlightQNum === q.questionNumber;
              const isEditing = editingQNum === q.questionNumber;

              return (
                <div
                  key={q.questionNumber}
                  onMouseEnter={() => setActiveHighlightQNum(q.questionNumber)}
                  className={`p-3.5 rounded-xl border transition ${
                    isHighlighted 
                      ? 'bg-red-50/70 border-red-400 ring-1 ring-red-400 shadow-2xs' 
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono text-xs">
                        Q{String(q.questionNumber).padStart(2, '0')}
                      </span>
                      <span className="text-slate-900 text-xs font-semibold line-clamp-1">
                        {q.questionText}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${
                      q.verdict === 'CORRECT' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                      q.verdict === 'PARTIALLY_CORRECT' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                      q.verdict === 'REVIEW_REQUIRED' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {q.verdict} ({q.marksAwarded}/{q.maxMarks} PTS)
                    </span>
                  </div>

                  {/* Expected vs Candidate Answer Comparison */}
                  <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs pt-2.5 border-t border-slate-200">
                    <div>
                      <span className="text-slate-500">Expected: </span>
                      <strong className="text-red-600 font-bold font-mono">{q.expectedAnswer}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Candidate: </span>
                      <strong className="text-slate-900 font-bold font-mono">{q.candidateAnswer}</strong>
                    </div>
                  </div>

                  {/* Justification Note */}
                  {q.reason && (
                    <div className="mt-2 text-xs text-slate-600">
                      <span className="text-slate-900 font-bold">Reason: </span>
                      <span>{q.reason}</span>
                    </div>
                  )}

                  {/* Manual Override Action */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      OCR Confidence: {q.confidence}%
                    </span>

                    {!isEditing ? (
                      <button
                        onClick={() => {
                          setEditingQNum(q.questionNumber);
                          setOverrideInput(q.candidateAnswer);
                        }}
                        className="text-red-600 hover:text-red-700 text-xs font-semibold flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Override</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={overrideInput}
                          onChange={(e) => setOverrideInput(e.target.value)}
                          className="px-2 py-1 rounded-md bg-white border border-slate-300 text-slate-900 text-xs w-32 focus:ring-1 focus:ring-red-500"
                        />
                        <button
                          onClick={() => handleSaveOverride(q.questionNumber)}
                          className="px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-2xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingQNum(null)}
                          className="text-slate-500 hover:text-slate-800 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
