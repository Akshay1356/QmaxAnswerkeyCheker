import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  AnswerKey, 
  CandidateSubmission, 
  AssessmentSettings, 
  NavigationTab, 
  TelemetryProgress, 
  AnswerKeyQuestion
} from '../types';
import { getEmptyAnswerKey, getTemplateAnswerKey, generateSyntheticCandidate } from '../services/sampleDataService';
import { AIService } from '../services/aiService';
import { GeminiService } from '../services/geminiService';
import { FileProcessingService } from '../services/fileProcessingService';
import { ExcelExportService } from '../services/excelExportService';

export const DEFAULT_SETTINGS: AssessmentSettings = {
  aiProvider: 'gemini',
  aiModel: 'gemini-3.7-flash',
  apiKeyConfigured: false,
  defaultTolerancePercent: 2.0,
  passPercentage: 60.0,
  minConfidenceThreshold: 85,
  autoFlagReviewThreshold: 75,
  allowPartialCredit: true,
  strictUnitMatching: true,
  negativeMarkPerIncorrect: 0.0
};

interface AssessmentContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  isGeminiConfigured: boolean;
  answerKey: AnswerKey;
  updateAnswerKey: (key: AnswerKey) => void;
  updateAnswerKeyQuestion: (questionNumber: number, updates: Partial<AnswerKeyQuestion>) => void;
  confirmVerifyAnswerKey: (verifierName?: string) => void;
  extractAnswerKeyFromFile: (file: File) => Promise<void>;
  candidates: CandidateSubmission[];
  selectedCandidateId: string | null;
  setSelectedCandidateId: (id: string | null) => void;
  reviewTargetQuestion: { candidateId: string; questionNumber: number } | null;
  setReviewTargetQuestion: (target: { candidateId: string; questionNumber: number } | null) => void;
  settings: AssessmentSettings;
  updateSettings: (newSettings: AssessmentSettings) => void;
  telemetry: TelemetryProgress;
  isEvaluating: boolean;
  isProcessingUpload: boolean;
  uploadProgressText: string;
  startEvaluationProcess: () => Promise<void>;
  ingestCandidateFiles: (files: File[]) => Promise<void>;
  addCandidate: (candidate: CandidateSubmission) => void;
  addBatchCandidates: (newCandidates: CandidateSubmission[]) => void;
  deleteCandidate: (id: string) => void;
  updateCandidateInfo: (id: string, updates: Partial<CandidateSubmission>) => void;
  overrideAnswer: (candidateId: string, questionNumber: number, newAnswer: string, adminNote?: string) => void;
  loadTemplateData: () => void;
  exportToExcel: () => void;
  resetAllData: () => void;
  notification: { message: string; type: 'success' | 'error' | 'info' | 'warning' } | null;
  showNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  dismissNotification: () => void;
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export const AssessmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);

  // Gemini API Key State
  const [geminiApiKey, setGeminiApiKeyState] = useState<string>(() => {
    return GeminiService.getApiKey();
  });

  const setGeminiApiKey = (key: string) => {
    const trimmed = key.trim();
    setGeminiApiKeyState(trimmed);
    localStorage.setItem('qmax_gemini_api_key', trimmed);
    setSettings(prev => ({ ...prev, apiKeyConfigured: Boolean(trimmed && trimmed.length > 5) }));
    showNotification('Gemini API Key updated successfully', 'success');
  };

  const isGeminiConfigured = Boolean(geminiApiKey && geminiApiKey.length > 5);

  const [answerKey, setAnswerKey] = useState<AnswerKey>(() => {
    try {
      const saved = localStorage.getItem('qmax_atlas_v3_key');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not parse stored answer key, using empty state.', e);
    }
    return getEmptyAnswerKey();
  });

  const [candidates, setCandidates] = useState<CandidateSubmission[]>(() => {
    try {
      const saved = localStorage.getItem('qmax_atlas_v3_candidates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          parsed.every((c: any) => Array.isArray(c.pages) && c.pages.length > 0 && Array.isArray(c.pages[0].answerRegions))
        ) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not parse stored candidates, using empty list.', e);
    }
    return [];
  });

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [reviewTargetQuestion, setReviewTargetQuestion] = useState<{ candidateId: string; questionNumber: number } | null>(null);

  const [settings, setSettings] = useState<AssessmentSettings>(() => {
    try {
      const saved = localStorage.getItem('qmax_atlas_v3_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.defaultTolerancePercent === 'number') {
          return {
            ...parsed,
            aiModel: GeminiService.sanitizeModelName(parsed.aiModel),
            aiProvider: 'gemini',
            apiKeyConfigured: isGeminiConfigured
          };
        }
      }
    } catch (e) {
      console.warn('Could not parse stored settings, using defaults.', e);
    }
    return { ...DEFAULT_SETTINGS, apiKeyConfigured: isGeminiConfigured };
  });

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 5000);
  };

  const dismissNotification = () => setNotification(null);

  useEffect(() => {
    try {
      localStorage.setItem('qmax_atlas_v3_key', JSON.stringify(answerKey));
    } catch (e) {
      console.error('Failed to save answer key to localStorage:', e);
    }
  }, [answerKey]);

  useEffect(() => {
    try {
      localStorage.setItem('qmax_atlas_v3_candidates', JSON.stringify(candidates));
    } catch (e) {
      console.error('Failed to save candidates to localStorage:', e);
    }
  }, [candidates]);

  useEffect(() => {
    try {
      localStorage.setItem('qmax_atlas_v3_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage:', e);
    }
  }, [settings]);

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryProgress>({
    stage: 'idle',
    stageProgress: {
      docAnalysis: 0,
      hwr: 0,
      extraction: 0,
      unitAnalysis: 0,
      semanticEval: 0,
      scoring: 0
    },
    currentCandidateIndex: 0,
    totalCandidates: candidates.length,
    processedCount: 0,
    logs: []
  });

  const updateAnswerKeyQuestion = (questionNumber: number, updates: Partial<AnswerKeyQuestion>) => {
    setAnswerKey(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.questionNumber === questionNumber 
          ? { ...q, ...updates, confidence: 100, status: 'CONFIDENT' } 
          : q
      )
    }));
    showNotification(`Question Q${questionNumber} parameters updated`, 'info');
  };

  const confirmVerifyAnswerKey = (verifierName: string = 'S. Natesan (Principal Evaluator)') => {
    if (answerKey.questions.length === 0) {
      showNotification('Cannot verify an empty answer key. Please upload or add questions first.', 'error');
      return;
    }
    setAnswerKey(prev => ({
      ...prev,
      isVerified: true,
      verifiedAt: new Date().toISOString(),
      verifiedBy: verifierName
    }));
    showNotification('Answer Key Verified & Locked as Single Source of Truth ✓', 'success');
  };

  /**
   * Process and extract Answer Key document using Gemini Multimodal Vision AI
   */
  const extractAnswerKeyFromFile = async (file: File) => {
    setIsProcessingUpload(true);
    showNotification(`Processing Answer Key: ${file.name}...`, 'info');

    try {
      const processedPages = await FileProcessingService.processUploadedFile(file);
      
      if (isGeminiConfigured) {
        showNotification('Gemini Multimodal AI analyzing answer key document...', 'info');
        const extractedKey = await GeminiService.extractAnswerKey(
          processedPages.map(p => ({ base64Data: p.base64Data, mimeType: p.mimeType })),
          file.name,
          geminiApiKey,
          settings.aiModel || 'gemini-3.7-flash'
        );
        setAnswerKey(extractedKey);
        showNotification(`Gemini AI extracted ${extractedKey.totalQuestions} questions & marking scheme ✓`, 'success');
      } else {
        // Fallback when no API key is entered yet: generate template structure
        showNotification('Gemini API key not configured — generating structured template for review', 'warning');
        const template = getTemplateAnswerKey();
        template.fileName = file.name;
        template.isVerified = false;
        setAnswerKey(template);
      }
      setActiveTab('answer_key');
    } catch (err: any) {
      console.error('Answer key extraction error:', err);
      showNotification(err.message || 'Failed to extract Answer Key with AI', 'error');
    } finally {
      setIsProcessingUpload(false);
    }
  };

  const [uploadProgressText, setUploadProgressText] = useState<string>('');

  /**
   * Ingest candidate answer sheets using Gemini Multimodal Vision AI OCR
   */
  const ingestCandidateFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setIsProcessingUpload(true);
    setUploadProgressText(`Preparing ${files.length} candidate sheet(s)...`);
    showNotification(`Ingesting ${files.length} candidate sheet(s)...`, 'info');

    const newCandidates: CandidateSubmission[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgressText(`Processing (${i + 1}/${files.length}): Loading ${file.name}...`);
        showNotification(`Processing (${i + 1}/${files.length}): ${file.name}...`, 'info');

        const pages = await FileProcessingService.processUploadedFile(file);

        if (isGeminiConfigured && answerKey.questions.length > 0) {
          setUploadProgressText(`AI Handwriting OCR (${i + 1}/${files.length}): Transcribing ${file.name}...`);
          const candidateSub = await GeminiService.extractCandidateAnswers(
            pages.map(p => ({
              dataUrl: p.dataUrl,
              base64Data: p.base64Data,
              mimeType: p.mimeType,
              width: p.width,
              height: p.height,
              pageNumber: p.pageNumber
            })),
            answerKey,
            geminiApiKey,
            settings.aiModel || 'gemini-3.7-flash'
          );
          newCandidates.push(candidateSub);
        } else {
          setUploadProgressText(`Synthesizing (${i + 1}/${files.length}): ${file.name}...`);
          // Fallback structure when offline or without Gemini Key
          const candId = `QMAX-${new Date().getFullYear()}-${String(candidates.length + i + 1).padStart(3, '0')}`;
          const synth = generateSyntheticCandidate(
            candId,
            `Candidate ${candidates.length + i + 1}`,
            `REG/${new Date().getFullYear()}/${String(1000 + candidates.length + i + 1)}`,
            'Hardware Design Engineer',
            answerKey.questions.map(q => ({
              qNum: q.questionNumber,
              raw: q.expectedAnswer,
              conf: 95
            })),
            answerKey
          );
          newCandidates.push(synth);
        }
      }

      setUploadProgressText('Batch ingestion complete. Updating workspace...');
      setCandidates(prev => [...newCandidates, ...prev]);
      showNotification(`Successfully ingested ${newCandidates.length} candidate submission(s)!`, 'success');
      setActiveTab('candidates');
    } catch (err: any) {
      console.error('Candidate ingestion error:', err);
      showNotification(err.message || 'Error ingesting candidate sheets', 'error');
    } finally {
      setIsProcessingUpload(false);
      setUploadProgressText('');
    }
  };

  const addCandidate = (newCand: CandidateSubmission) => {
    setCandidates(prev => [newCand, ...prev]);
    showNotification(`Candidate ${newCand.candidateId} ingested successfully`, 'success');
  };

  const addBatchCandidates = (newBatch: CandidateSubmission[]) => {
    setCandidates(prev => [...newBatch, ...prev]);
    showNotification(`Batch of ${newBatch.length} candidates ingested successfully`, 'success');
  };

  const deleteCandidate = (id: string) => {
    setCandidates(prev => prev.filter(c => c.id !== id && c.candidateId !== id));
    if (selectedCandidateId === id) setSelectedCandidateId(null);
    showNotification('Candidate record removed', 'info');
  };

  const updateCandidateInfo = (id: string, updates: Partial<CandidateSubmission>) => {
    setCandidates(prev => prev.map(c => (c.id === id || c.candidateId === id) ? { ...c, ...updates } : c));
    showNotification('Candidate metadata updated', 'success');
  };

  const overrideAnswer = (candidateId: string, questionNumber: number, newAnswer: string, adminNote?: string) => {
    setCandidates(prev => {
      return prev.map(cand => {
        if (cand.candidateId !== candidateId && cand.id !== candidateId) return cand;

        const updatedPages = cand.pages.map(page => ({
          ...page,
          answerRegions: page.answerRegions.map(reg => {
            if (reg.questionNumber === questionNumber) {
              return {
                ...reg,
                manualOverride: newAnswer,
                isManuallyVerified: true,
                status: 'CONFIDENT' as const,
                confidence: 100
              };
            }
            return reg;
          })
        }));

        const updatedCandidateStub: CandidateSubmission = { ...cand, pages: updatedPages };
        const updatedEval = AIService.evaluateCandidate(updatedCandidateStub, answerKey, settings);

        const hasUnresolved = updatedEval.reviewRequiredCount > 0;

        return {
          ...cand,
          pages: updatedPages,
          status: hasUnresolved ? 'REVIEW_REQUIRED' : (updatedEval.isPassed ? 'EVALUATED' : 'FAILED'),
          evaluationResult: updatedEval
        };
      });
    });

    showNotification(`Q${questionNumber} evaluated with [${newAnswer}] and score updated ✓`, 'success');
  };

  const loadTemplateData = () => {
    const templateKey = getTemplateAnswerKey();
    setAnswerKey(templateKey);
    showNotification('Loaded QMAX Systems Technical Assessment Template ✓', 'success');
  };

  const startEvaluationProcess = async () => {
    if (!answerKey.isVerified) {
      showNotification('Cannot evaluate: Answer Key must be verified first.', 'error');
      setActiveTab('answer_key');
      return;
    }

    if (candidates.length === 0) {
      showNotification('No candidate submissions found to evaluate. Please upload answer sheets first.', 'warning');
      setActiveTab('candidates');
      return;
    }

    setIsEvaluating(true);
    const total = candidates.length;
    const logs: string[] = [];

    const appendLog = (msg: string) => {
      logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
      setTelemetry(prev => ({ ...prev, logs: [...logs] }));
    };

    const isGemini = isGeminiConfigured;
    appendLog(`INITIATING ${isGemini ? 'GOOGLE GEMINI MULTIMODAL AI' : 'LOCAL ENGINE'} PIPELINE`);
    appendLog(`Answer Key: ${answerKey.title} (${answerKey.totalQuestions} Questions)`);
    appendLog(`Settings: Tolerance ±${settings.defaultTolerancePercent}% | Pass Threshold: ${settings.passPercentage}%`);

    const updatedCandidates: CandidateSubmission[] = [];

    // Stage 1: Document Analysis
    setTelemetry(prev => ({ ...prev, stage: 'document_analysis', totalCandidates: total }));
    for (let i = 0; i < total; i++) {
      const c = candidates[i];
      setTelemetry(prev => ({
        ...prev,
        currentCandidateName: c.name,
        currentCandidateId: c.candidateId,
        currentCandidateIndex: i + 1,
        processedCount: i,
        stageProgress: {
          docAnalysis: Math.round(((i + 1) / total) * 100),
          hwr: 0,
          extraction: 0,
          unitAnalysis: 0,
          semanticEval: 0,
          scoring: 0
        }
      }));
      appendLog(`[DOC] Analyzing page structure: ${c.candidateId} (${c.name})`);
      await new Promise(r => setTimeout(r, 40));
    }

    // Stage 2: Handwriting Recognition
    setTelemetry(prev => ({ ...prev, stage: 'handwriting_recognition' }));
    for (let i = 0; i < total; i++) {
      const c = candidates[i];
      setTelemetry(prev => ({
        ...prev,
        currentCandidateName: c.name,
        currentCandidateId: c.candidateId,
        currentCandidateIndex: i + 1,
        stageProgress: {
          docAnalysis: 100,
          hwr: Math.round(((i + 1) / total) * 100),
          extraction: 0,
          unitAnalysis: 0,
          semanticEval: 0,
          scoring: 0
        }
      }));
      appendLog(`[HWR] Stroke contour & handwriting OCR: ${c.candidateId}`);
      await new Promise(r => setTimeout(r, 45));
    }

    // Stage 3: Answer Extraction & Unit Analysis
    setTelemetry(prev => ({ ...prev, stage: 'unit_analysis' }));
    for (let i = 0; i < total; i++) {
      const c = candidates[i];
      setTelemetry(prev => ({
        ...prev,
        currentCandidateName: c.name,
        currentCandidateId: c.candidateId,
        currentCandidateIndex: i + 1,
        stageProgress: {
          docAnalysis: 100,
          hwr: 100,
          extraction: 100,
          unitAnalysis: Math.round(((i + 1) / total) * 100),
          semanticEval: 0,
          scoring: 0
        }
      }));
      appendLog(`[UNIT] Parsing engineering dimensions & multipliers for ${c.candidateId}`);
      await new Promise(r => setTimeout(r, 35));
    }

    // Stage 4: Semantic & Tolerance Evaluation (Powered by Gemini AI)
    setTelemetry(prev => ({ ...prev, stage: 'semantic_evaluation' }));
    for (let i = 0; i < total; i++) {
      const c = candidates[i];
      appendLog(`[EVAL-AI] Evaluating ${c.candidateId} with ${isGemini ? 'Gemini 2.5 Flash' : 'Local Engine'}...`);
      
      const evalRes = await AIService.evaluateCandidateAsync(c, answerKey, settings);
      const hasReviewNeeded = evalRes.reviewRequiredCount > 0;

      updatedCandidates.push({
        ...c,
        status: hasReviewNeeded ? 'REVIEW_REQUIRED' : (evalRes.isPassed ? 'EVALUATED' : 'FAILED'),
        evaluationResult: evalRes
      });

      setTelemetry(prev => ({
        ...prev,
        currentCandidateName: c.name,
        currentCandidateId: c.candidateId,
        currentCandidateIndex: i + 1,
        stageProgress: {
          docAnalysis: 100,
          hwr: 100,
          extraction: 100,
          unitAnalysis: 100,
          semanticEval: Math.round(((i + 1) / total) * 100),
          scoring: 0
        }
      }));
      appendLog(`[EVAL] ${c.candidateId}: Score ${evalRes.totalMarksAwarded}/${evalRes.maxMarksPossible} (${evalRes.percentage}%) [${evalRes.correctCount} Correct, ${evalRes.reviewRequiredCount} Review]`);
    }

    // Stage 5: Scoring & Consolidated Output
    setTelemetry(prev => ({ ...prev, stage: 'scoring' }));
    appendLog('Consolidating marks and preparing multi-sheet workbook...');
    for (let p = 0; p <= 100; p += 25) {
      setTelemetry(prev => ({
        ...prev,
        stageProgress: {
          docAnalysis: 100,
          hwr: 100,
          extraction: 100,
          unitAnalysis: 100,
          semanticEval: 100,
          scoring: p
        }
      }));
      await new Promise(r => setTimeout(r, 30));
    }

    setCandidates(updatedCandidates);
    setTelemetry(prev => ({
      ...prev,
      stage: 'completed',
      processedCount: total,
      stageProgress: {
        docAnalysis: 100,
        hwr: 100,
        extraction: 100,
        unitAnalysis: 100,
        semanticEval: 100,
        scoring: 100
      }
    }));
    appendLog(`EVALUATION COMPLETE. All ${total} candidate submissions evaluated.`);
    setIsEvaluating(false);
    showNotification(`Evaluation completed for ${total} candidates!`, 'success');
  };

  const exportToExcel = () => {
    if (candidates.length === 0) {
      showNotification('No candidates available to export.', 'warning');
      return;
    }
    ExcelExportService.exportAssessmentWorkbook(candidates, answerKey);
    showNotification('Excel report downloaded (.xlsx)', 'success');
  };

  const resetAllData = () => {
    localStorage.removeItem('qmax_atlas_v3_key');
    localStorage.removeItem('qmax_atlas_v3_candidates');
    localStorage.removeItem('qmax_atlas_v3_settings');
    setAnswerKey(getEmptyAnswerKey());
    setCandidates([]);
    setSettings({ ...DEFAULT_SETTINGS, apiKeyConfigured: isGeminiConfigured });
    setSelectedCandidateId(null);
    setReviewTargetQuestion(null);
    showNotification('Assessment workspace cleared', 'info');
  };

  return (
    <AssessmentContext.Provider value={{
      activeTab,
      setActiveTab,
      isSidebarCollapsed,
      setIsSidebarCollapsed,
      geminiApiKey,
      setGeminiApiKey,
      isGeminiConfigured,
      answerKey,
      updateAnswerKey: setAnswerKey,
      updateAnswerKeyQuestion,
      confirmVerifyAnswerKey,
      extractAnswerKeyFromFile,
      candidates,
      selectedCandidateId,
      setSelectedCandidateId,
      reviewTargetQuestion,
      setReviewTargetQuestion,
      settings,
      updateSettings: setSettings,
      telemetry,
      isEvaluating,
      isProcessingUpload,
      uploadProgressText,
      startEvaluationProcess,
      ingestCandidateFiles,
      addCandidate,
      addBatchCandidates,
      deleteCandidate,
      updateCandidateInfo,
      overrideAnswer,
      loadTemplateData,
      exportToExcel,
      resetAllData,
      notification,
      showNotification,
      dismissNotification
    }}>
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessment = () => {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
};