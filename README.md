# QMAX ATLAS — Technical Answer Sheet Evaluation System

**QMAX ATLAS** is an AI-powered technical answer sheet evaluation system engineered for fast, accurate, and automated grading of candidate assessment answer sheets.

## 🚀 Key Features

- **Exclusive Google Gemini 3.7 Flash Engine**: Highly optimized OCR extraction and semantic response evaluation with exponential backoff retries.
- **Answer Key Extraction & Ingestion**: Ingest single or multi-set (Set A, Set B, Set C, etc.) question papers and answer keys directly from PDF, scanned images, or Excel sheets.
- **Candidate Submission Processing**: Batch process candidate responses with auto-alignment against official answer keys.
- **Comprehensive Excel Report Generation**: Generates clean evaluation reports with candidate scores, per-question marks, and correct reference answers.
- **Human-in-the-Loop Review**: Fast verification interface for low-confidence answers or manual grade overrides.
- **Mobile Camera Scanner Support**: Direct mobile scanning integration for on-the-fly candidate sheet digitization.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Build Tool**: Vite
- **Document & Image Processing**: PDF.js, Tesseract.js, XLSX, SheetJS
- **AI / LLM**: Google Gemini 3.7 Flash (@google/genai)

## 📦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Google Gemini API Key

### Installation

1. Clone the repository:
   `ash
   git clone https://github.com/Akshay1356/QmaxAnswerkeyCheker.git
   cd QmaxAnswerkeyCheker
   `

2. Install dependencies:
   `ash
   npm install
   `

3. Start development server:
   `ash
   npm run dev
   `

4. Build for production:
   `ash
   npm run build
   `

## 📄 License
Private & Confidential — Qmax Systems.
