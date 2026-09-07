import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Check, 
  Trash2, 
  Sparkles
} from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';

interface BatchUploadModalProps {
  onClose: () => void;
}

export const BatchUploadModal: React.FC<BatchUploadModalProps> = ({ onClose }) => {
  const { ingestCandidateFiles, showNotification, isProcessingUpload, uploadProgressText, isGeminiConfigured } = useAssessment();
  const [isDragging, setIsDragging] = useState(false);
  const [rawFiles, setRawFiles] = useState<File[]>([]);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setRawFiles(prev => [...prev, ...fileArray]);
    showNotification(`Staged ${fileArray.length} candidate file(s) in queue`, 'info');
  };

  const handleRemoveStaged = (index: number) => {
    if (isProcessingUpload) return;
    setRawFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleProcessBatch = async () => {
    if (rawFiles.length === 0 || isProcessingUpload) return;
    await ingestCandidateFiles(rawFiles);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 font-sans text-xs max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Batch Candidate Ingestion
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload handwritten candidate technical answer sheets (.PDF, .JPG, .PNG).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessingUpload}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gemini Status Banner */}
        <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
          isGeminiConfigured 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="font-semibold">
              {isGeminiConfigured 
                ? 'Google Gemini Multimodal OCR active: Transcribing handwriting & extracting bounding boxes' 
                : 'Offline Mode: Configure Gemini API Key in Settings for live AI handwriting OCR'}
            </span>
          </div>
        </div>

        {/* Live Ingestion Progress Bar & Status (when active) */}
        {isProcessingUpload && (
          <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 space-y-2.5 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-red-700 font-bold">
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                <span>Processing Candidates...</span>
              </div>
              <span className="text-[11px] font-mono text-red-600 font-bold">LIVE OCR</span>
            </div>
            <p className="text-xs text-slate-700 font-medium">
              {uploadProgressText || 'Transcribing handwriting and slicing high-res answer regions...'}
            </p>
          </div>
        )}

        {/* Dropzone Area */}
        {!isProcessingUpload && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              isDragging 
                ? 'border-red-500 bg-red-50/50' 
                : 'border-slate-300 hover:border-red-400 bg-slate-50'
            }`}
          >
            <input
              type="file"
              id="batch-upload-input"
              multiple
              accept=".pdf,image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <label htmlFor="batch-upload-input" className="cursor-pointer block space-y-3">
              <div className="w-12 h-12 rounded-full bg-white text-red-600 mx-auto flex items-center justify-center border border-slate-200 shadow-2xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">
                  Drag & Drop Candidate Answer Sheets Here
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Supports multi-page PDF documents and high-resolution scanned images (JPG, PNG)
                </div>
              </div>
              <span className="inline-block px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs">
                Browse Files...
              </span>
            </label>
          </div>
        )}

        {/* Staged Files List */}
        {rawFiles.length > 0 && (
          <div className="flex-1 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-48">
            <div className="text-xs font-bold text-slate-700 uppercase pb-1 flex items-center justify-between">
              <span>Staged Files ({rawFiles.length})</span>
              {!isProcessingUpload && (
                <button 
                  onClick={() => setRawFiles([])} 
                  className="text-[11px] text-red-600 hover:underline font-semibold"
                >
                  Clear All
                </button>
              )}
            </div>
            {rawFiles.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="text-xs text-slate-900 font-semibold truncate">{file.name}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                {!isProcessingUpload && (
                  <button
                    onClick={() => handleRemoveStaged(idx)}
                    className="p-1 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            onClick={onClose}
            disabled={isProcessingUpload}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            onClick={handleProcessBatch}
            disabled={rawFiles.length === 0 || isProcessingUpload}
            className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            {isProcessingUpload ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing Batch...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Ingest & Extract ({rawFiles.length}) Sheets</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
