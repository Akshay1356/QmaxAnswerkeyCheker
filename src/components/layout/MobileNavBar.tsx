import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Cpu, 
  CheckSquare, 
  Menu, 
  Camera,
  KeyRound, 
  BarChart3, 
  Settings, 
  X,
  Layers
} from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';
import { NavigationTab } from '../../types';

interface MobileNavBarProps {
  onOpenScanner: () => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({ onOpenScanner }) => {
  const { activeTab, setActiveTab, candidates, answerKey } = useAssessment();
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);

  const reviewCount = candidates.filter(c => c.status === 'REVIEW_REQUIRED').length;

  const handleTabClick = (tab: NavigationTab) => {
    setActiveTab(tab);
    setShowMoreDrawer(false);
  };

  return (
    <>
      {/* Mobile Sticky Bottom App Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {/* 1. Home */}
        <button
          onClick={() => handleTabClick('overview')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition ${
            activeTab === 'overview' ? 'text-red-600 font-bold' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        {/* 2. Candidates */}
        <button
          onClick={() => handleTabClick('candidates')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg relative transition ${
            activeTab === 'candidates' ? 'text-red-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Candidates</span>
          {candidates.length > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-red-600" />
          )}
        </button>

        {/* 3. Center Prominent Camera Scan Action */}
        <button
          onClick={onOpenScanner}
          className="w-12 h-12 -mt-5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 border-2 border-white flex items-center justify-center transition active:scale-95"
          title="Scan Candidate Sheet"
        >
          <Camera className="w-6 h-6" />
        </button>

        {/* 4. Evaluate */}
        <button
          onClick={() => handleTabClick('evaluation')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg relative transition ${
            activeTab === 'evaluation' ? 'text-red-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Cpu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Evaluate</span>
          {reviewCount > 0 && (
            <span className="absolute top-1 right-2 px-1 rounded-full bg-red-600 text-[8px] text-white font-bold">
              {reviewCount}
            </span>
          )}
        </button>

        {/* 5. More Menu */}
        <button
          onClick={() => setShowMoreDrawer(true)}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition ${
            ['answer_key', 'reports', 'settings', 'evaluations', 'results'].includes(activeTab) 
              ? 'text-red-600 font-bold' 
              : 'text-slate-500'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">More</span>
        </button>
      </div>

      {/* Mobile "More" Drawer Modal */}
      {showMoreDrawer && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-50 flex flex-col justify-end">
          <div className="bg-white rounded-t-2xl p-5 space-y-4 border-t border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="font-bold text-slate-900 text-sm">Navigation Menu</span>
              <button 
                onClick={() => setShowMoreDrawer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleTabClick('answer_key')}
                className={`p-3 rounded-lg border text-left flex items-center gap-3 ${
                  activeTab === 'answer_key' 
                    ? 'bg-red-50 border-red-200 text-red-700 font-bold' 
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <KeyRound className="w-5 h-5 text-red-600" />
                <div>
                  <div className="text-xs font-bold">Answer Keys</div>
                  <div className="text-[10px] text-slate-500">Master Rubrics</div>
                </div>
              </button>

              <button
                onClick={() => handleTabClick('results')}
                className={`p-3 rounded-lg border text-left flex items-center gap-3 ${
                  activeTab === 'results' 
                    ? 'bg-red-50 border-red-200 text-red-700 font-bold' 
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <CheckSquare className="w-5 h-5 text-red-600" />
                <div>
                  <div className="text-xs font-bold">Results</div>
                  <div className="text-[10px] text-slate-500">Scores & Sheets</div>
                </div>
              </button>

              <button
                onClick={() => handleTabClick('reports')}
                className={`p-3 rounded-lg border text-left flex items-center gap-3 ${
                  activeTab === 'reports' 
                    ? 'bg-red-50 border-red-200 text-red-700 font-bold' 
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <BarChart3 className="w-5 h-5 text-red-600" />
                <div>
                  <div className="text-xs font-bold">Reports</div>
                  <div className="text-[10px] text-slate-500">Item Metrics</div>
                </div>
              </button>

              <button
                onClick={() => handleTabClick('settings')}
                className={`p-3 rounded-lg border text-left flex items-center gap-3 ${
                  activeTab === 'settings' 
                    ? 'bg-red-50 border-red-200 text-red-700 font-bold' 
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <Settings className="w-5 h-5 text-red-600" />
                <div>
                  <div className="text-xs font-bold">Settings</div>
                  <div className="text-[10px] text-slate-500">API & Weights</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
