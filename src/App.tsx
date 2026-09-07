import React, { useState } from 'react';
import { AssessmentProvider, useAssessment } from './context/AssessmentContext';
import { DesktopSidebar } from './components/layout/DesktopSidebar';
import { AppHeader } from './components/layout/AppHeader';
import { MobileNavBar } from './components/layout/MobileNavBar';
import { NotificationToast } from './components/common/NotificationToast';
import { OperationsDashboard } from './components/overview/OperationsDashboard';
import { EvaluationsListWorkspace } from './components/evaluations/EvaluationsListWorkspace';
import { AnswerKeyWorkspace } from './components/answerKey/AnswerKeyWorkspace';
import { CandidateWorkspace } from './components/candidates/CandidateWorkspace';
import { EvaluationPipelineView } from './components/evaluation/EvaluationPipelineView';
import { ResultsWorkspace } from './components/results/ResultsWorkspace';
import { ReportsWorkspace } from './components/reports/ReportsWorkspace';
import { SettingsWorkspace } from './components/settings/SettingsWorkspace';
import { MobileCameraScanner } from './components/candidates/MobileCameraScanner';

const MainApplicationContent: React.FC = () => {
  const { activeTab } = useAssessment();
  const [showMobileScanner, setShowMobileScanner] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return <OperationsDashboard onOpenScanner={() => setShowMobileScanner(true)} />;
      case 'evaluations':
        return <EvaluationsListWorkspace />;
      case 'answer_key':
        return <AnswerKeyWorkspace />;
      case 'candidates':
        return <CandidateWorkspace onOpenScanner={() => setShowMobileScanner(true)} />;
      case 'evaluation':
        return <EvaluationPipelineView />;
      case 'results':
        return <ResultsWorkspace />;
      case 'reports':
        return <ReportsWorkspace />;
      case 'settings':
        return <SettingsWorkspace />;
      default:
        return <OperationsDashboard onOpenScanner={() => setShowMobileScanner(true)} />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
      <AppHeader />
      <main className="flex-1 p-3 md:p-6 overflow-y-auto max-h-[calc(100vh-56px)] scrollbar-thin">
        {renderActiveView()}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNavBar onOpenScanner={() => setShowMobileScanner(true)} />

      {/* Mobile-First Camera Scanner Modal */}
      {showMobileScanner && (
        <MobileCameraScanner onClose={() => setShowMobileScanner(false)} />
      )}
    </div>
  );
};

export function App() {
  return (
    <AssessmentProvider>
      <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans antialiased">
        <DesktopSidebar />
        <MainApplicationContent />
        <NotificationToast />
      </div>
    </AssessmentProvider>
  );
}

export default App;
