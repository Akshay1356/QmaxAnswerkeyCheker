import React, { useState } from 'react';
import { 
  Check, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3, 
  ZoomIn, 
  ZoomOut
} from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';
import { CandidateSubmission, QuestionEvaluationResult } from '../../types';

export const AdminReviewWorkspace: React.FC = () => {
  const { 
    candidates, 
    overrideAnswer, 
    setActiveTab 
  } = useAssessment();

  // Find all questions needing review across all candidates
  const reviewItems: {
    candidate: CandidateSubmission;
    question: QuestionEvaluationResult;
    cropUrl: string;
  }[] = [];

  candidates.forEach(cand => {
    if (cand.evaluationResult) {
      cand.evaluationResult.questionResults.forEach(qr => {
        if (qr.verdict === 'REVIEW_REQUIRED' || qr.errorType === 'AMBIGUOUS_HANDWRITING' || qr.confidence < 85) {
          const region = cand.pages.flatMap(p => p.answerRegions).find(r => r.questionNumber === qr.questionNumber);
          reviewItems.push({
            candidate: cand,
            question: qr,
            cropUrl: region?.croppedImageUrl || qr.croppedImageUrl
          });
        }
      });
    }
  });

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [customOverrideText, setCustomOverrideText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const activeItem = reviewItems[selectedIdx] || null;

  const handleApplyVerdict = (verdict: 'CORRECT' | 'INCORRECT', overrideText?: string) => {
    if (!activeItem) return;

    const chosenText = overrideText || (verdict === 'CORRECT' ? activeItem.question.expectedAnswer : activeItem.question.candidateAnswer);
    overrideAnswer(activeItem.candidate.candidateId, activeItem.question.questionNumber, chosenText);
    
    setIsEditing(false);
    setCustomOverrideText('');

    if (selectedIdx < reviewItems.length - 1) {
      setSelectedIdx(selectedIdx + 1);
    } else {
      setSelectedIdx(0);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16 md:pb-10 font-sans text-xs">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-700 font-bold uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Admin Verification Workspace</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Uncertain Handwriting Review Queue
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Side-by-side verification of low-confidence handwriting crops against official answer key.
            </p>
          </div>

          <div className="px-3.5 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 font-bold text-xs">
            {reviewItems.length} Uncertain Responses Flagged
          </div>
        </div>
      </div>

      {reviewItems.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <div className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            All Handwritten Answers Verified
          </div>
          <p className="text-slate-500 text-xs max-w-md mx-auto">
            Every candidate response meets the minimum confidence threshold. Scores and Excel workbooks are 100% verified.
          </p>
          <button
            onClick={() => setActiveTab('results')}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold shadow-xs"
          >
            Go to Results Dashboard →
          </button>
        </div>
      ) : activeItem && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT: Candidate Queue List (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-[640px] shadow-xs">
            <div className="text-xs font-bold text-slate-900 uppercase pb-3 border-b border-slate-200 flex items-center justify-between">
              <span>Review Queue ({reviewItems.length})</span>
              <span className="text-[10px] text-slate-500 font-medium">Item {selectedIdx + 1} of {reviewItems.length}</span>
            </div>

            <div className="mt-3 flex-1 overflow-y-auto space-y-2.5 pr-1">
              {reviewItems.map((item, idx) => {
                const isSelected = selectedIdx === idx;
                return (
                  <button
                    key={`${item.candidate.id}-${item.question.questionNumber}`}
                    onClick={() => {
                      setSelectedIdx(idx);
                      setIsEditing(false);
                    }}
                    className={`w-full p-3.5 rounded-xl border text-left transition ${
                      isSelected 
                        ? 'bg-red-50/70 border-red-500 ring-1 ring-red-400 shadow-xs' 
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{item.candidate.name}</span>
                      <span className="text-xs text-red-600 font-bold font-mono">
                        Q{String(item.question.questionNumber).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                      <span>{item.candidate.candidateId} • OCR: {item.question.confidence}%</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-800 font-bold">
                        {(item.candidate.assignedSet || 'SET_A').replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-amber-800 font-medium truncate">
                      {item.question.reason || 'Uncertain character stroke'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Split-Screen Crop Verification & Decision Workspace (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4 shadow-xs">
            <div>
              {/* Question Header & Context */}
              <div className="pb-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-900 font-bold text-white text-xs font-mono">
                      Question {String(activeItem.question.questionNumber).padStart(2, '0')}
                    </span>
                    <span className="text-slate-900 font-bold text-sm">{activeItem.candidate.name}</span>
                    <span className="text-slate-500 text-xs font-mono">({activeItem.candidate.candidateId})</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 border border-red-200 text-red-700">
                      {(activeItem.candidate.assignedSet || 'SET_A').replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 mt-1.5 font-medium">
                    {activeItem.question.questionText}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Max Marks</div>
                  <div className="text-sm font-extrabold text-slate-900">{activeItem.question.maxMarks} PTS</div>
                </div>
              </div>

              {/* Scanned Handwriting Crop Box */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 font-bold uppercase">
                  <span>Original Handwritten Crop</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setZoomLevel(z => Math.max(0.8, z - 0.2))} className="p-1 rounded-md bg-white border border-slate-300 hover:bg-slate-100">
                      <ZoomOut className="w-3.5 h-3.5 text-slate-700" />
                    </button>
                    <span className="text-slate-800 font-mono">{Math.round(zoomLevel * 100)}%</span>
                    <button onClick={() => setZoomLevel(z => Math.min(2.5, z + 0.2))} className="p-1 rounded-md bg-white border border-slate-300 hover:bg-slate-100">
                      <ZoomIn className="w-3.5 h-3.5 text-slate-700" />
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white inline-block shadow-inner overflow-hidden border border-slate-300">
                  {activeItem.cropUrl ? (
                    <img
                      src={activeItem.cropUrl}
                      alt="Original crop"
                      style={{ transform: `scale(${zoomLevel})` }}
                      className="max-h-36 w-auto object-contain mx-auto transition-transform"
                    />
                  ) : (
                    <div className="w-48 h-28 flex items-center justify-center text-slate-400 text-xs">
                      No Crop Available
                    </div>
                  )}
                </div>
              </div>

              {/* Technical Comparison Grid: Reference vs Candidate vs AI Result */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Reference Answer */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Reference Answer</div>
                  <div className="text-base font-extrabold text-red-600 font-mono">{activeItem.question.expectedAnswer}</div>
                  <div className="text-[10px] text-slate-500">Single Source of Truth</div>
                </div>

                {/* Candidate Answer Detected */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Candidate Answer (Raw)</div>
                  <div className="text-base font-extrabold text-slate-900 font-mono">{activeItem.question.candidateAnswer}</div>
                  <div className="text-[10px] text-slate-500">Confidence: {activeItem.question.confidence}%</div>
                </div>

                {/* AI Diagnostic Verdict */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">AI Result</div>
                  <div className="text-base font-extrabold text-amber-700">{activeItem.question.verdict}</div>
                  <div className="text-[10px] text-slate-500 truncate">{activeItem.question.errorType}</div>
                </div>
              </div>

              {/* AI Justification */}
              <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <span className="text-slate-900 font-bold">Reason: </span>
                <span>{activeItem.question.reason || 'Pending admin confirmation'}</span>
              </div>

              {/* Custom Answer Edit Input */}
              {isEditing && (
                <div className="mt-3 p-4 rounded-xl bg-red-50 border border-red-200 space-y-2">
                  <label className="block text-xs text-red-800 font-bold uppercase">
                    Type Exact Candidate Handwritten Answer:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customOverrideText}
                      onChange={(e) => setCustomOverrideText(e.target.value)}
                      placeholder="e.g. 10 kΩ or 9.8 m/s²"
                      className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono text-xs focus:ring-1 focus:ring-red-500"
                    />
                    <button
                      onClick={() => handleApplyVerdict('CORRECT', customOverrideText)}
                      className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs"
                    >
                      Save Override
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Decision Buttons */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold flex items-center gap-1.5 shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-700" />
                <span>{isEditing ? 'Cancel Edit' : 'Edit Candidate Answer'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApplyVerdict('INCORRECT')}
                  className="px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 border border-red-300 text-red-800 font-bold transition flex items-center gap-1.5"
                >
                  <X className="w-4 h-4 stroke-[3]" />
                  <span>Mark Incorrect (0 PTS)</span>
                </button>

                <button
                  onClick={() => handleApplyVerdict('CORRECT')}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-2 shadow-xs"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Confirm & Award {activeItem.question.maxMarks} PTS</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
