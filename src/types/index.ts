export type ErrorClassification = 
  | 'NONE'
  | 'NUMERICAL_MISMATCH'
  | 'UNIT_MISMATCH'
  | 'INCORRECT_CONCEPT'
  | 'PARTIAL_FORMULA'
  | 'AMBIGUOUS_HANDWRITING'
  | 'UNREADABLE'
  | 'UNANSWERED';

export type EvaluationVerdict = 'CORRECT' | 'PARTIALLY_CORRECT' | 'INCORRECT' | 'REVIEW_REQUIRED';

export type ConfidenceStatus = 'CONFIDENT' | 'REVIEW' | 'UNREADABLE';

export type CandidateStatus = 'READY' | 'PROCESSING' | 'REVIEW_REQUIRED' | 'EVALUATED' | 'FAILED';

export type QuestionSetType = 'SET_A' | 'SET_B' | 'SET_C' | 'ALL' | string;

export type NavigationTab = 
  | 'overview' 
  | 'evaluations'
  | 'answer_key' 
  | 'candidates' 
  | 'evaluation' 
  | 'results' 
  | 'reports' 
  | 'settings';

export interface AnswerKeyQuestion {
  id: number;
  questionNumber: number;
  questionText: string;
  expectedAnswer: string;
  questionSet?: QuestionSetType; // e.g. 'SET_A', 'SET_B', 'SET_C'
  unit?: string;
  numericalValue?: number;
  tolerancePercent?: number;
  maxMarks: number;
  topic: string;
  confidence: number;
  status: ConfidenceStatus;
  notes?: string;
}

export interface AnswerKey {
  id: string;
  title: string;
  assessmentCode: string;
  fileName?: string;
  createdAt: string;
  isVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  sets: string[]; // e.g. ['SET_A', 'SET_B', 'SET_C']
  activeSet?: string;
  totalQuestions: number; // Questions count per set (e.g. 20)
  totalMaxMarks: number;
  questions: AnswerKeyQuestion[];
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnswerRegion {
  questionNumber: number;
  bbox: BoundingBox;
  rawExtractedText: string;
  normalizedAnswer: string;
  extractedUnit?: string;
  extractedNumericValue?: number;
  confidence: number;
  status: ConfidenceStatus;
  croppedImageUrl: string;
  manualOverride?: string;
  isManuallyVerified?: boolean;
}

export interface CandidatePage {
  pageNumber: number;
  originalImageUrl: string;
  processedImageUrl?: string;
  width: number;
  height: number;
  answerRegions: AnswerRegion[];
}

export interface QuestionEvaluationResult {
  questionNumber: number;
  questionText: string;
  expectedAnswer: string;
  candidateAnswer: string;
  questionSet?: string;
  verdict: EvaluationVerdict;
  errorType: ErrorClassification;
  confidence: number;
  maxMarks: number;
  marksAwarded: number;
  reason: string;
  croppedImageUrl: string;
  isManuallyOverridden?: boolean;
  adminDecisionNote?: string;
}

export interface CandidateEvaluationResult {
  totalQuestions: number;
  assignedSet: string;
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
  unansweredCount: number;
  reviewRequiredCount: number;
  totalMarksAwarded: number;
  maxMarksPossible: number;
  percentage: number;
  isPassed: boolean;
  evaluatedAt: string;
  questionResults: QuestionEvaluationResult[];
}

export interface CandidateSubmission {
  id: string;
  candidateId: string;
  name: string;
  registrationNumber: string;
  appliedRole: string;
  batchCode: string;
  assignedSet?: string; // 'SET_A' | 'SET_B' | 'SET_C'
  createdAt: string;
  status: CandidateStatus;
  pages: CandidatePage[];
  evaluationResult?: CandidateEvaluationResult;
}

export interface AssessmentSettings {
  aiProvider: 'gemini' | 'claude' | 'openai' | 'local-engine';
  aiModel: string;
  apiKeyConfigured: boolean;
  defaultTolerancePercent: number;
  passPercentage: number;
  minConfidenceThreshold: number;
  autoFlagReviewThreshold: number;
  allowPartialCredit: boolean;
  strictUnitMatching: boolean;
  negativeMarkPerIncorrect: number;
}

export type PipelineStage = 
  | 'idle' 
  | 'document_analysis' 
  | 'handwriting_recognition' 
  | 'answer_extraction' 
  | 'unit_analysis'
  | 'semantic_evaluation'
  | 'scoring' 
  | 'completed';

export interface TelemetryProgress {
  stage: PipelineStage;
  currentCandidateName?: string;
  currentCandidateId?: string;
  currentCandidateIndex: number;
  totalCandidates: number;
  processedCount: number;
  stageProgress: {
    docAnalysis: number;
    hwr: number;
    extraction: number;
    unitAnalysis: number;
    semanticEval: number;
    scoring: number;
  };
  logs: string[];
}
