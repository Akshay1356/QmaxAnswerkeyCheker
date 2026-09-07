import React from 'react';
import { 
  LayoutDashboard, 
  Layers,
  KeyRound, 
  Users, 
  Cpu, 
  CheckSquare, 
  BarChart3, 
  Settings, 
  ShieldCheck,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';
import { NavigationTab } from '../../types';

export const DesktopSidebar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    answerKey, 
    candidates,
    isSidebarCollapsed,
    setIsSidebarCollapsed 
  } = useAssessment();

  const reviewCount = candidates.filter(c => c.status === 'REVIEW_REQUIRED').length;
  const evaluatedCount = candidates.filter(c => c.evaluationResult).length;

  const navItems: { id: NavigationTab; label: string; icon: React.FC<{ className?: string }>; badge?: React.ReactNode }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard
    },
    {
      id: 'evaluations',
      label: 'Evaluations',
      icon: Layers
    },
    {
      id: 'answer_key',
      label: 'Answer Keys',
      icon: KeyRound,
      badge: answerKey.isVerified ? (
        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Verified Single Source of Truth" />
      ) : (
        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-medium border border-amber-200">
          Verify
        </span>
      )
    },
    {
      id: 'candidates',
      label: 'Candidates',
      icon: Users,
      badge: (
        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
          {candidates.length}
        </span>
      )
    },
    {
      id: 'evaluation',
      label: 'Evaluation',
      icon: Cpu,
      badge: reviewCount > 0 ? (
        <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 text-[10px] font-bold border border-red-200 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-red-600" />
          {reviewCount}
        </span>
      ) : undefined
    },
    {
      id: 'results',
      label: 'Results',
      icon: CheckSquare,
      badge: evaluatedCount > 0 ? (
        <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-semibold border border-red-200">
          {evaluatedCount}
        </span>
      ) : undefined
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings
    }
  ];

  return (
    <aside className={`hidden md:flex flex-col justify-between border-r border-slate-200 bg-white shrink-0 h-screen sticky top-0 transition-all duration-200 z-30 ${
      isSidebarCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Top Application Brand Header */}
      <div>
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          {!isSidebarCollapsed ? (
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-sans font-extrabold text-base text-red-600 tracking-tight">
                  QMAX
                </span>
                <span className="font-sans font-bold text-base text-slate-900 tracking-tight">
                  ATLAS
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200 ml-1">
                  PRO
                </span>
              </div>
              <div className="text-[10px] font-semibold text-slate-500 tracking-wider mt-0.5">
                QMAX SYSTEMS
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center font-bold text-white text-sm mx-auto shadow-sm">
              Q
            </div>
          )}

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          {!isSidebarCollapsed && (
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Navigation
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-lg text-xs transition-all group ${
                  isActive
                    ? 'bg-red-50 text-red-700 font-bold border-l-4 border-red-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-red-600' : 'text-slate-400 group-hover:text-slate-700'
                  }`} />
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </div>
                {!isSidebarCollapsed && item.badge}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Profile Footer */}
      <div className="p-3 border-t border-slate-200 space-y-2">
        {!isSidebarCollapsed ? (
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-red-600 flex items-center justify-center font-bold text-xs text-white shadow-xs">
                AD
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">Admin Evaluator</div>
                <div className="text-[10px] text-slate-500 font-medium">Qmax Systems</div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('settings')}
              title="System Settings"
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setActiveTab('settings')}
            title="Settings"
            className="w-full flex justify-center p-2 text-slate-400 hover:text-slate-700"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
