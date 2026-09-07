import React, { useState } from 'react';
import { 
  Users, 
  Camera, 
  UploadCloud, 
  Search, 
  Filter, 
  Trash2, 
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';
import { BatchUploadModal } from './BatchUploadModal';

interface CandidateWorkspaceProps {
  onOpenScanner: () => void;
}

export const CandidateWorkspace: React.FC<CandidateWorkspaceProps> = ({ onOpenScanner }) => {
  const { 
    candidates, 
    deleteCandidate, 
    updateCandidateInfo,
    setSelectedCandidateId, 
    setActiveTab, 
    answerKey 
  } = useAssessment();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'READY' | 'REVIEW_REQUIRED' | 'EVALUATED'>('ALL');
  const [setFilter, setSetFilter] = useState<string>('ALL');
  const [showBatchModal, setShowBatchModal] = useState(false);

  const availableSets = answerKey.sets && answerKey.sets.length > 0 ? answerKey.sets : ['SET_A', 'SET_B', 'SET_C'];

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = 
      c.candidateId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.registrationNumber && c.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesSet = setFilter === 'ALL' || (c.assignedSet || 'SET_A') === setFilter;
    return matchesSearch && matchesStatus && matchesSet;
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16 md:pb-10 font-sans text-xs">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-red-600 font-bold uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-red-600" />
              <span>Multi-Set Candidate Repository (Sets A, B, C)</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Candidate Submissions Workspace
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              {candidates.length} candidate answer sheets ingested with automatic Set detection (Set A / Set B / Set C).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenScanner}
              className="px-4 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold transition flex items-center gap-2 shadow-2xs"
            >
              <Camera className="w-4 h-4 text-red-600" />
              <span>Scan With Camera</span>
            </button>

            <button
              onClick={() => setShowBatchModal(true)}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Batch Upload (.PDF / JPG)</span>
            </button>
          </div>
        </div>

        {/* Status & Sets Filter Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 text-xs">
          <div className="flex items-center gap-3">
            <div className="text-slate-500">Total: <strong className="text-slate-900">{candidates.length}</strong></div>
            <span className="text-slate-300">•</span>
            <div className="text-slate-500">Evaluated: <strong className="text-emerald-700">{candidates.filter(c => c.evaluationResult).length}</strong></div>
            <span className="text-slate-300">•</span>
            <div className="text-slate-500">Review Required: <strong className="text-amber-700">{candidates.filter(c => c.status === 'REVIEW_REQUIRED').length}</strong></div>
          </div>

          {/* Set Filter Pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-xs font-semibold">Filter Set:</span>
            <button
              onClick={() => setSetFilter('ALL')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${setFilter === 'ALL' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              ALL
            </button>
            {availableSets.map(s => (
              <button
                key={s}
                onClick={() => setSetFilter(s)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${setFilter === s ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name, ID, or reg..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-end">
          <span className="text-slate-500 text-xs font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {(['ALL', 'READY', 'REVIEW_REQUIRED', 'EVALUATED'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                statusFilter === filter
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {filter.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-36">Candidate ID</th>
                <th className="py-3.5 px-4">Candidate Name</th>
                <th className="py-3.5 px-4 w-32 text-center">Assigned Set</th>
                <th className="py-3.5 px-4 w-36">Role</th>
                <th className="py-3.5 px-4 w-20 text-center">Pages</th>
                <th className="py-3.5 px-4 w-36 text-center">Status</th>
                <th className="py-3.5 px-4 w-36 text-center">Score (20 Q)</th>
                <th className="py-3.5 px-4 w-20 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500 space-y-3">
                    <Users className="w-8 h-8 text-slate-400 mx-auto" />
                    <div className="text-slate-800 font-bold text-sm">No Candidate Submissions Ingested</div>
                    <div className="text-xs text-slate-500 max-w-sm mx-auto">
                      Click "Batch Upload" or "Scan With Camera" to upload handwritten candidate answer sheets.
                    </div>
                    <button
                      onClick={() => setShowBatchModal(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload Candidate Sheets</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((c) => {
                  const res = c.evaluationResult;
                  const setTag = c.assignedSet || 'SET_A';
                  return (
                    <tr 
                      key={c.id} 
                      onClick={() => {
                        setSelectedCandidateId(c.id);
                        setActiveTab('results');
                      }}
                      className="hover:bg-slate-50/80 cursor-pointer transition"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">{c.candidateId}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{c.registrationNumber}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <select
                          value={setTag}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateCandidateInfo(c.id, { assignedSet: e.target.value });
                          }}
                          className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-300 text-slate-900 font-bold text-xs cursor-pointer focus:ring-1 focus:ring-red-500"
                        >
                          {availableSets.map(s => (
                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{c.appliedRole}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold font-mono">
                          {c.pages.length} P
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                          c.status === 'EVALUATED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          c.status === 'REVIEW_REQUIRED' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {c.status === 'REVIEW_REQUIRED' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                          {c.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        {res ? (
                          <span className={res.isPassed ? 'text-emerald-700' : 'text-red-600'}>
                            {res.totalMarksAwarded}/{res.maxMarksPossible} ({res.percentage}%)
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">Pending</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCandidate(c.id);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 transition"
                          title="Delete candidate record"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden space-y-3">
        {filteredCandidates.length === 0 ? (
          <div className="p-8 rounded-xl bg-white border border-slate-200 text-center text-slate-500 space-y-3 shadow-xs">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-slate-800 font-bold">No Candidate Submissions</div>
            <button
              onClick={() => setShowBatchModal(true)}
              className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold text-xs"
            >
              Upload Candidate Sheets
            </button>
          </div>
        ) : (
          filteredCandidates.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                setSelectedCandidateId(c.id);
                setActiveTab('results');
              }}
              className="p-4 rounded-xl bg-white border border-slate-200 active:border-red-500 space-y-2.5 shadow-xs transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 font-mono">{c.candidateId}</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[10px] border border-slate-200">
                    {(c.assignedSet || 'SET_A').replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    c.status === 'EVALUATED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    c.status === 'REVIEW_REQUIRED' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                    'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {c.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">{c.name}</div>
                <div className="text-xs text-slate-500">{c.registrationNumber} • {c.appliedRole}</div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">{c.pages.length} Pages</span>
                <span className="font-bold text-slate-900">
                  {c.evaluationResult 
                    ? `${c.evaluationResult.totalMarksAwarded}/${c.evaluationResult.maxMarksPossible} (${c.evaluationResult.percentage}%)` 
                    : 'Pending Evaluation'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Batch Upload Modal */}
      {showBatchModal && (
        <BatchUploadModal onClose={() => setShowBatchModal(false)} />
      )}
    </div>
  );
};
