import React from 'react';
import { 
  BarChart3, 
  Download
} from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';

export const ReportsWorkspace: React.FC = () => {
  const { candidates, answerKey, exportToExcel } = useAssessment();
  const evaluated = candidates.filter(c => c.evaluationResult);
  const totalEvaluated = evaluated.length || 1;

  const itemStats = answerKey.questions.map(q => {
    let correct = 0;
    let partial = 0;
    let incorrect = 0;
    let unanswered = 0;
    let totalMarks = 0;

    evaluated.forEach(cand => {
      const qr = cand.evaluationResult?.questionResults.find(r => r.questionNumber === q.questionNumber);
      if (qr) {
        if (qr.verdict === 'CORRECT') correct++;
        else if (qr.verdict === 'PARTIALLY_CORRECT') partial++;
        else if (qr.errorType === 'UNANSWERED') unanswered++;
        else incorrect++;

        totalMarks += qr.marksAwarded;
      }
    });

    const accuracy = Number(((correct / totalEvaluated) * 100).toFixed(1));
    let difficulty: 'EASY' | 'MODERATE' | 'HARD' = 'MODERATE';
    if (accuracy >= 80) difficulty = 'EASY';
    else if (accuracy <= 45) difficulty = 'HARD';

    return {
      qNum: q.questionNumber,
      set: q.questionSet || 'SET_A',
      topic: q.topic,
      expected: q.expectedAnswer,
      maxMarks: q.maxMarks,
      correct,
      partial,
      incorrect,
      unanswered,
      accuracy,
      difficulty
    };
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16 md:pb-10 font-sans text-xs">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-red-600 font-bold uppercase tracking-wider">
              Psychometric & Item Analytics
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Item Response & Accuracy Reports
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Cohort response distribution across {evaluated.length} candidate assessments.
            </p>
          </div>

          <button
            onClick={exportToExcel}
            disabled={evaluated.length === 0}
            className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition flex items-center gap-2 shadow-xs disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            <span>Export Full Workbook (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Item Difficulty Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="font-bold text-slate-900 uppercase text-xs">
            Question Difficulty Index
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {answerKey.totalQuestions} Questions Analyzed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-20 text-center">Item</th>
                <th className="py-3.5 px-4 w-24 text-center">Set</th>
                <th className="py-3.5 px-4">Topic / Syllabus Concept</th>
                <th className="py-3.5 px-4 w-28 text-center">Expected</th>
                <th className="py-3.5 px-4 w-24 text-center text-emerald-700">Correct</th>
                <th className="py-3.5 px-4 w-24 text-center text-red-600">Incorrect</th>
                <th className="py-3.5 px-4 w-28 text-center">Accuracy</th>
                <th className="py-3.5 px-4 w-28 text-center">Difficulty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itemStats.map((item, idx) => (
                <tr key={`${item.set}-${item.qNum}-${idx}`} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 text-center font-bold text-slate-900 font-mono">
                    Q{String(item.qNum).padStart(2, '0')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-800">
                      {item.set.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 font-semibold">
                    {item.topic}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-red-600 font-mono">
                    {item.expected}
                  </td>
                  <td className="py-3.5 px-4 text-center text-emerald-700 font-bold">
                    {item.correct}
                  </td>
                  <td className="py-3.5 px-4 text-center text-red-600 font-bold">
                    {item.incorrect}
                  </td>
                  <td className="py-3.5 px-4 text-center font-extrabold text-slate-900">
                    {item.accuracy}%
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                      item.difficulty === 'EASY' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                      item.difficulty === 'HARD' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {item.difficulty}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
