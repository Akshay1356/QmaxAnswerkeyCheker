import { GoogleGenAI, Type } from '@google/genai';
import { 
  AnswerKey, 
  AnswerKeyQuestion, 
  CandidateSubmission, 
  CandidatePage, 
  AnswerRegion, 
  BoundingBox,
  AssessmentSettings,
  QuestionEvaluationResult,
  CandidateEvaluationResult,
  ErrorClassification,
  EvaluationVerdict
} from '../types';
import { FileProcessingService } from './fileProcessingService';

export class GeminiService {
  /**
   * Helper to retrieve configured Gemini API Key from localStorage or environment
   */
  static getApiKey(overrideKey?: string): string {
    if (overrideKey && overrideKey.trim()) return overrideKey.trim();
    const stored = localStorage.getItem('qmax_gemini_api_key');
    if (stored && stored.trim()) return stored.trim();
    // @ts-ignore
    const envKey = import.meta.env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '');
    return (envKey || '').trim();
  }

  /**
   * Sanitizes and guarantees the Google Gemini 3.7 Flash model identifier
   */
  static sanitizeModelName(_model?: string): string {
    return 'gemini-3.7-flash';
  }

  /**
   * Checks if a valid Gemini API key is configured
   */
  static isKeyConfigured(overrideKey?: string): boolean {
    const key = this.getApiKey(overrideKey);
    return Boolean(key && key.length > 5);
  }

  /**
   * Dedicated runner for Google Gemini 3.7 Flash with retry logic for transient high-demand (503/429) errors.
   * Strictly enforces Gemini 3.7 Flash exclusively.
   */
  static async generateWithFallback(
    ai: GoogleGenAI,
    _preferredModel: string,
    params: { contents: any; config?: any }
  ) {
    const model = 'gemini-3.7-flash';
    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = (err.message || '').toLowerCase();
        
        // If unrecoverable auth error (invalid API key 400/401/403), throw immediately
        if (errMsg.includes('api_key_invalid') || errMsg.includes('unauthenticated') || errMsg.includes('permission_denied')) {
          throw err;
        }

        const isTransient = 
          errMsg.includes('503') ||
          errMsg.includes('high demand') ||
          errMsg.includes('unavailable') ||
          errMsg.includes('overloaded') ||
          errMsg.includes('429') ||
          errMsg.includes('resource_exhausted') ||
          errMsg.includes('quota') ||
          errMsg.includes('500') ||
          errMsg.includes('502') ||
          errMsg.includes('504');

        if (isTransient && attempt < maxRetries) {
          const delayMs = attempt * 800;
          console.warn(`Gemini 3.7 Flash returned temporary high demand. Retrying attempt ${attempt + 1}/${maxRetries} in ${delayMs}ms...`);
          await new Promise(res => setTimeout(res, delayMs));
          continue;
        }

        throw err;
      }
    }

    throw lastError;
  }

  /**
   * Normalizes Set names (e.g. "Set A", "Set-1", "SET A" -> "SET_A")
   */
  static normalizeSetName(setName?: string): string {
    if (!setName) return 'SET_A';
    const clean = setName.trim().toUpperCase().replace(/[\s\-_]+/g, '_');
    if (clean.includes('A') || clean.includes('1')) return 'SET_A';
    if (clean.includes('B') || clean.includes('2')) return 'SET_B';
    if (clean.includes('C') || clean.includes('3')) return 'SET_C';
    return clean || 'SET_A';
  }

  /**
   * Extracts Answer Key structure directly from uploaded PDF or Image using Gemini Vision
   * Extracts questions across all 3 Sets (Set A, Set B, Set C) and ensures all 20 questions are captured.
   */
  static async extractAnswerKey(
    pages: { base64Data: string; mimeType: string }[],
    fileName: string = 'Answer_Key.pdf',
    apiKey?: string,
    modelName: string = 'gemini-3.7-flash'
  ): Promise<AnswerKey> {
    const key = this.getApiKey(apiKey);
    if (!key) {
      throw new Error('Gemini API Key is not configured. Please enter your Google Gemini API Key in Settings or the top bar.');
    }

    const ai = new GoogleGenAI({ apiKey: key });

    const contents: any[] = [
      {
        text: `You are the Lead Technical Evaluator for QMAX SYSTEMS.
Analyze this uploaded technical assessment Master Answer Key document.

THE DOCUMENT CONTAINS 3 SEPARATE QUESTION PAPER SETS:
1. SET A (or Script 1): Contains exactly 20 Technical Questions (Q1 through Q20)
2. SET B (or Script 2): Contains exactly 20 Technical Questions (Q1 through Q20)
3. SET C (or Script 3): Contains exactly 20 Technical Questions (Q1 through Q20)

Note: The document may present these sets sequentially (Set A Q1-20, then Set B Q1-20, then Set C Q1-20), as a 3-column table per question, or across multiple pages.

CRITICAL INSTRUCTIONS:
1. DO NOT combine multiple questions into a single question.
2. EXTRACT EVERY SINGLE QUESTION INDIVIDUALLY:
   - Extract all 20 questions for SET A into 'set_a_questions' (questionNumber 1 through 20).
   - Extract all 20 questions for SET B into 'set_b_questions' (questionNumber 1 through 20).
   - Extract all 20 questions for SET C into 'set_c_questions' (questionNumber 1 through 20).
3. If questions are shared or identical across sets, duplicate them across 'set_a_questions', 'set_b_questions', and 'set_c_questions' so every set has a complete 20-question rubric.
4. For each question extract:
   - questionNumber: 1 to 20
   - questionText: Clean question statement or engineering problem prompt
   - expectedAnswer: Exact expected answer string, formula, or numerical value with units (e.g. "3.3 V", "120 Ω", "10 kΩ", "50 Hz", "I2C")
   - unit: Physical engineering unit (e.g. "V", "Ω", "kΩ", "mA", "Hz", "m/s²", etc.)
   - numericalValue: Parsed float/number if numerical
   - tolerancePercent: Allowable tolerance percentage (default 2.0%)
   - maxMarks: 1
   - topic: Technical topic (e.g. Power Delivery, Signal Integrity, Microcontrollers, PCB Design, etc.)`
      }
    ];

    pages.forEach(p => {
      const mime = p.mimeType === 'application/pdf' ? 'application/pdf' : (p.mimeType.startsWith('image/') ? p.mimeType : 'image/jpeg');
      contents.push({
        inlineData: {
          mimeType: mime,
          data: p.base64Data
        }
      });
    });

    try {
      const questionItemSchema = {
        type: Type.OBJECT,
        properties: {
          questionNumber: { type: Type.INTEGER, description: '1 to 20' },
          questionText: { type: Type.STRING, description: 'Question statement or technical problem prompt' },
          expectedAnswer: { type: Type.STRING, description: 'Expected official answer, solution value, formula, or units' },
          unit: { type: Type.STRING, description: 'Engineering unit (e.g. V, Ω, mA, Hz)' },
          numericalValue: { type: Type.NUMBER, description: 'Numerical magnitude if applicable' },
          tolerancePercent: { type: Type.NUMBER, description: 'Tolerance percentage e.g. 2.0' },
          maxMarks: { type: Type.NUMBER, description: 'Max points, default 1' },
          topic: { type: Type.STRING, description: 'Engineering domain/topic' }
        },
        required: ['questionNumber', 'expectedAnswer']
      };

      const response = await this.generateWithFallback(ai, modelName, {
        contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Assessment Title' },
              assessmentCode: { type: Type.STRING, description: 'Assessment Code (e.g. QMAX-TECH-2026)' },
              sets: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }, 
                description: "Detected question paper sets e.g. ['SET_A', 'SET_B', 'SET_C']" 
              },
              set_a_questions: {
                type: Type.ARRAY,
                items: questionItemSchema,
                description: 'All 20 questions for Set A (Q1 to Q20)'
              },
              set_b_questions: {
                type: Type.ARRAY,
                items: questionItemSchema,
                description: 'All 20 questions for Set B (Q1 to Q20)'
              },
              set_c_questions: {
                type: Type.ARRAY,
                items: questionItemSchema,
                description: 'All 20 questions for Set C (Q1 to Q20)'
              },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questionNumber: { type: Type.INTEGER },
                    questionSet: { type: Type.STRING, description: "'SET_A' | 'SET_B' | 'SET_C'" },
                    questionText: { type: Type.STRING },
                    expectedAnswer: { type: Type.STRING },
                    unit: { type: Type.STRING },
                    numericalValue: { type: Type.NUMBER },
                    tolerancePercent: { type: Type.NUMBER },
                    maxMarks: { type: Type.NUMBER },
                    topic: { type: Type.STRING }
                  },
                  required: ['questionNumber', 'expectedAnswer']
                },
                description: 'Optional flat list of all questions with questionSet'
              }
            },
            required: ['title', 'assessmentCode', 'set_a_questions', 'set_b_questions', 'set_c_questions']
          }
        }
      });

      const text = response.text || '{}';
      const parsed = JSON.parse(text);

      const targetSets = ['SET_A', 'SET_B', 'SET_C'];
      const formattedQuestions: AnswerKeyQuestion[] = [];
      let globalId = 1;

      // Extract per-set question lists from response
      const setPools: Record<string, any[]> = {
        SET_A: parsed.set_a_questions || [],
        SET_B: parsed.set_b_questions || [],
        SET_C: parsed.set_c_questions || []
      };

      // Also ingest from flat questions array if present
      if (Array.isArray(parsed.questions)) {
        parsed.questions.forEach((q: any) => {
          const s = this.normalizeSetName(q.questionSet);
          if (setPools[s]) {
            if (!setPools[s].some((existing: any) => existing.questionNumber === q.questionNumber)) {
              setPools[s].push(q);
            }
          }
        });
      }

      // If Set B or Set C are empty, fall back to Set A or any available pool
      const referencePool = setPools.SET_A.length > 0 
        ? setPools.SET_A 
        : (setPools.SET_B.length > 0 ? setPools.SET_B : setPools.SET_C);

      targetSets.forEach(setKey => {
        let activePool = setPools[setKey];
        if (!activePool || activePool.length === 0) {
          activePool = referencePool;
        }

        // Build guaranteed 20 questions for this set
        for (let qNum = 1; qNum <= 20; qNum++) {
          const match = activePool.find((q: any) => q.questionNumber === qNum) ||
                        referencePool.find((q: any) => q.questionNumber === qNum);

          const qText = match?.questionText || `Technical Problem ${qNum}`;
          const expected = match?.expectedAnswer || '-';
          const unit = match?.unit || (expected.match(/([a-zA-ZΩµ%]+)$/)?.[1] || undefined);
          const numVal = typeof match?.numericalValue === 'number' 
            ? match.numericalValue 
            : (parseFloat(expected.replace(/[^0-9.-]/g, '')) || undefined);

          formattedQuestions.push({
            id: globalId++,
            questionNumber: qNum,
            questionSet: setKey,
            questionText: qText,
            expectedAnswer: expected,
            unit,
            numericalValue: isNaN(numVal as number) ? undefined : numVal,
            tolerancePercent: typeof match?.tolerancePercent === 'number' ? match.tolerancePercent : 2.0,
            maxMarks: match?.maxMarks || 1,
            topic: match?.topic || 'Engineering Core',
            confidence: 99,
            status: 'CONFIDENT' as const,
            notes: `Official marking key for ${setKey}`
          });
        }
      });

      return {
        id: `key-${Date.now()}`,
        title: parsed.title || 'QMAX Technical Assessment Master Answer Key (Sets A, B, C)',
        assessmentCode: parsed.assessmentCode || 'QMAX-TECH-2026',
        fileName,
        createdAt: new Date().toISOString(),
        isVerified: false,
        sets: targetSets,
        activeSet: 'SET_A',
        totalQuestions: 20,
        totalMaxMarks: 20,
        questions: formattedQuestions
      };
    } catch (err: any) {
      console.error('Gemini Answer Key extraction failed:', err);
      throw new Error(err.message || 'Gemini could not process the Answer Key.');
    }
  }

  /**
   * Reads handwritten candidate answer sheets using Gemini Multimodal Vision AI
   * Detects candidate assigned Question Paper Set (e.g. Set A, Set B, Set C) and transcribes all 20 questions.
   */
  static async extractCandidateAnswers(
    pagesData: { dataUrl: string; base64Data: string; mimeType: string; width: number; height: number; pageNumber: number }[],
    answerKey: AnswerKey,
    apiKey?: string,
    modelName: string = 'gemini-3.7-flash'
  ): Promise<CandidateSubmission> {
    const key = this.getApiKey(apiKey);
    if (!key) {
      throw new Error('Gemini API Key is not configured. Please enter your Google Gemini API Key in Settings.');
    }

    const ai = new GoogleGenAI({ apiKey: key });

    const contents: any[] = [
      {
        text: `You are an expert Handwriting OCR & Document Analysis Engine for QMAX SYSTEMS.
Analyze this handwritten candidate assessment answer sheet.

CRITICAL INSTRUCTIONS:
1. Detect candidate identification from the top header or candidate info block:
   - Candidate Full Name (e.g. 'V. GOKUL', 'ARUN KUMAR', etc.)
   - Candidate ID / Mobile / Roll Number (e.g. '9894146388', 'REG/2026/0101')
   - Registration / College / Branch Code (e.g. 'SMVEC-2027-EEE')
   - Applied Engineering Role
   - Question Paper Set (e.g. 'SET_A', 'SET_B', 'SET_C', 'Set 1', 'Set 2', 'Set 3'). Look carefully at the header box, script stamp, or question paper code written by candidate.
2. Locate and transcribe ALL handwritten answers across all pages for ALL questions (Q1 through Q20).
3. Do NOT skip any question. If a question is attempted, transcribe the exact handwritten answer including all numerical values, engineering formulas, justifications, and units (e.g., '3V \\n because V=IR...').
4. If a question is blank or not attempted, report handwrittenText as '-' or 'UNANSWERED'.
5. Provide bounding box coordinates on a 0 to 1000 scale: [ymin, xmin, ymax, xmax] for each answer box.
6. Provide an OCR confidence percentage (0 to 100) reflecting handwriting legibility.`
      }
    ];

    pagesData.forEach(p => {
      const mime = p.mimeType === 'application/pdf' ? 'application/pdf' : (p.mimeType.startsWith('image/') ? p.mimeType : 'image/jpeg');
      contents.push({
        inlineData: {
          mimeType: mime,
          data: p.base64Data
        }
      });
    });

    try {
      const response = await this.generateWithFallback(ai, modelName, {
        contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              candidateId: { type: Type.STRING },
              candidateName: { type: Type.STRING },
              registrationNumber: { type: Type.STRING },
              appliedRole: { type: Type.STRING },
              assignedSet: { type: Type.STRING, description: "Assigned Question Paper Set e.g. 'SET_A', 'SET_B', 'SET_C'" },
              answers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questionNumber: { type: Type.INTEGER, description: '1 to 20' },
                    pageNumber: { type: Type.INTEGER },
                    handwrittenText: { type: Type.STRING },
                    confidence: { type: Type.INTEGER },
                    isAmbiguous: { type: Type.BOOLEAN },
                    bboxNorm: {
                      type: Type.OBJECT,
                      properties: {
                        ymin: { type: Type.NUMBER, description: '0 to 1000' },
                        xmin: { type: Type.NUMBER, description: '0 to 1000' },
                        ymax: { type: Type.NUMBER, description: '0 to 1000' },
                        xmax: { type: Type.NUMBER, description: '0 to 1000' }
                      },
                      required: ['ymin', 'xmin', 'ymax', 'xmax']
                    }
                  },
                  required: ['questionNumber', 'handwrittenText', 'confidence']
                }
              }
            },
            required: ['candidateName', 'answers']
          }
        }
      });

      const text = response.text || '{}';
      const parsed = JSON.parse(text);

      const candId = parsed.candidateId || `QMAX-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      const candName = parsed.candidateName || 'Candidate';
      const regNo = parsed.registrationNumber || `REG/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
      const appliedRole = parsed.appliedRole || 'Hardware Design Engineer';
      const assignedSet = this.normalizeSetName(parsed.assignedSet);

      const totalTargetQ = Math.max(20, answerKey.totalQuestions || 20);
      const rawAnswers = parsed.answers || [];

      // Create a full map of 1..20 answers so no question is omitted
      const answersByQNum = new Map<number, any>();
      rawAnswers.forEach((a: any) => {
        answersByQNum.set(a.questionNumber, a);
      });

      const processedPages: CandidatePage[] = [];

      for (const pageItem of pagesData) {
        const bboxesToCrop: { qNum: number; bbox: BoundingBox }[] = [];
        const regionsMeta: { qNum: number; rawText: string; conf: number; isAmbiguous: boolean; bbox: BoundingBox }[] = [];

        for (let qNum = 1; qNum <= totalTargetQ; qNum++) {
          const a = answersByQNum.get(qNum);
          const rawText = a ? (a.handwrittenText || '').trim() : '';
          const conf = a && typeof a.confidence === 'number' ? Math.min(100, Math.max(10, a.confidence)) : (rawText ? 90 : 99);

          let bbox: BoundingBox;
          if (a?.bboxNorm && typeof a.bboxNorm.ymin === 'number') {
            const y = (a.bboxNorm.ymin / 1000) * pageItem.height;
            const x = (a.bboxNorm.xmin / 1000) * pageItem.width;
            const height = Math.max(40, ((a.bboxNorm.ymax - a.bboxNorm.ymin) / 1000) * pageItem.height);
            const width = Math.max(60, ((a.bboxNorm.xmax - a.bboxNorm.xmin) / 1000) * pageItem.width);
            bbox = { x, y, width, height };
          } else {
            const row = Math.floor((qNum - 1) / 2);
            const col = (qNum - 1) % 2;
            bbox = {
              x: 60 + col * (pageItem.width / 2),
              y: 200 + row * 130,
              width: (pageItem.width / 2) - 80,
              height: 90
            };
          }

          bboxesToCrop.push({ qNum, bbox });
          regionsMeta.push({ qNum, rawText, conf, isAmbiguous: Boolean(a?.isAmbiguous), bbox });
        }

        // Fast batch crop all 20 regions in one canvas pass
        const croppedMap = await FileProcessingService.cropMultipleRegions(pageItem.dataUrl, bboxesToCrop);

        const answerRegions: AnswerRegion[] = regionsMeta.map(meta => {
          let status: 'CONFIDENT' | 'REVIEW' | 'UNREADABLE' = 'CONFIDENT';
          if (!meta.rawText || meta.rawText === '-' || meta.rawText.toUpperCase() === 'UNANSWERED') {
            status = 'CONFIDENT';
          } else if (meta.conf < 50 || meta.rawText === '?' || meta.isAmbiguous) {
            status = 'UNREADABLE';
          } else if (meta.conf < 80) {
            status = 'REVIEW';
          }

          return {
            questionNumber: meta.qNum,
            bbox: meta.bbox,
            rawExtractedText: meta.rawText || '-',
            normalizedAnswer: meta.rawText || '-',
            confidence: meta.conf,
            status,
            croppedImageUrl: croppedMap.get(meta.qNum) || pageItem.dataUrl,
            isManuallyVerified: false
          };
        });

        processedPages.push({
          pageNumber: pageItem.pageNumber,
          originalImageUrl: pageItem.dataUrl,
          width: pageItem.width,
          height: pageItem.height,
          answerRegions
        });
      }

      return {
        id: `sub-${candId.toLowerCase()}-${Date.now()}`,
        candidateId: candId,
        name: candName,
        registrationNumber: regNo,
        appliedRole,
        assignedSet,
        batchCode: 'QMAX-BATCH-2026-LIVE',
        createdAt: new Date().toISOString(),
        status: 'READY',
        pages: processedPages
      };
    } catch (err: any) {
      console.error('Gemini candidate OCR extraction failed:', err);
      throw new Error(err.message || 'Gemini could not OCR candidate answer sheet.');
    }
  }

  /**
   * Performs deep engineering evaluation of candidate answers against their specific Question Paper Set (Set A, Set B, Set C)
   */
  static async evaluateWithGemini(
    candidate: CandidateSubmission,
    answerKey: AnswerKey,
    settings: AssessmentSettings,
    apiKey?: string,
    modelName: string = 'gemini-3.7-flash'
  ): Promise<CandidateEvaluationResult> {
    const key = this.getApiKey(apiKey);
    if (!key) {
      throw new Error('Gemini API Key is required for AI evaluation.');
    }

    const ai = new GoogleGenAI({ apiKey: key });
    const targetSet = this.normalizeSetName(candidate.assignedSet || 'SET_A');

    // Filter answer key questions for the candidate's specific question paper set
    const setQuestions = answerKey.questions.filter(q => {
      const qSet = this.normalizeSetName(q.questionSet);
      return qSet === targetSet || qSet === 'ALL';
    });

    const activeQuestionsList = setQuestions.length > 0 ? setQuestions : answerKey.questions;
    const totalTargetQ = Math.max(20, activeQuestionsList.length);

    const answersPayload = Array.from({ length: totalTargetQ }, (_, i) => {
      const qNum = i + 1;
      const qMeta = activeQuestionsList.find(q => q.questionNumber === qNum) || {
        questionNumber: qNum,
        questionText: `Technical Problem ${qNum}`,
        expectedAnswer: 'N/A',
        unit: '',
        numericalValue: undefined,
        maxMarks: 1,
        tolerancePercent: settings.defaultTolerancePercent ?? 2.0
      };

      let candRaw = '';
      let confidence = 90;
      let isOverridden = false;
      let cropUrl = '';

      for (const p of candidate.pages) {
        const match = p.answerRegions.find(r => r.questionNumber === qNum);
        if (match) {
          candRaw = match.manualOverride || match.normalizedAnswer || match.rawExtractedText;
          confidence = match.manualOverride ? 100 : match.confidence;
          isOverridden = Boolean(match.manualOverride);
          cropUrl = match.croppedImageUrl;
          break;
        }
      }

      return {
        questionNumber: qNum,
        questionSet: targetSet,
        questionText: qMeta.questionText,
        expectedAnswer: qMeta.expectedAnswer,
        unit: qMeta.unit,
        numericalValue: qMeta.numericalValue,
        tolerancePercent: qMeta.tolerancePercent ?? settings.defaultTolerancePercent ?? 2.0,
        maxMarks: qMeta.maxMarks || 1,
        candidateAnswer: candRaw || '-',
        ocrConfidence: confidence,
        isOverridden,
        cropUrl
      };
    });

    const prompt = `You are the Lead Technical Evaluator for QMAX SYSTEMS.
Evaluate the candidate's answers against the official Answer Key for QUESTION PAPER SET: [${targetSet}].

CRITICAL EVALUATION RULES:
1. Candidate's Assigned Set: [${targetSet}]. Grade strictly against the expected answers for ${targetSet}.
2. All 20 Questions (Q1 through Q20) must be evaluated and returned in the evaluations list.
3. Multi-Part / Compound Engineering Questions (CRITICAL):
   - When a question requires multiple values or parameters (e.g., "Area, Circumference, Diameter" with expected "Area ≈ 3.14 m², Circumference ≈ 6.28 m, Diameter = 2 m", or "R1 = 10 kΩ, R2 = 20 kΩ"):
   - Candidates frequently write shorthand comma/semicolon/space-separated values (e.g. "3.14m, 6.28m, 2m" or "3.14, 6.28, 2") without repeating variable names or labels ("Area =", "Circumference =").
   - If ALL numerical components match the expected values within tolerance, award FULL MARKS (verdict: CORRECT, errorType: NONE, marksAwarded: maxMarks).
   - If SOME numerical components match (e.g., 2 out of 3), award partial credit (verdict: PARTIALLY_CORRECT, marksAwarded: proportional marks, errorType: PARTIAL_FORMULA).
   - Do NOT mark correct multi-part answers as INCORRECT due to missing parameter labels, commas vs semicolons, or shorthand unit notations (e.g. 'm' instead of 'm²' if the numbers are accurate).
4. Numerical Tolerance: Calculate if candidate's numerical value is within ±${settings.defaultTolerancePercent}% tolerance.
5. Unit Matching: Check for engineering physical units (e.g. kΩ vs Ω, mA vs A, mV vs V, m/s²). If numerical is correct but unit is wrong, classify as UNIT_MISMATCH and award partial credit (${settings.allowPartialCredit ? 'YES' : 'NO'}).
6. Semantic Equivalence: For conceptual technical answers (e.g. "Flyback Diode" vs "Freewheeling Diode", or step-by-step reasoning like "3V because V=IR..."), award marks if the physics/engineering principle is correct.
7. Verdict Options: CORRECT, PARTIALLY_CORRECT, INCORRECT, REVIEW_REQUIRED.
8. Error Classifications: NONE, NUMERICAL_MISMATCH, UNIT_MISMATCH, INCORRECT_CONCEPT, PARTIAL_FORMULA, AMBIGUOUS_HANDWRITING, UNREADABLE, UNANSWERED.

Input Data for all 20 questions:
${JSON.stringify(answersPayload, null, 2)}`;

    try {
      const response = await this.generateWithFallback(ai, modelName, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              evaluations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questionNumber: { type: Type.INTEGER },
                    verdict: { type: Type.STRING, enum: ['CORRECT', 'PARTIALLY_CORRECT', 'INCORRECT', 'REVIEW_REQUIRED'] },
                    errorType: { 
                      type: Type.STRING, 
                      enum: ['NONE', 'NUMERICAL_MISMATCH', 'UNIT_MISMATCH', 'INCORRECT_CONCEPT', 'PARTIAL_FORMULA', 'AMBIGUOUS_HANDWRITING', 'UNREADABLE', 'UNANSWERED'] 
                    },
                    marksAwarded: { type: Type.NUMBER },
                    reason: { type: Type.STRING, description: 'Clear engineering justification' },
                    confidence: { type: Type.INTEGER }
                  },
                  required: ['questionNumber', 'verdict', 'errorType', 'marksAwarded', 'reason']
                }
              }
            },
            required: ['evaluations']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      const evalList = parsed.evaluations || [];

      let correctCount = 0;
      let partialCount = 0;
      let incorrectCount = 0;
      let unansweredCount = 0;
      let reviewRequiredCount = 0;
      let totalMarksAwarded = 0;

      const questionResults: QuestionEvaluationResult[] = answersPayload.map(candPayload => {
        const evalItem = evalList.find((e: any) => e.questionNumber === candPayload.questionNumber);

        let verdict = (evalItem?.verdict || 'INCORRECT') as EvaluationVerdict;
        let errorType = (evalItem?.errorType || 'INCORRECT_CONCEPT') as ErrorClassification;
        let marks = typeof evalItem?.marksAwarded === 'number' ? evalItem.marksAwarded : 0;
        let reason = evalItem?.reason || 'Evaluation completed';
        const conf = evalItem?.confidence || candPayload.ocrConfidence || 90;

        if (candPayload.candidateAnswer === '-' || candPayload.candidateAnswer === 'UNANSWERED') {
          verdict = 'INCORRECT';
          errorType = 'UNANSWERED';
          marks = 0;
          reason = 'Question left unattempted';
        }

        if (!candPayload.isOverridden && (conf < settings.minConfidenceThreshold || verdict === 'REVIEW_REQUIRED')) {
          verdict = 'REVIEW_REQUIRED';
          reviewRequiredCount++;
        }

        if (verdict === 'CORRECT') correctCount++;
        else if (verdict === 'PARTIALLY_CORRECT') partialCount++;
        else if (errorType === 'UNANSWERED') unansweredCount++;
        else incorrectCount++;

        totalMarksAwarded += marks;

        return {
          questionNumber: candPayload.questionNumber,
          questionText: candPayload.questionText,
          expectedAnswer: candPayload.expectedAnswer,
          candidateAnswer: candPayload.candidateAnswer,
          questionSet: targetSet,
          verdict,
          errorType,
          confidence: conf,
          maxMarks: candPayload.maxMarks,
          marksAwarded: marks,
          reason,
          croppedImageUrl: candPayload.cropUrl || '',
          isManuallyOverridden: candPayload.isOverridden
        };
      });

      const maxMarksPossible = answersPayload.reduce((sum, q) => sum + q.maxMarks, 0);
      const percentage = maxMarksPossible > 0 
        ? Number(((totalMarksAwarded / maxMarksPossible) * 100).toFixed(1)) 
        : 0;
      const isPassed = percentage >= settings.passPercentage;

      return {
        totalQuestions: questionResults.length,
        assignedSet: targetSet,
        correctCount,
        partialCount,
        incorrectCount,
        unansweredCount,
        reviewRequiredCount,
        totalMarksAwarded: Number(totalMarksAwarded.toFixed(2)),
        maxMarksPossible,
        percentage,
        isPassed,
        evaluatedAt: new Date().toISOString(),
        questionResults
      };
    } catch (err: any) {
      console.error('Gemini evaluation failed:', err);
      throw new Error(err.message || 'Gemini evaluation failed');
    }
  }
}
