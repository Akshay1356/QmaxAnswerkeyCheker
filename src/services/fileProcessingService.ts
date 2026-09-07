import * as pdfjsLib from 'pdfjs-dist';
import { BoundingBox } from '../types';

// Set up pdf.js worker URL
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.js',
      import.meta.url
    ).toString();
  } catch (e) {
    console.warn('PDF.js worker initialization notice:', e);
  }
}

export interface ProcessedDocumentPage {
  pageNumber: number;
  dataUrl: string;
  base64Data: string;
  mimeType: string;
  width: number;
  height: number;
}

export class FileProcessingService {
  /**
   * Reads an uploaded File (PDF or Image) and converts it to high-res page image canvases
   */
  static async processUploadedFile(file: File): Promise<ProcessedDocumentPage[]> {
    const fileType = file.type.toLowerCase();

    if (fileType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      return this.processPdfFile(file);
    } else {
      return this.processImageFile(file);
    }
  }

  /**
   * Converts a single image file (JPG, PNG, WEBP, etc.) to a ProcessedDocumentPage
   */
  static async processImageFile(file: File): Promise<ProcessedDocumentPage[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          const mimeType = file.type || 'image/jpeg';
          const base64Data = dataUrl.split(',')[1] || '';
          resolve([{
            pageNumber: 1,
            dataUrl,
            base64Data,
            mimeType,
            width: img.naturalWidth || img.width || 1200,
            height: img.naturalHeight || img.height || 1600
          }]);
        };
        img.onerror = () => {
          const mimeType = file.type || 'image/jpeg';
          const base64Data = dataUrl.split(',')[1] || '';
          resolve([{
            pageNumber: 1,
            dataUrl,
            base64Data,
            mimeType,
            width: 1200,
            height: 1600
          }]);
        };
        img.src = dataUrl;
      };
      reader.onerror = err => reject(err);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Converts a multi-page PDF document into high-resolution rendered page images
   */
  static async processPdfFile(file: File): Promise<ProcessedDocumentPage[]> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const pages: ProcessedDocumentPage[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.8 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d')!;

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        const base64Data = dataUrl.split(',')[1] || '';

        pages.push({
          pageNumber: pageNum,
          dataUrl,
          base64Data,
          mimeType: 'image/jpeg',
          width: canvas.width,
          height: canvas.height
        });
      }

      return pages;
    } catch (error) {
      console.error('PDF parsing error in browser canvas renderer:', error);
      // Fallback: Read raw base64 data
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      return [{
        pageNumber: 1,
        dataUrl: `data:application/pdf;base64,${base64}`,
        base64Data: base64,
        mimeType: 'application/pdf',
        width: 1200,
        height: 1600
      }];
    }
  }

  /**
   * Fast batch crop of multiple regions from a single image without decoding the source image repeatedly
   */
  static async cropMultipleRegions(
    imageUrl: string,
    bboxes: { qNum: number; bbox: BoundingBox }[]
  ): Promise<Map<number, string>> {
    const results = new Map<number, string>();
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          bboxes.forEach(b => results.set(b.qNum, imageUrl));
          resolve(results);
          return;
        }

        for (const item of bboxes) {
          const { qNum, bbox } = item;
          const cropW = Math.max(10, Math.min(bbox.width, img.naturalWidth || img.width));
          const cropH = Math.max(10, Math.min(bbox.height, img.naturalHeight || img.height));
          canvas.width = Math.min(600, Math.max(100, Math.round(cropW * 1.5)));
          canvas.height = Math.min(300, Math.max(60, Math.round(cropH * 1.5)));

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          try {
            ctx.drawImage(
              img,
              Math.max(0, bbox.x),
              Math.max(0, bbox.y),
              cropW,
              cropH,
              0,
              0,
              canvas.width,
              canvas.height
            );
            results.set(qNum, canvas.toDataURL('image/jpeg', 0.85));
          } catch (e) {
            results.set(qNum, imageUrl);
          }
        }
        resolve(results);
      };
      img.onerror = () => {
        bboxes.forEach(b => results.set(b.qNum, imageUrl));
        resolve(results);
      };
      img.src = imageUrl;
    });
  }

  /**
   * Crops a sub-region bounding box from a base64 image data URL
   */
  static async cropImageRegion(
    imageUrl: string,
    bbox: BoundingBox
  ): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const cropW = Math.max(10, bbox.width);
        const cropH = Math.max(10, bbox.height);
        canvas.width = cropW * 2;
        canvas.height = cropH * 2;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageUrl);
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(
          img,
          bbox.x,
          bbox.y,
          bbox.width,
          bbox.height,
          0,
          0,
          canvas.width,
          canvas.height
        );

        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(imageUrl);
      img.src = imageUrl;
    });
  }
}
