import React from 'react';
import { Play, Download, Plus, ArrowRight } from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';

export const EvaluationsListWorkspace: React.FC = () => {
  const { answerKey, candidates, setActiveTab, exportToExcel } = useAssessment();
  const evaluatedCount = candidates.filter(c => c.evaluationResult).length;

  const evaluationBatches = [
    {
      code: 'QMAX-TECH-2026',
      title: answerKey.title,
      department: 'Embedded Hardware & Firmware',
      totalCandidates: candidates.length,
      evaluatedCandidates: evaluatedCount,
      status: evaluatedCount === candidates.length && candidates.length > 0 ? 'COMPLETED' : 'ACTIVE',
      lastActive: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      passRate: evaluatedCount > 0 
        ? Math.round((candidates.filter(c => c.evaluationResult?.isPassed).length / evaluatedCount) * 100) 
        : 0
    },
    {
      code: 'QMAX-FPGA-2026',
      title: 'FPGA Architecture & High-Speed Digital Verification',
      department: 'Digital Systems R&D',
      totalCandidates: 34,
      evaluatedCandidates: 34,
      status: 'ARCHIVED',
      lastActive: '2 days ago',
      passRate: 76
    },
    {
      code: 'QMAX-PCB-2026',
      title: 'High-Density Interconnect (HDI) PCB Design Assessment',
      department: 'Hardware CAD & Layout',
      totalCandidates: 28,
      evaluatedCandidates: 28,
      status: 'ARCHIVED',
      lastActive: 'Last week',
      passRate: 82
    }
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16 md:pb-10 font-sans text-xs">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-red-600 font-bold uppercase tracking-wider">
              Batch Management Console
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Assessment Evaluation Batches
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Active and archived technical candidate assessment batches across Qmax engineering departments.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('answer_key')}
            className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Batch</span>
          </button>
        </div>
      </div>

      {/* Batches Grid */}
      <div className="space-y-3">
        {evaluationBatches.map((batch) => {
          const isActive = batch.code === 'QMAX-TECH-2026';
          return (
            <div
              key={batch.code}
              className={`p-5 rounded-xl border transition shadow-xs ${
                isActive 
                  ? 'bg-white border-red-300 ring-1 ring-red-200' 
                  : 'bg-white border-slate-200 opacity-90'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-slate-900 font-mono text-xs">{batch.code}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                      batch.status === 'ACTIVE' 
                        ? 'bg-red-50 text-red-700 border-red-200' 
                        : batch.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {batch.status}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">• {batch.department}</span>
                  </div>
                  <div className="text-slate-900 font-bold text-sm">
                    {batch.title}
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-5 text-xs">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Progress</div>
                    <div className="text-slate-900 font-bold">
                      {batch.evaluatedCandidates} / {batch.totalCandidates} ({batch.passRate}% Pass)
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <button
                        onClick={() => setActiveTab('evaluation')}
                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                      >
                        <span>Open Console</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={exportToExcel}
                        className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-700" />
                        <span>Export</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
