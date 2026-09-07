import { BoundingBox } from '../types';

export class DocumentProcessor {
  /**
   * Generates a high-resolution authentic candidate answer sheet canvas with technical handwritten answers.
   */
  static createCandidateSheetCanvas(
    candidateId: string,
    candidateName: string,
    pageNumber: number,
    totalPages: number,
    answers: { questionNumber: number; questionText: string; answer: string; confidence: number; isFlagged?: boolean }[]
  ): { canvas: HTMLCanvasElement; regions: { questionNumber: number; bbox: BoundingBox; rawText: string; cropDataUrl: string }[] } {
    const canvas = document.createElement('canvas');
    canvas.width = 1240;
    canvas.height = 1754;
    const ctx = canvas.getContext('2d')!;

    // Industrial paper background (clean white/off-white)
    ctx.fillStyle = '#FBFBFB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle technical background scan grain
    ctx.fillStyle = 'rgba(15, 23, 42, 0.012)';
    for (let i = 0; i < 800; i++) {
      const rx = Math.random() * canvas.width;
      const ry = Math.random() * canvas.height;
      ctx.fillRect(rx, ry, Math.random() * 2 + 1, Math.random() * 2 + 1);
    }

    // Precise Corner Fiducial Alignment Crosshairs
    const drawCrosshair = (cx: number, cy: number) => {
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 16, cy);
      ctx.lineTo(cx + 16, cy);
      ctx.moveTo(cx, cy - 16);
      ctx.lineTo(cx, cy + 16);
      ctx.stroke();
      ctx.strokeRect(cx - 8, cy - 8, 16, 16);
    };

    drawCrosshair(45, 45);
    drawCrosshair(canvas.width - 45, 45);
    drawCrosshair(45, canvas.height - 45);
    drawCrosshair(canvas.width - 45, canvas.height - 45);

    // Top Header - QMAX SYSTEMS Brand Identity
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 22px "Inter", sans-serif';
    ctx.fillText('QMAX SYSTEMS', 80, 72);
    
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillStyle = '#0284C7';
    ctx.fillText('TECHNICAL ASSESSMENT ANSWER SHEET', 80, 94);

    // Barcode Security Stamp on top right
    ctx.fillStyle = '#0F172A';
    for (let b = 0; b < 28; b++) {
      const w = (b % 3 === 0 || b % 7 === 0) ? 4 : 2;
      ctx.fillRect(canvas.width - 240 + b * 6, 52, w, 28);
    }
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#475569';
    ctx.fillText(`ATLAS-DOC-${candidateId.slice(-6)}`, canvas.width - 240, 92);

    // Header divider line
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(80, 110);
    ctx.lineTo(canvas.width - 80, 110);
    ctx.stroke();

    // Candidate Identification Box
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.fillRect(80, 125, canvas.width - 160, 85);
    ctx.strokeRect(80, 125, canvas.width - 160, 85);

    // Labels inside metadata box
    ctx.fillStyle = '#64748B';
    ctx.font = '10px "Inter", sans-serif';
    ctx.fillText('CANDIDATE ID', 95, 148);
    ctx.fillText('CANDIDATE NAME', 400, 148);
    ctx.fillText('DATE OF EXAM', 820, 148);
    ctx.fillText('ASSESSMENT CODE', 95, 185);
    ctx.fillText('SHEET NUMBER', 400, 185);
    ctx.fillText('EVALUATION STATUS', 820, 185);

    // Dynamic metadata values
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 15px "JetBrains Mono", monospace';
    ctx.fillText(candidateId, 95, 168);
    ctx.font = 'bold 15px "Inter", sans-serif';
    ctx.fillText(candidateName, 400, 168);
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), 820, 168);
    ctx.fillText('QMAX-TECH-2026', 95, 202);
    ctx.fillText(`Page ${pageNumber} of ${totalPages}`, 400, 202);
    ctx.fillStyle = '#0284C7';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillText('[ READY FOR EVALUATION ]', 820, 202);

    // Technical Question Items Layout (Single or Multi-column)
    const regions: { questionNumber: number; bbox: BoundingBox; rawText: string; cropDataUrl: string }[] = [];
    const itemsPerCol = Math.ceil(answers.length / 2);
    const colWidth = (canvas.width - 160 - 30) / 2;
    const startY = 230;
    const rowHeight = 135;

    answers.forEach((item, index) => {
      const col = index < itemsPerCol ? 0 : 1;
      const rowIndex = index < itemsPerCol ? index : index - itemsPerCol;
      const x = 80 + col * (colWidth + 30);
      const y = startY + rowIndex * (rowHeight + 15);

      // Question container box
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.fillRect(x, y, colWidth, rowHeight);
      ctx.strokeRect(x, y, colWidth, rowHeight);

      // Question Number Tag
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(x, y, 55, 32);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Q${String(item.questionNumber).padStart(2, '0')}`, x + 27.5, y + 21);
      ctx.textAlign = 'left';

      // Question Prompt Text
      ctx.fillStyle = '#334155';
      ctx.font = '600 12px "Inter", sans-serif';
      ctx.fillText(item.questionText || `Technical Problem ${item.questionNumber}`, x + 65, y + 21);

      // Designated Answer Area Box
      const boxX = x + 15;
      const boxY = y + 42;
      const boxW = colWidth - 30;
      const boxH = 80;

      ctx.fillStyle = '#FAFAFA';
      ctx.strokeStyle = item.isFlagged ? '#F59E0B' : '#94A3B8';
      ctx.lineWidth = item.isFlagged ? 2 : 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      ctx.setLineDash([]);
      ctx.fillRect(boxX, boxY, boxW, boxH);

      // Box watermark
      ctx.fillStyle = '#CBD5E1';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText('HANDWRITTEN RESPONSE AREA', boxX + 8, boxY + 14);

      // Render authentic handwriting inside the box
      this.renderTechnicalHandwriting(ctx, item.answer, boxX + boxW / 2, boxY + boxH / 2 + 10, item.confidence);

      // Extract high-resolution cropped bounding box
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = boxW * 2;
      cropCanvas.height = boxH * 2;
      const cropCtx = cropCanvas.getContext('2d')!;
      cropCtx.drawImage(canvas, boxX, boxY, boxW, boxH, 0, 0, cropCanvas.width, cropCanvas.height);

      regions.push({
        questionNumber: item.questionNumber,
        bbox: { x: boxX, y: boxY, width: boxW, height: boxH },
        rawText: item.answer,
        cropDataUrl: cropCanvas.toDataURL('image/png')
      });
    });

    // Bottom Footer
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, canvas.height - 45);
    ctx.lineTo(canvas.width - 80, canvas.height - 45);
    ctx.stroke();

    ctx.fillStyle = '#64748B';
    ctx.font = '10px "Inter", sans-serif';
    ctx.fillText('QMAX SYSTEMS EVALUATION ENGINE • STRICTLY CONFIDENTIAL ASSESSMENT DATA', 80, canvas.height - 25);
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText(`ATLAS-ENGINE-V2 • SHA256-${candidateId.slice(-6)}`, canvas.width - 320, canvas.height - 25);

    return { canvas, regions };
  }

  /**
   * Renders handwritten technical characters, units, and formulas with realistic ink stroke physics
   */
  private static renderTechnicalHandwriting(
    ctx: CanvasRenderingContext2D,
    text: string,
    centerX: number,
    centerY: number,
    confidence: number
  ) {
    ctx.save();
    ctx.translate(centerX, centerY);

    const slant = (Math.random() - 0.5) * 0.12;
    ctx.rotate(slant);

    const inkColors = ['#0F172A', '#1E293B', '#1E3A8A', '#0C4A6E', '#172554'];
    ctx.strokeStyle = inkColors[Math.floor(Math.random() * inkColors.length)];
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = Math.random() * 0.8 + 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const clean = (text || '').trim();

    if (!clean || clean === '?' || clean === 'UNKNOWN' || confidence < 50) {
      // Draw messy / uncertain glyph
      ctx.beginPath();
      ctx.moveTo(-15, -8);
      ctx.lineTo(12, -4);
      ctx.lineTo(-6, 8);
      ctx.lineTo(18, 12);
      ctx.stroke();
    } else {
      // Authentic handwritten font styling
      ctx.font = '600 24px "Caveat", "Segoe Script", "Comic Sans MS", cursive, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(clean, 0, 0);

      // Natural stroke variance overlay
      ctx.beginPath();
      ctx.moveTo(-clean.length * 5, 12);
      ctx.lineTo(clean.length * 5, 13);
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    ctx.restore();
  }
}