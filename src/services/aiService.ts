import { 
  AnswerKey, 
  AnswerKeyQuestion, 
  CandidateSubmission, 
  QuestionEvaluationResult, 
  CandidateEvaluationResult, 
  AssessmentSettings,
  ErrorClassification,
  EvaluationVerdict 
} from '../types';
import { GeminiService } from './geminiService';

export class AIService {
  /**
   * Normalizes engineering units across Unicode variants (e.g. \u03BC vs \u00B5), abbreviations, and casing
   */
  static normalizeUnit(unit?: string): string {
    if (!unit) return '';
    let u = unit.trim().toLowerCase();
    
    // Standardize all micro variants: Greek mu (\u03BC), Micro sign (\u00B5), and ASCII 'u'
    u = u.replace(/[\u03BC\u00B5]/g, 'u');

    // Resistance
    if (u === 'ohm' || u === 'ohms' || u === 'ω' || u === 'o') return 'Ω';
    if (u === 'kohm' || u === 'kω' || u === 'k') return 'kΩ';
    if (u === 'mohm' || u === 'mω' || u === 'megohm') return 'MΩ';
    if (u === 'gohm' || u === 'gω') return 'GΩ';

    // Capacitance
    if (u === 'uf' || u === 'microf' || u === 'microfarad' || u === 'microfarads') return 'µF';
    if (u === 'pf' || u === 'picof' || u === 'picofarad') return 'pF';
    if (u === 'nf' || u === 'nanof' || u === 'nanofarad') return 'nF';
    if (u === 'mf' || u === 'millif' || u === 'millifarad') return 'mF';
    if (u === 'f' || u === 'farad' || u === 'farads') return 'F';

    // Inductance
    if (u === 'uh' || u === 'microh' || u === 'microhenry') return 'µH';
    if (u === 'mh' || u === 'millih' || u === 'millihenry') return 'mH';
    if (u === 'nh' || u === 'nanoh' || u === 'nanohenry') return 'nH';
    if (u === 'h' || u === 'henry' || u === 'henries') return 'H';

    // Voltage
    if (u === 'v' || u === 'volt' || u === 'volts') return 'V';
    if (u === 'mv' || u === 'millivolt') return 'mV';
    if (u === 'kv' || u === 'kilovolt') return 'kV';
    if (u === 'uv' || u === 'microvolt') return 'µV';

    // Current
    if (u === 'a' || u === 'amp' || u === 'amps' || u === 'ampere') return 'A';
    if (u === 'ma' || u === 'milliamp' || u === 'milliamps') return 'mA';
    if (u === 'ua' || u === 'microamp' || u === 'microamps') return 'µA';
    if (u === 'ka' || u === 'kiloamp') return 'kA';

    // Frequency
    if (u === 'hz' || u === 'hertz') return 'Hz';
    if (u === 'khz') return 'kHz';
    if (u === 'mhz') return 'MHz';
    if (u === 'ghz') return 'GHz';

    // Mechanics & Geometry
    if (u === 'm/s2' || u === 'm/s^2') return 'm/s²';
    if (u === 'm2' || u === 'm^2' || u === 'sqm') return 'm²';
    if (u === 'm3' || u === 'm^3') return 'm³';
    if (u === 'm' || u === 'meter' || u === 'meters') return 'm';
    if (u === 'cm') return 'cm';
    if (u === 'mm') return 'mm';

    // Angles & Percentage
    if (u === '°' || u === 'deg' || u === 'degree' || u === 'degrees') return '°';
    if (u === '%' || u === 'percent' || u === 'pct') return '%';

    return u;
  }

  /**
   * Extracts all numeric quantities (values + optional units) from a compound engineering string
   */
  static extractAllQuantities(str: string): Array<{
    value: number;
    unit: string;
    normalizedUnit: string;
    raw: string;
  }> {
    if (!str) return [];
    const results: Array<{ value: number; unit: string; normalizedUnit: string; raw: string }> = [];

    // Regex to find integers/decimals/scientific notation with attached or succeeding engineering units
    const pattern = /([+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*([a-zA-ZΩ\u00B5\u03BC°/%²³^0-9\-_]*)/g;
    let match;

    while ((match = pattern.exec(str)) !== null) {
      const val = parseFloat(match[1]);
      if (!isNaN(val)) {
        const rawUnit = (match[2] || '').trim();
        const normalizedUnit = this.normalizeUnit(rawUnit);

        results.push({
          value: val,
          unit: rawUnit,
          normalizedUnit,
          raw: match[0].trim()
        });
      }
    }

    return results;
  }

  /**
   * Deterministic semantic & numerical evaluator for a single technical question (Local engine fallback)
   */
  static evaluateAnswer(
    candidateRaw: string,
    question: AnswerKeyQuestion,
    settings: AssessmentSettings
  ): {
    verdict: EvaluationVerdict;
    errorType: ErrorClassification;
    marksAwarded: number;
    reason: string;
    confidence: number;
  } {
    const rawClean = (candidateRaw || '').trim();
    const expectedClean = (question.expectedAnswer || '').trim();

    if (!rawClean || rawClean === '?' || rawClean.toUpperCase() === 'UNKNOWN' || rawClean === '-' || rawClean.toUpperCase() === 'UNANSWERED') {
      return {
        verdict: 'INCORRECT',
        errorType: 'UNANSWERED',
        marksAwarded: 0,
        reason: 'Question left unattempted or answer area blank.',
        confidence: 99
      };
    }

    // Exact string match (ignoring case & whitespace)
    if (rawClean.toLowerCase() === expectedClean.toLowerCase()) {
      return {
        verdict: 'CORRECT',
        errorType: 'NONE',
        marksAwarded: question.maxMarks,
        reason: 'Exact technical answer match.',
        confidence: 98
      };
    }

    // Normalized symbol match (ignoring ≈, =, ~, :, commas, extra spaces)
    const normalizeSymbols = (s: string) => s.replace(/[\u03BC\u00B5]/g, 'u').replace(/[≈=~:,;]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    if (normalizeSymbols(rawClean) === normalizeSymbols(expectedClean)) {
      return {
        verdict: 'CORRECT',
        errorType: 'NONE',
        marksAwarded: question.maxMarks,
        reason: 'Exact match (symbols and whitespace normalized).',
        confidence: 98
      };
    }

    // Multi-Part and Compound Numerical Evaluation
    const expQuantities = this.extractAllQuantities(expectedClean);
    const candQuantities = this.extractAllQuantities(rawClean);
    const tolerancePct = question.tolerancePercent ?? settings.defaultTolerancePercent ?? 2.0;

    // Multi-value compound questions (e.g. Area, Circumference, Diameter or R1, R2)
    if (expQuantities.length >= 2 && candQuantities.length >= 1) {
      const usedCandIndices = new Set<number>();
      let matchedCount = 0;

      for (const expQ of expQuantities) {
        const allowedDelta = Math.max(Math.abs(expQ.value * (tolerancePct / 100)), 0.0001);
        
        let foundMatchIndex = -1;
        for (let i = 0; i < candQuantities.length; i++) {
          if (usedCandIndices.has(i)) continue;
          if (Math.abs(expQ.value - candQuantities[i].value) <= allowedDelta) {
            foundMatchIndex = i;
            break;
          }
        }

        if (foundMatchIndex !== -1) {
          usedCandIndices.add(foundMatchIndex);
          matchedCount++;
        }
      }

      if (matchedCount === expQuantities.length) {
        return {
          verdict: 'CORRECT',
          errorType: 'NONE',
          marksAwarded: question.maxMarks,
          reason: `All ${expQuantities.length} multi-part numerical values matched expected answers within ±${tolerancePct}% tolerance.`,
          confidence: 97
        };
      }

      if (matchedCount > 0 && settings.allowPartialCredit) {
        const partialRatio = matchedCount / expQuantities.length;
        const partialMarks = Number((question.maxMarks * partialRatio).toFixed(1));
        return {
          verdict: 'PARTIALLY_CORRECT',
          errorType: 'PARTIAL_FORMULA',
          marksAwarded: partialMarks,
          reason: `Matched ${matchedCount}/${expQuantities.length} multi-part values within ±${tolerancePct}% tolerance.`,
          confidence: 90
        };
      }

      if (matchedCount > 0 && !settings.allowPartialCredit) {
        return {
          verdict: 'INCORRECT',
          errorType: 'NUMERICAL_MISMATCH',
          marksAwarded: 0,
          reason: `Incomplete multi-part answer: Matched ${matchedCount}/${expQuantities.length} values. Partial credit is disabled.`,
          confidence: 90
        };
      }
    }

    // Single Numerical Quantity Evaluation (Candidate may include working/calculations e.g. "5 µF .'. 1/10 + 1/10 => 100/20 µF")
    if (expQuantities.length === 1 && candQuantities.length >= 1) {
      const expQ = expQuantities[0];
      const targetUnit = this.normalizeUnit(question.unit) || expQ.normalizedUnit;
      const allowedDelta = Math.max(Math.abs(expQ.value * (tolerancePct / 100)), 0.0001);

      // Check if ANY of candidate's extracted quantities matches both value & unit
      const exactCandidateMatch = candQuantities.find(candQ => {
        const isValueClose = Math.abs(expQ.value - candQ.value) <= allowedDelta;
        const isUnitMatching = !targetUnit || !candQ.normalizedUnit || 
          (targetUnit === candQ.normalizedUnit) ||
          (targetUnit === 'm²' && candQ.normalizedUnit === 'm');
        return isValueClose && isUnitMatching;
      });

      if (exactCandidateMatch) {
        return {
          verdict: 'CORRECT',
          errorType: 'NONE',
          marksAwarded: question.maxMarks,
          reason: Math.abs(expQ.value - exactCandidateMatch.value) === 0 
            ? 'Exact numerical value and unit match.' 
            : `Numerically equivalent within ±${tolerancePct}% configured engineering tolerance.`,
          confidence: 96
        };
      }

      // Check if candidate has correct value but mismatching unit
      const valueOnlyMatch = candQuantities.find(candQ => Math.abs(expQ.value - candQ.value) <= allowedDelta);
      if (valueOnlyMatch) {
        const partialMarks = settings.allowPartialCredit ? Number((question.maxMarks * 0.4).toFixed(1)) : 0;
        return {
          verdict: settings.allowPartialCredit ? 'PARTIALLY_CORRECT' : 'INCORRECT',
          errorType: 'UNIT_MISMATCH',
          marksAwarded: partialMarks,
          reason: `Unit mismatch: Expected [${question.unit || expQ.unit || targetUnit}], candidate provided [${valueOnlyMatch.unit || 'dimensionless'}].`,
          confidence: 95
        };
      }

      // No numerical match found
      return {
        verdict: 'INCORRECT',
        errorType: 'NUMERICAL_MISMATCH',
        marksAwarded: 0,
        reason: `Numerical value mismatch: Expected [${expectedClean}], candidate provided [${rawClean}]. Exceeds ±${tolerancePct}% tolerance.`,
        confidence: 94
      };
    }

    // Descriptive / Engineering Terminology Matching
    const expectedLower = expectedClean.toLowerCase();
    const candidateLower = rawClean.toLowerCase();

    const keywords = expectedLower.split(/\s+/).filter(w => w.length > 2);
    const matchedCount = keywords.filter(k => candidateLower.includes(k)).length;
    const matchRatio = keywords.length > 0 ? matchedCount / keywords.length : 0;

    if (matchRatio >= 0.75 || candidateLower.includes(expectedLower)) {
      return {
        verdict: 'CORRECT',
        errorType: 'NONE',
        marksAwarded: question.maxMarks,
        reason: 'Semantically equivalent engineering concept and justification.',
        confidence: 90
      };
    }

    if (matchRatio >= 0.35 && settings.allowPartialCredit) {
      const partialMarks = Number((question.maxMarks * 0.5).toFixed(1));
      return {
        verdict: 'PARTIALLY_CORRECT',
        errorType: 'PARTIAL_FORMULA',
        marksAwarded: partialMarks,
        reason: 'Partially correct concept with incomplete technical explanation.',
        confidence: 80
      };
    }

    return {
      verdict: 'INCORRECT',
      errorType: 'INCORRECT_CONCEPT',
      marksAwarded: 0,
      reason: `Incorrect response: Expected [${expectedClean}], candidate wrote [${rawClean}].`,
      confidence: 88
    };
  }

  /**
   * Evaluates a candidate submission against their specific Question Paper Set (Set A, Set B, Set C)
   */
  static evaluateCandidate(
    candidate: CandidateSubmission,
    answerKey: AnswerKey,
    settings: AssessmentSettings
  ): CandidateEvaluationResult {
    const targetSet = GeminiService.normalizeSetName(candidate.assignedSet || 'SET_A');
    
    // Filter questions for the candidate's assigned Set
    const setQuestions = answerKey.questions.filter(q => {
      const qSet = GeminiService.normalizeSetName(q.questionSet);
      return qSet === targetSet || qSet === 'ALL';
    });

    const activeQuestionsList = setQuestions.length > 0 ? setQuestions : answerKey.questions;
    const totalTargetQ = Math.max(20, activeQuestionsList.length);

    const candidateAnswersMap = new Map<number, {
      rawText: string;
      confidence: number;
      croppedImageUrl: string;
      manualOverride?: string;
      isManuallyVerified?: boolean;
    }>();

    candidate.pages.forEach(page => {
      page.answerRegions.forEach(region => {
        const effectiveText = region.manualOverride !== undefined 
          ? region.manualOverride 
          : (region.normalizedAnswer || region.rawExtractedText);

        candidateAnswersMap.set(region.questionNumber, {
          rawText: effectiveText,
          confidence: region.manualOverride !== undefined ? 100 : region.confidence,
          croppedImageUrl: region.croppedImageUrl,
          manualOverride: region.manualOverride,
          isManuallyVerified: region.isManuallyVerified
        });
      });
    });

    let correctCount = 0;
    let partialCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let reviewRequiredCount = 0;
    let totalMarksAwarded = 0;

    const questionResults: QuestionEvaluationResult[] = Array.from({ length: totalTargetQ }, (_, idx) => {
      const qNum = idx + 1;
      const q = activeQuestionsList.find(item => item.questionNumber === qNum) || {
        id: qNum,
        questionNumber: qNum,
        questionText: `Technical Problem ${qNum}`,
        expectedAnswer: 'N/A',
        maxMarks: 1,
        topic: 'Engineering Core',
        confidence: 99,
        status: 'CONFIDENT' as const
      };

      const entry = candidateAnswersMap.get(qNum);
      const candRaw = entry?.rawText || '-';
      const confidence = entry?.confidence ?? 90;
      const cropUrl = entry?.croppedImageUrl || '';

      const evalRes = this.evaluateAnswer(candRaw, q, settings);

      let verdict = evalRes.verdict;
      let errorType = evalRes.errorType;
      let marks = evalRes.marksAwarded;

      if (!entry?.isManuallyVerified && (confidence < settings.minConfidenceThreshold || evalRes.confidence < settings.minConfidenceThreshold)) {
        verdict = 'REVIEW_REQUIRED';
        reviewRequiredCount++;
      }

      if (verdict === 'CORRECT') correctCount++;
      else if (verdict === 'PARTIALLY_CORRECT') partialCount++;
      else if (evalRes.errorType === 'UNANSWERED') unansweredCount++;
      else incorrectCount++;

      totalMarksAwarded += marks;

      return {
        questionNumber: qNum,
        questionText: q.questionText,
        expectedAnswer: q.expectedAnswer,
        candidateAnswer: candRaw,
        questionSet: targetSet,
        verdict,
        errorType,
        confidence: Math.round((confidence + evalRes.confidence) / 2),
        maxMarks: q.maxMarks,
        marksAwarded: marks,
        reason: evalRes.reason,
        croppedImageUrl: cropUrl,
        isManuallyOverridden: entry?.isManuallyVerified
      };
    });

    const maxMarksPossible = questionResults.reduce((sum, q) => sum + q.maxMarks, 0);
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
  }

  /**
   * Asynchronously evaluates a candidate using Gemini Multimodal AI when key is available,
   * otherwise seamlessly falls back to high-precision local engine.
   */
  static async evaluateCandidateAsync(
    candidate: CandidateSubmission,
    answerKey: AnswerKey,
    settings: AssessmentSettings
  ): Promise<CandidateEvaluationResult> {
    if (GeminiService.isKeyConfigured()) {
      try {
        return await GeminiService.evaluateWithGemini(
          candidate,
          answerKey,
          settings,
          undefined,
          settings.aiModel || 'gemini-3.7-flash'
        );
      } catch (err) {
        console.warn('Gemini API evaluation failed, falling back to local deterministic engine:', err);
        return this.evaluateCandidate(candidate, answerKey, settings);
      }
    }
    return this.evaluateCandidate(candidate, answerKey, settings);
  }
}
