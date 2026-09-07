import { AnswerKey, CandidateSubmission, AnswerKeyQuestion, CandidatePage, AnswerRegion } from '../types';
import { DocumentProcessor } from './documentProcessor';
import { AIService } from './aiService';

export function getEmptyAnswerKey(): AnswerKey {
  return {
    id: `key-${Date.now()}`,
    title: 'Awaiting Answer Key Ingestion',
    assessmentCode: 'QMAX-TECH-2026',
    fileName: '',
    createdAt: new Date().toISOString(),
    isVerified: false,
    sets: ['SET_A', 'SET_B', 'SET_C'],
    activeSet: 'SET_A',
    totalQuestions: 20,
    totalMaxMarks: 20,
    questions: []
  };
}

export function getInitialAnswerKey(): AnswerKey {
  return getEmptyAnswerKey();
}

export function buildSampleSubmissions(): CandidateSubmission[] {
  return [];
}

/**
 * Technical Question Reference Topics based on Qmax Systems Engineering Domains
 */
export const QMAX_ENGINEERING_DOMAINS = [
  'Concept Validation (CVD)',
  'Hardware Development',
  'PCB Design (EVT)',
  'Firmware & SW Development',
  'Mechanical and ID',
  'Validation & Compliance (DVT)',
  'Production Validation (PVT)'
];

const RAW_20_QUESTIONS_BASE = [
  { q: 1, text: 'Supply voltage rail for standard low-power 3.3V logic MCU I/O', ans: '3.3 V', unit: 'V', tol: 3, marks: 1, topic: 'Power Delivery' },
  { q: 2, text: 'Termination resistance required for a high-speed CAN bus segment', ans: '120 Ω', unit: 'Ω', tol: 2, marks: 1, topic: 'Differential Signal Termination' },
  { q: 3, text: 'Equivalent resistance of two 20 kΩ resistors in parallel', ans: '10 kΩ', unit: 'kΩ', tol: 2, marks: 1, topic: 'Circuit Theory' },
  { q: 4, text: 'Maximum operating loop current for industrial telemetry standard', ans: '20 mA', unit: 'mA', tol: 1, marks: 1, topic: 'Industrial Current Loops' },
  { q: 5, text: 'Component protecting switching MOSFETs from inductive flyback spikes', ans: 'Flyback Diode', unit: '', tol: 0, marks: 1, topic: 'Power Electronics' },
  { q: 6, text: 'Default standard grid mains AC frequency in India/Europe', ans: '50 Hz', unit: 'Hz', tol: 1, marks: 1, topic: 'AC Distribution' },
  { q: 7, text: 'Bus communication protocol using SDA and SCL open-drain lines', ans: 'I2C', unit: '', tol: 0, marks: 1, topic: 'Serial Protocols' },
  { q: 8, text: 'Type of capacitor placed closest to IC power pins for decoupling', ans: 'Decoupling Capacitor', unit: '', tol: 0, marks: 1, topic: 'Signal Integrity' },
  { q: 9, text: 'Resonant frequency of LC tank with L=10 µH and C=100 nF', ans: '159.2 kHz', unit: 'kHz', tol: 3, marks: 1, topic: 'RF & Resonance' },
  { q: 10, text: 'Standard single-ended microstrip characteristic trace impedance in high-speed PCBs', ans: '50 Ω', unit: 'Ω', tol: 2, marks: 1, topic: 'PCB Layout' },
  { q: 11, text: 'Nominal gravitational acceleration constant for dynamics calculations', ans: '9.81 m/s²', unit: 'm/s²', tol: 1.5, marks: 1, topic: 'Physics' },
  { q: 12, text: 'Forward voltage drop across standard silicon PN junction diode at 25°C', ans: '0.7 V', unit: 'V', tol: 5, marks: 1, topic: 'Semiconductor Physics' },
  { q: 13, text: 'Serial interface requiring RX, TX, and GND asynchronous lines', ans: 'UART', unit: '', tol: 0, marks: 1, topic: 'Embedded Systems' },
  { q: 14, text: 'Cutoff frequency of RC low-pass filter with R=1 kΩ and C=100 nF', ans: '1.59 kHz', unit: 'kHz', tol: 3, marks: 1, topic: 'Analog Filters' },
  { q: 15, text: 'Thermal relief spoke requirement in PCB copper flood to prevent cold solder joints', ans: 'Thermal Relief', unit: '', tol: 0, marks: 1, topic: 'DFM & Fabrication' },
  { q: 16, text: 'Differential impedance standard for USB 2.0 High-Speed data pairs (D+/D-)', ans: '90 Ω', unit: 'Ω', tol: 2, marks: 1, topic: 'High-Speed Routing' },
  { q: 17, text: 'Energy stored in a 100 µF capacitor charged to 12 V', ans: '7.2 mJ', unit: 'mJ', tol: 2, marks: 1, topic: 'Energy Storage' },
  { q: 18, text: 'ADC quantization resolution in steps for a 12-bit analog converter', ans: '4096', unit: 'steps', tol: 0, marks: 1, topic: 'Data Acquisition' },
  { q: 19, text: 'Output voltage of LM7805 standard linear voltage regulator', ans: '5 V', unit: 'V', tol: 2, marks: 1, topic: 'Power Management' },
  { q: 20, text: 'Standard differential bus impedance for RS-485 balanced multi-drop lines', ans: '120 Ω', unit: 'Ω', tol: 2, marks: 1, topic: 'Industrial Interfaces' }
];

export function getTemplateAnswerKey(): AnswerKey {
  const sets = ['SET_A', 'SET_B', 'SET_C'];
  const questions: AnswerKeyQuestion[] = [];
  let id = 1;

  sets.forEach(setKey => {
    RAW_20_QUESTIONS_BASE.forEach(item => {
      // Create slight variations across sets if needed
      let expected = item.ans;
      if (setKey === 'SET_B' && item.q === 1) expected = '3.3 V';
      if (setKey === 'SET_C' && item.q === 1) expected = '3.3 V';

      questions.push({
        id: id++,
        questionNumber: item.q,
        questionSet: setKey,
        questionText: item.text,
        expectedAnswer: expected,
        unit: item.unit || undefined,
        tolerancePercent: item.tol,
        maxMarks: item.marks,
        topic: item.topic,
        confidence: 99,
        status: 'CONFIDENT',
        notes: `Official marking key for ${setKey}`
      });
    });
  });

  return {
    id: 'key-qmax-tech-2026',
    title: 'QMAX-SYS-ENG-2026: Embedded Hardware Assessment (Sets A, B, C)',
    assessmentCode: 'QMAX-TECH-2026',
    fileName: 'QMAX_Official_Answer_Key_2026.pdf',
    createdAt: new Date().toISOString(),
    isVerified: true,
    verifiedAt: new Date().toISOString(),
    verifiedBy: 'S. Natesan (Principal Evaluator)',
    sets,
    activeSet: 'SET_A',
    totalQuestions: 20,
    totalMaxMarks: 20,
    questions
  };
}

/**
 * Generates an authentic candidate test sheet with custom answers for testing ingestion pipeline
 */
export function generateSyntheticCandidate(
  candidateId: string,
  candidateName: string,
  regNo: string,
  role: string,
  answers: { qNum: number; raw: string; conf: number; isFlagged?: boolean }[],
  answerKey: AnswerKey,
  assignedSet: string = 'SET_A'
): CandidateSubmission {
  const pageAnswers = answers.map(a => {
    const qMeta = answerKey.questions.find(q => q.questionNumber === a.qNum && q.questionSet === assignedSet) || {
      questionText: `Technical Problem ${a.qNum}`
    };
    return {
      questionNumber: a.qNum,
      questionText: qMeta.questionText,
      answer: a.raw,
      confidence: a.conf,
      isFlagged: a.isFlagged
    };
  });

  const docGen = DocumentProcessor.createCandidateSheetCanvas(
    candidateId,
    candidateName,
    1,
    1,
    pageAnswers
  );

  const regions: AnswerRegion[] = docGen.regions.map(r => {
    const match = answers.find(a => a.qNum === r.questionNumber) || { raw: '', conf: 90, isFlagged: false };
    let status: 'CONFIDENT' | 'REVIEW' | 'UNREADABLE' = 'CONFIDENT';
    if (match.conf < 50 || match.raw === '?') {
      status = 'UNREADABLE';
    } else if (match.conf < 85 || match.isFlagged) {
      status = 'REVIEW';
    }

    return {
      questionNumber: r.questionNumber,
      bbox: r.bbox,
      rawExtractedText: match.raw,
      normalizedAnswer: match.raw,
      confidence: match.conf,
      status,
      croppedImageUrl: r.cropDataUrl,
      isManuallyVerified: false
    };
  });

  const pages: CandidatePage[] = [
    {
      pageNumber: 1,
      originalImageUrl: docGen.canvas.toDataURL('image/jpeg', 0.92),
      width: docGen.canvas.width,
      height: docGen.canvas.height,
      answerRegions: regions
    }
  ];

  return {
    id: `sub-${candidateId.toLowerCase()}`,
    candidateId,
    name: candidateName,
    registrationNumber: regNo,
    appliedRole: role,
    assignedSet,
    batchCode: 'QMAX-BATCH-2026',
    createdAt: new Date().toISOString(),
    status: 'READY',
    pages
  };
}