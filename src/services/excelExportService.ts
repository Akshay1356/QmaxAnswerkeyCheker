import * as XLSX from 'xlsx';
import { CandidateSubmission, AnswerKey } from '../types';

export class ExcelExportService {
  /**
   * Generates the multi-sheet Excel report adhering to QMAX ATLAS specifications.
   * Supports 3 Question Paper Sets (Set A, Set B, Set C) and ensures all 20 questions are itemized.
   */
  static exportAssessmentWorkbook(
    candidates: CandidateSubmission[],
    answerKey: AnswerKey,
    filename: string = `QMAX_ATLAS_Consolidated_Evaluation_${new Date().toISOString().slice(0, 10)}.xlsx`
  ) {
    const wb = XLSX.utils.book_new();
    const evaluatedCandidates = candidates.filter(c => c.evaluationResult);

    // Determine the total number of questions across answer key and candidate submissions (minimum 20)
    let maxQuestionNumber = Math.max(20, answerKey.totalQuestions || 0);
    evaluatedCandidates.forEach(cand => {
      if (cand.evaluationResult?.questionResults) {
        cand.evaluationResult.questionResults.forEach(qr => {
          if (qr.questionNumber > maxQuestionNumber) {
            maxQuestionNumber = qr.questionNumber;
          }
        });
      }
      cand.pages.forEach(p => {
        p.answerRegions.forEach(r => {
          if (r.questionNumber > maxQuestionNumber) {
            maxQuestionNumber = r.questionNumber;
          }
        });
      });
    });

    const qCount = maxQuestionNumber;

    // ==========================================
    // SHEET 1: Candidate Consolidated Results
    // Format: name | candidate_id | reg_no | set | q1 | q2 | ... | q20 | total marks
    // Question columns contain the EXPECTED ANSWER reference row(s) followed by CANDIDATE ACTUAL ANSWERS
    // ==========================================
    const sheet1Headers = [
      'name',
      'candidate_id',
      'reg_no',
      'set',
      ...Array.from({ length: qCount }, (_, i) => `q${i + 1}`),
      'total marks'
    ];

    // Determine sets present in answer key or evaluated candidates
    const distinctSets = (answerKey.sets && answerKey.sets.length > 0 
      ? answerKey.sets 
      : Array.from(new Set([
          ...answerKey.questions.map(q => q.questionSet).filter((s): s is string => Boolean(s)),
          ...evaluatedCandidates.map(c => c.assignedSet || c.evaluationResult?.assignedSet).filter((s): s is string => Boolean(s))
        ])));
    const activeSetsList: string[] = distinctSets.length > 0 ? distinctSets : ['SET_A'];

    // Generate Expected Answer Key Row(s) for each set
    const expectedAnswerRows: (string | number)[][] = activeSetsList.map((setKey: string) => {
      const setKeyNorm = setKey.toUpperCase();
      const setQuestions = answerKey.questions.filter(q => {
        const qSet = (q.questionSet || '').toUpperCase();
        return !qSet || qSet === setKeyNorm || qSet === 'ALL';
      });

      const activeSetQuestions = setQuestions.length > 0 ? setQuestions : answerKey.questions;
      let setMaxMarks = 0;

      const expectedQValues = Array.from({ length: qCount }, (_, i) => {
        const qNum = i + 1;
        const qItem = activeSetQuestions.find(q => q.questionNumber === qNum);
        if (qItem) {
          setMaxMarks += (qItem.maxMarks || 1);
          return qItem.expectedAnswer || '-';
        }
        return '-';
      });

      const setNameLabel = activeSetsList.length > 1 
        ? `EXPECTED ANSWER (${setKeyNorm.replace('_', ' ')})`
        : 'EXPECTED ANSWER KEY';

      return [
        setNameLabel,
        `KEY-${setKeyNorm}`,
        '-',
        setKeyNorm,
        ...expectedQValues,
        setMaxMarks > 0 ? setMaxMarks : qCount
      ];
    });

    const candidateRows = evaluatedCandidates.map(cand => {
      const res = cand.evaluationResult!;
      const qAnsMap = new Map<number, string>();
      
      res.questionResults.forEach(qr => {
        qAnsMap.set(qr.questionNumber, qr.candidateAnswer);
      });

      // Also check candidate answer regions if questionResults had omissions
      cand.pages.forEach(p => {
        p.answerRegions.forEach(r => {
          if (!qAnsMap.has(r.questionNumber) || qAnsMap.get(r.questionNumber) === 'UNKNOWN') {
            const txt = r.manualOverride || r.normalizedAnswer || r.rawExtractedText;
            if (txt) qAnsMap.set(r.questionNumber, txt);
          }
        });
      });

      const qValues = Array.from({ length: qCount }, (_, i) => {
        const val = qAnsMap.get(i + 1);
        return val !== undefined && val !== '' && val !== 'UNKNOWN' ? val : '-';
      });

      return [
        cand.name || 'Candidate',
        cand.candidateId,
        cand.registrationNumber || 'N/A',
        cand.assignedSet || res.assignedSet || 'SET_A',
        ...qValues,
        res.totalMarksAwarded
      ];
    });

    const sheet1AllRows = [
      sheet1Headers,
      ...expectedAnswerRows,
      ...candidateRows
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(sheet1AllRows);
    ws1['!cols'] = [
      { wch: 28 }, // name / expected answer title
      { wch: 16 }, // candidate_id
      { wch: 18 }, // reg_no
      { wch: 10 }, // set
      ...Array.from({ length: qCount }, () => ({ wch: 20 })), // q1..q20
      { wch: 14 }  // total marks
    ];

    XLSX.utils.book_append_sheet(wb, ws1, 'Candidate Results');

    // ==========================================
    // SHEET 2: Detailed Evaluation Breakdown
    // Columns: Candidate | ID | Set | Question | Expected Answer | Candidate Answer | Verdict | Error | Marks | Max | Reason
    // ==========================================
    const sheet2Headers = [
      'Candidate Name',
      'Candidate ID',
      'Registration No',
      'Assigned Set',
      'Question',
      'Expected Answer (Per Set)',
      'Candidate Answer',
      'Verdict',
      'Error Classification',
      'Confidence (%)',
      'Marks Awarded',
      'Max Marks',
      'Evaluator Reasoning'
    ];

    const sheet2Rows: (string | number)[][] = [];
    evaluatedCandidates.forEach(cand => {
      const res = cand.evaluationResult!;
      const setTag = cand.assignedSet || res.assignedSet || 'SET_A';
      
      res.questionResults.forEach(qr => {
        sheet2Rows.push([
          cand.name,
          cand.candidateId,
          cand.registrationNumber || 'N/A',
          setTag,
          `Q${String(qr.questionNumber).padStart(2, '0')}`,
          qr.expectedAnswer,
          qr.candidateAnswer,
          qr.verdict,
          qr.errorType,
          qr.confidence,
          qr.marksAwarded,
          qr.maxMarks,
          qr.reason
        ]);
      });
    });

    const ws2 = XLSX.utils.aoa_to_sheet([sheet2Headers, ...sheet2Rows]);
    ws2['!cols'] = [
      { wch: 22 },
      { wch: 16 },
      { wch: 18 },
      { wch: 14 },
      { wch: 12 },
      { wch: 24 },
      { wch: 24 },
      { wch: 18 },
      { wch: 22 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 45 }
    ];
    XLSX.utils.book_append_sheet(wb, ws2, 'Detailed Evaluation');

    // ==========================================
    // SHEET 3: Question & Set Analysis (Set A, B, C)
    // ==========================================
    const sheet3Headers = [
      'Set',
      'Question',
      'Topic / Concept',
      'Expected Answer',
      'Max Marks',
      'Candidate Attempts',
      'Correct Count',
      'Partial Count',
      'Incorrect Count',
      'Average Marks',
      'Accuracy (%)'
    ];

    const sheet3Rows: (string | number)[][] = [];
    const analysisSetsList: string[] = answerKey.sets && answerKey.sets.length > 0 ? answerKey.sets : ['SET_A', 'SET_B', 'SET_C'];

    analysisSetsList.forEach(setKey => {
      const setQuestions = answerKey.questions.filter(q => !q.questionSet || q.questionSet === setKey || q.questionSet === 'ALL');
      const setCandidates = evaluatedCandidates.filter(c => (c.assignedSet || 'SET_A') === setKey);

      setQuestions.forEach(q => {
        let attempts = 0;
        let correct = 0;
        let partial = 0;
        let incorrect = 0;
        let totalMarksAwarded = 0;

        setCandidates.forEach(cand => {
          const qr = cand.evaluationResult?.questionResults.find(r => r.questionNumber === q.questionNumber);
          if (qr) {
            attempts++;
            if (qr.verdict === 'CORRECT') correct++;
            else if (qr.verdict === 'PARTIALLY_CORRECT') partial++;
            else incorrect++;

            totalMarksAwarded += qr.marksAwarded;
          }
        });

        const avgMarks = attempts > 0 ? Number((totalMarksAwarded / attempts).toFixed(2)) : 0;
        const accuracy = attempts > 0 ? Number(((correct / attempts) * 100).toFixed(1)) : 0;

        sheet3Rows.push([
          setKey,
          `Q${String(q.questionNumber).padStart(2, '0')}`,
          q.topic || 'Engineering Core',
          q.expectedAnswer || '-',
          q.maxMarks || 1,
          attempts,
          correct,
          partial,
          incorrect,
          avgMarks,
          accuracy
        ]);
      });
    });

    const ws3 = XLSX.utils.aoa_to_sheet([sheet3Headers, ...sheet3Rows]);
    ws3['!cols'] = [
      { wch: 12 },
      { wch: 12 },
      { wch: 30 },
      { wch: 22 },
      { wch: 12 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 }
    ];
    XLSX.utils.book_append_sheet(wb, ws3, 'Question & Set Analysis');

    // ==========================================
    // SHEET 4: Review Required & Flagged Sheets
    // ==========================================
    const sheet4Headers = [
      'Candidate Name',
      'Candidate ID',
      'Assigned Set',
      'Question',
      'Candidate Answer',
      'Expected Answer',
      'Flagged Issue',
      'OCR Confidence (%)',
      'AI Recommended Marks',
      'Max Marks',
      'Admin Status'
    ];

    const sheet4Rows: (string | number)[][] = [];
    evaluatedCandidates.forEach(cand => {
      const res = cand.evaluationResult!;
      const setTag = cand.assignedSet || res.assignedSet || 'SET_A';
      
      res.questionResults.forEach(qr => {
        if (qr.verdict === 'REVIEW_REQUIRED' || qr.errorType === 'AMBIGUOUS_HANDWRITING' || qr.confidence < 85) {
          sheet4Rows.push([
            cand.name,
            cand.candidateId,
            setTag,
            `Q${String(qr.questionNumber).padStart(2, '0')}`,
            qr.candidateAnswer,
            qr.expectedAnswer,
            qr.errorType,
            qr.confidence,
            qr.marksAwarded,
            qr.maxMarks,
            qr.isManuallyOverridden ? 'VERIFIED BY ADMIN' : 'PENDING REVIEW'
          ]);
        }
      });
    });

    if (sheet4Rows.length === 0) {
      sheet4Rows.push(['No pending review items', '-', '-', '-', '-', '-', '-', '-', '-', '-', 'ALL RESOLVED']);
    }

    const ws4 = XLSX.utils.aoa_to_sheet([sheet4Headers, ...sheet4Rows]);
    ws4['!cols'] = [
      { wch: 22 },
      { wch: 16 },
      { wch: 14 },
      { wch: 12 },
      { wch: 22 },
      { wch: 22 },
      { wch: 24 },
      { wch: 18 },
      { wch: 22 },
      { wch: 12 },
      { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(wb, ws4, 'Review Required');

    XLSX.writeFile(wb, filename);
  }
}