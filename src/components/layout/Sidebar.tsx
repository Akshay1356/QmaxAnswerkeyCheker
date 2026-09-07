import React from 'react';
import { 
  LayoutDashboard, 
  KeyRound, 
  Users, 
  Cpu, 
  CheckSquare, 
  BarChart3, 
  Settings, 
  AlertCircle
} from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';
import { NavigationTab } from '../../types';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, answerKey, candidates } = useAssessment();

  const reviewCount = candidates.filter(c => c.status === 'REVIEW_REQUIRED').length;
  const evaluatedCount = candidates.filter(c => c.evaluationResult).length;

  const navItems: { id: NavigationTab; label: string; icon: React.FC<{ className?: string }>; badge?: React.ReactNode }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard
    },
    {
      id: 'answer_key',
      label: 'Answer Key',
      icon: KeyRound,
      badge: answerKey.isVerified ? (
        <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" title="Verified" />
      ) : (
        <span className="px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-300 text-[10px] font-mono border border-amber-700">
          Verify
        </span>
      )
    },
    {
      id: 'candidates',
      label: 'Submissions',
      icon: Users,
      badge: (
        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700">
          {candidates.length}
        </span>
      )
    },
    {
      id: 'evaluation',
      label: 'Evaluation Console',
      icon: Cpu,
      badge: reviewCount > 0 ? (
        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[11px] font-mono border border-amber-500/40 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {reviewCount}
        </span>
      ) : undefined
    },
    {
      id: 'results',
      label: 'Evaluation Results',
      icon: CheckSquare,
      badge: evaluatedCount > 0 ? (
        <span className="px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 text-[11px] font-mono border border-sky-800">
          {evaluatedCount}
        </span>
      ) : undefined
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: BarChart3
    },
    {
      id: 'settings',
      label: 'Assessment Settings',
      icon: Settings
    }
  ];

  return (
    <aside className="w-64 border-r border-qmax-border bg-[#0B0F17] flex flex-col justify-between shrink-0 h-[calc(100vh-61px)] sticky top-[61px]">
      {/* Navigation Links */}
      <div className="p-4 space-y-1.5">
        <div className="px-3 py-2 text-[11px] uppercase tracking-wider font-mono text-qmax-textSubtle font-semibold">
          Assessment Workflow
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-sky-950/60 text-sky-300 border border-sky-700/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition ${
                  isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
                }`} />
                <span>{item.label}</span>
              </div>
              {item.badge}
            </button>
          );
        })}
      </div>

      {/* System Engine Metadata Box */}
      <div className="p-4 m-3 rounded-lg bg-[#111827] border border-qmax-border space-y-2.5 text-xs">
        <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
          <span>PROCESSING CORE</span>
          <span className="text-emerald-400 font-semibold">ONLINE</span>
        </div>
        
        <div className="space-y-1 text-[11px] text-slate-400">
          <div className="flex justify-between">
            <span>OCR Engine:</span>
            <span className="text-slate-200 font-mono">Local Feature CV</span>
          </div>
          <div className="flex justify-between">
            <span>API Dep:</span>
            <span className="text-emerald-400 font-mono">0 (Self-Contained)</span>
          </div>
          <div className="flex justify-between">
            <span>Scoring Mode:</span>
            <span className="text-sky-400 font-mono">Deterministic</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono text-center">
          QMAX SYSTEMS EVAL-OS v2.4
        </div>
      </div>
    </aside>
  );
};