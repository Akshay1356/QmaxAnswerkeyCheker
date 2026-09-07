import React, { useState } from 'react';
import { 
  CheckSquare, 
  Search, 
  Filter, 
  Download, 
  ArrowRight
} from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';
import { CandidateDetailWorkspace } from './CandidateDetailWorkspace';

export const ResultsWorkspace: React.FC = () => {
  const { 
    candidates, 
    answerKey, 
    selectedCandidateId, 
    setSelectedCandidateId, 
    exportToExcel 
  } = useAssessment();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASSED' | 'FAILED' | 'REVIEW'>('ALL');
  const [sortBy, setSortBy] = useState<'score' | 'id' | 'name'>('score');

  // If a candidate is selected, display their detail dual-panel workspace
  if (selectedCandidateId) {
    return (
      <CandidateDetailWorkspace 
        candidateId={selectedCandidateId} 
        onBack={() => setSelectedCandidateId(null)} 
      />
    );
  }

  const evaluatedCandidates = candidates.filter(c => c.evaluationResult);

  const filtered = evaluatedCandidates.filter(c => {
    const matchesSearch = 
      c.candidateId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.registrationNumber && c.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesStatus = true;
    if (statusFilter === 'PASSED') matchesStatus = !!c.evaluationResult?.isPassed;
    if (statusFilter === 'FAILED') matchesStatus = !c.evaluationResult?.isPassed;
    if (statusFilter === 'REVIEW') matchesStatus = c.status === 'REVIEW_REQUIRED';

    return matchesSearch && matchesStatus;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'score') {
      const scoreA = a.evaluationResult?.percentage || 0;
      const scoreB = b.evaluationResult?.percentage || 0;
      return scoreB - scoreA;
    }
    if (sortBy === 'id') {
      return a.candidateId.localeCompare(b.candidateId);
    }
    return a.name.localeCompare(b.name);
  });

  const totalEvaluated = evaluatedCandidates.length;
  const passCount = evaluatedCandidates.filter(c => c.evaluationResult?.isPassed).length;
  const passRate = totalEvaluated > 0 ? Math.round((passCount / totalEvaluated) * 100) : 0;
  const scores = evaluatedCandidates.map(c => c.evaluationResult?.percentage || 0);
  const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0';
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16 md:pb-10 font-sans text-xs">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-red-600 font-bold uppercase tracking-wider">
              Assessment Results Ledger
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Candidate Evaluation Results
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Verified Master Reference: <strong className="text-slate-900 font-semibold">{answerKey.title}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportToExcel}
              disabled={evaluatedCandidates.length === 0}
              className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition flex items-center gap-2 shadow-xs disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
              <span>Generate Consolidated Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Total Evaluated</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalEvaluated} / {candidates.length}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Cohort Mean</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{avgScore}%</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Highest Score</div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1">{highestScore}%</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Pass Ratio</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{passRate}% ({passCount} Pass)</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name or ID..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-end">
          <span className="text-slate-500 text-xs font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {(['ALL', 'PASSED', 'FAILED', 'REVIEW'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                statusFilter === filter
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* DESKTOP RESULTS TABLE */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-36">Candidate ID</th>
                <th className="py-3.5 px-4">Candidate Name</th>
                <th className="py-3.5 px-4 w-28 text-center">Set</th>
                <th className="py-3.5 px-4 w-28 text-center">Total Marks</th>
                <th className="py-3.5 px-4 w-24 text-center">Percentage</th>
                <th className="py-3.5 px-4 w-28 text-center text-emerald-700">Correct</th>
                <th className="py-3.5 px-4 w-28 text-center text-red-600">Incorrect</th>
                <th className="py-3.5 px-4 w-32 text-center">Status</th>
                <th className="py-3.5 px-4 w-28 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    {evaluatedCandidates.length === 0 ? 'No candidates evaluated yet.' : 'No matching results found.'}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const res = c.evaluationResult!;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCandidateId(c.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">{c.candidateId}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{c.registrationNumber}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-800">
                          {(c.assignedSet || 'SET_A').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                        {res.totalMarksAwarded} / {res.maxMarksPossible}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        <span className={res.isPassed ? 'text-emerald-700 font-extrabold' : 'text-red-600 font-extrabold'}>
                          {res.percentage}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-emerald-700 font-bold">{res.correctCount}</td>
                      <td className="py-3.5 px-4 text-center text-red-600 font-bold">{res.incorrectCount}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                          res.isPassed 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {res.isPassed ? 'COMPLETED (PASS)' : 'FAILED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCandidateId(c.id);
                          }}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition"
                        >
                          View Sheet →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CANDIDATE RESULT CARDS */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-500 shadow-xs">
            No evaluated results available.
          </div>
        ) : (
          filtered.map((c) => {
            const res = c.evaluationResult!;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCandidateId(c.id)}
                className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 active:border-red-500 shadow-xs transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-slate-900 font-bold text-sm">{c.name}</div>
                    <div className="text-slate-500 text-xs font-mono">{c.candidateId}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    res.isPassed ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {res.isPassed ? 'COMPLETED' : 'FAILED'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 text-xs text-center border border-slate-200">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Score</div>
                    <div className="font-bold text-slate-900">{res.totalMarksAwarded}/{res.maxMarksPossible}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Percent</div>
                    <div className={`font-bold ${res.isPassed ? 'text-emerald-700' : 'text-red-600'}`}>{res.percentage}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Correct</div>
                    <div className="font-bold text-emerald-700">{res.correctCount} / {res.totalQuestions}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-red-600 font-bold pt-1">
                  <span>View Full Scanned Analysis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
