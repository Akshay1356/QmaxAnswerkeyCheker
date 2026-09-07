import React, { useState } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Lock, 
  Unlock, 
  Edit3, 
  Check, 
  RefreshCw,
  Sparkles,
  Plus,
  Layers
} from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';
import { AnswerKeyQuestion } from '../../types';

export const AnswerKeyWorkspace: React.FC = () => {
  const { 
    answerKey, 
    updateAnswerKey, 
    confirmVerifyAnswerKey, 
    extractAnswerKeyFromFile,
    loadTemplateData,
    isProcessingUpload,
    showNotification
  } = useAssessment();

  const [selectedSetTab, setSelectedSetTab] = useState<string>('SET_A');
  const [editingQNum, setEditingQNum] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<AnswerKeyQuestion>>({});
  const [verifierName, setVerifierName] = useState(answerKey.verifiedBy || 'S. Natesan (Lead Evaluator)');

  const availableSets = answerKey.sets && answerKey.sets.length > 0 ? answerKey.sets : ['SET_A', 'SET_B', 'SET_C'];

  // Filter questions for current active set
  const filteredQuestions = answerKey.questions.filter(q => {
    const qSet = q.questionSet || 'SET_A';
    return qSet === selectedSetTab || qSet === 'ALL';
  });

  const handleFileUpload = async (file: File) => {
    await extractAnswerKeyFromFile(file);
  };

  const handleStartEdit = (q: AnswerKeyQuestion) => {
    setEditingQNum(q.questionNumber);
    setEditFormData({ ...q });
  };

  const handleSaveEdit = (questionNumber: number) => {
    updateAnswerKey({
      ...answerKey,
      questions: answerKey.questions.map(q => {
        if (q.questionNumber === questionNumber && (q.questionSet === selectedSetTab || !q.questionSet)) {
          return { ...q, ...editFormData, questionSet: selectedSetTab };
        }
        return q;
      })
    });
    setEditingQNum(null);
    showNotification(`Question Q${questionNumber} in [${selectedSetTab}] updated`, 'success');
  };

  const handleAddNewQuestion = () => {
    const currentMax = filteredQuestions.reduce((max, q) => Math.max(max, q.questionNumber), 0);
    const nextNum = currentMax + 1;
    const newQ: AnswerKeyQuestion = {
      id: Date.now(),
      questionNumber: nextNum,
      questionSet: selectedSetTab,
      questionText: `Technical Problem ${nextNum}`,
      expectedAnswer: '',
      unit: '',
      tolerancePercent: 2.0,
      maxMarks: 1,
      topic: 'Engineering Core',
      confidence: 100,
      status: 'CONFIDENT',
      notes: ''
    };

    updateAnswerKey({
      ...answerKey,
      totalQuestions: Math.max(answerKey.totalQuestions, nextNum),
      questions: [...answerKey.questions, newQ]
    });
    setEditingQNum(nextNum);
    setEditFormData(newQ);
    showNotification(`Added Question Q${nextNum} to [${selectedSetTab}]`, 'info');
  };

  const handleLockKey = () => {
    confirmVerifyAnswerKey(verifierName);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16 md:pb-10 font-sans text-xs">
      {/* Top Banner & Multi-Set Workflow Indicator */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="text-xs text-red-600 font-bold uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-red-600" />
              <span>Multi-Set Master Rubric Engine (Sets A, B, C)</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Answer Key Verification Workspace
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Official answer key marking schemes for all 3 Question Paper Sets across 20 technical problems.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {answerKey.isVerified ? (
              <div className="px-3.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-2xs">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Verified Master Single Source of Truth</span>
              </div>
            ) : (
              <div className="px-3.5 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold flex items-center gap-2">
                <Unlock className="w-3.5 h-3.5 text-amber-700" />
                <span>{answerKey.questions.length > 0 ? 'Verification Pending' : 'Awaiting Document Upload'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Question Sets Switcher Tabs */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-red-600" />
              <span>Question Paper Sets:</span>
            </span>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
              {availableSets.map(setKey => {
                const count = answerKey.questions.filter(q => (q.questionSet || 'SET_A') === setKey || q.questionSet === 'ALL').length;
                const isActive = selectedSetTab === setKey;
                return (
                  <button
                    key={setKey}
                    onClick={() => {
                      setSelectedSetTab(setKey);
                      setEditingQNum(null);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      isActive 
                        ? 'bg-red-600 text-white shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <span>{setKey.replace('_', ' ')}</span>
                    <span className="text-[10px] opacity-90">({count} Q)</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-xs text-slate-600 font-medium">
            Total Ingested: <strong className="text-slate-900 font-bold">{answerKey.questions.length}</strong> questions across all sets
          </div>
        </div>
      </div>

      {/* Extraction Processing State Overlay */}
      {isProcessingUpload && (
        <div className="bg-white border border-red-200 rounded-xl p-6 text-center space-y-4 shadow-sm animate-in fade-in">
          <RefreshCw className="w-8 h-8 text-red-600 animate-spin mx-auto" />
          <div className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Gemini Multimodal AI Extracting Answer Key for All Sets (A, B, C)
          </div>
          <div className="max-w-md mx-auto space-y-1 text-xs text-slate-600 text-left bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="text-emerald-700 font-semibold">✓ Document Page Rendering (1.8x DPI)</div>
            <div className="text-emerald-700 font-semibold">✓ Transmitting to Google Gemini Vision</div>
            <div className="text-red-600 font-bold">▶ Extracting 20 Questions per set (Set A, Set B, Set C)...</div>
            <div className="text-slate-500">○ Structuring multi-set evaluation rubrics</div>
          </div>
        </div>
      )}

      {/* Main Split-Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT: Upload Box & Document Details (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 flex flex-col min-h-[640px] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <FileText className="w-4 h-4 text-red-600" />
              <span>Official Answer Key Document</span>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {answerKey.fileName || 'No file selected'}
            </span>
          </div>

          {/* Upload Dropzone Header */}
          <div className="mt-4 p-5 rounded-xl bg-slate-50 border-2 border-dashed border-slate-300 hover:border-red-400 text-center space-y-2 transition">
            <label className="cursor-pointer block space-y-2">
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                }}
              />
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center border border-red-200">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="text-red-600 font-bold text-xs hover:underline flex items-center justify-center gap-1.5">
                <span>Upload Master Answer Key (.PDF / JPG)</span>
              </div>
              <div className="text-[11px] text-slate-500 leading-relaxed">
                Gemini Multimodal AI parses all 3 Question Paper Sets (Set A, Set B, Set C) and extracts all 20 questions automatically.
              </div>
            </label>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={loadTemplateData}
                className="text-xs text-slate-600 hover:text-red-600 font-semibold underline flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Or load standard QMAX 20-question 3-set template</span>
              </button>
            </div>
          </div>

          {/* Document Summary / Question List Preview */}
          <div className="mt-4 flex-1 bg-slate-50 rounded-xl border border-slate-200 p-4 overflow-y-auto space-y-2 max-h-[460px]">
            {filteredQuestions.length > 0 ? (
              <div className="bg-white text-slate-900 p-4 rounded-lg text-xs shadow-xs space-y-3 border border-slate-200 select-none">
                <div className="border-b border-slate-200 pb-2 text-center">
                  <div className="font-extrabold text-xs tracking-wide text-slate-900">QMAX SYSTEMS ENGINEERING</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">{answerKey.title}</div>
                  <div className="text-[10px] mt-0.5 text-red-600 font-bold">
                    [ Active View: {selectedSetTab.replace('_', ' ')} • 20 Questions ]
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  {filteredQuestions.map((q) => (
                    <div key={`${q.questionSet}-${q.questionNumber}`} className="border-b border-slate-100 pb-1.5 flex items-start justify-between gap-2">
                      <div className="truncate">
                        <span className="font-bold text-slate-900">Q{q.questionNumber}:</span>{' '}
                        <span className="text-slate-700">{q.questionText}</span>
                      </div>
                      <div className="text-red-600 font-bold shrink-0 font-mono">
                        {q.expectedAnswer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-2">
                <FileText className="w-8 h-8 text-slate-400" />
                <div className="text-slate-700 font-bold">No Questions for {selectedSetTab}</div>
                <div className="text-xs text-slate-500">
                  Upload an Answer Key document or click "Load standard template" to populate all 3 sets.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Extracted Question Matrix & Editor (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 flex flex-col min-h-[640px] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <div className="font-bold text-slate-900 text-sm uppercase flex items-center gap-2">
                <span>{selectedSetTab.replace('_', ' ')} Question Matrix</span>
                <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 text-xs font-bold">
                  {filteredQuestions.length} Questions
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Marking rubric for candidates assigned {selectedSetTab.replace('_', ' ')}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddNewQuestion}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1 border border-slate-300 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>

              <button
                onClick={handleLockKey}
                disabled={answerKey.questions.length === 0}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-40 ${
                  answerKey.isVerified 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{answerKey.isVerified ? 'Verified & Locked ✓' : 'Lock Answer Key →'}</span>
              </button>
            </div>
          </div>

          {/* Itemized Questions Scroll Area */}
          <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1 max-h-[560px]">
            {filteredQuestions.map((q) => {
              const isEditing = editingQNum === q.questionNumber;

              return (
                <div
                  key={`${q.questionSet}-${q.questionNumber}`}
                  className={`p-4 rounded-xl border transition ${
                    isEditing 
                      ? 'bg-red-50/50 border-red-400 ring-1 ring-red-400' 
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 font-bold text-white text-xs font-mono">
                        Q{String(q.questionNumber).padStart(2, '0')}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {q.questionText}
                      </span>
                    </div>

                    {!isEditing ? (
                      <button
                        onClick={() => handleStartEdit(q)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition"
                        title="Edit question parameters"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSaveEdit(q.questionNumber)}
                        className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs"
                      >
                        Save
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                      <div>
                        <label className="text-[10px] text-slate-600 font-bold uppercase">Question Statement</label>
                        <input
                          type="text"
                          value={editFormData.questionText || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, questionText: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:ring-1 focus:ring-red-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-600 font-bold uppercase">Expected Answer</label>
                          <input
                            type="text"
                            value={editFormData.expectedAnswer || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, expectedAnswer: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-red-600 font-bold text-xs focus:ring-1 focus:ring-red-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-600 font-bold uppercase">Tolerance (± %)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={editFormData.tolerancePercent ?? 2.0}
                            onChange={(e) => setEditFormData({ ...editFormData, tolerancePercent: parseFloat(e.target.value) || 2 })}
                            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:ring-1 focus:ring-red-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-600 font-bold uppercase">Max Marks</label>
                          <input
                            type="number"
                            value={editFormData.maxMarks || 1}
                            onChange={(e) => setEditFormData({ ...editFormData, maxMarks: parseInt(e.target.value) || 1 })}
                            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:ring-1 focus:ring-red-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      <div>Expected: <strong className="text-red-600 font-extrabold font-mono">{q.expectedAnswer}</strong></div>
                      <div>Tolerance: <strong className="text-slate-800">±{q.tolerancePercent || 2}%</strong></div>
                      <div>Max Marks: <strong className="text-slate-800">{q.maxMarks}</strong></div>
                      <div>Set: <strong className="text-slate-800 font-bold">{(q.questionSet || selectedSetTab).replace('_', ' ')}</strong></div>
                      <div>Topic: <strong className="text-slate-700">{q.topic}</strong></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
