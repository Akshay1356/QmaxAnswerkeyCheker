import React, { useState } from 'react';
import { Settings, Save, Sparkles, Eye, EyeOff } from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';
import { GoogleGenAI } from '@google/genai';

export const SettingsWorkspace: React.FC = () => {
  const { settings, updateSettings, geminiApiKey, setGeminiApiKey, isGeminiConfigured, showNotification } = useAssessment();
  const [formState, setFormState] = useState(settings);
  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey);
  const [showKey, setShowKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestConnection = async () => {
    const key = apiKeyInput.trim();
    if (!key) {
      setTestResult({ success: false, message: 'Please enter an API key first' });
      return;
    }

    setIsTestingKey(true);
    setTestResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: 'Respond with the word "READY" to verify connection.'
      });

      if (response.text && response.text.length > 0) {
        setTestResult({ success: true, message: 'Connected to Google Gemini 3.7 Flash (gemini-3.7-flash) successfully!' });
        setGeminiApiKey(key);
      } else {
        setTestResult({ success: false, message: 'Received empty response from Gemini' });
      }
    } catch (err: any) {
      console.error('Gemini connection test failed:', err);
      setTestResult({ success: false, message: err.message || 'Connection failed. Check API key validity.' });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKeyInput !== geminiApiKey) {
      setGeminiApiKey(apiKeyInput);
    }
    updateSettings({ ...formState, aiModel: 'gemini-3.7-flash' });
    showNotification('System parameters and Gemini AI configuration saved ✓', 'success');
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-16 md:pb-10 font-sans text-xs">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight uppercase">
              System & Gemini AI Configuration
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure Google Gemini Multimodal Vision AI for Answer Key extraction and handwritten sheet OCR.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-6">
          {/* Section 1: Google Gemini AI Multimodal Vision Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-red-600 font-bold uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>1. Google Gemini Multimodal AI Integration</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                isGeminiConfigured 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                {isGeminiConfigured ? '● Gemini Connected ✓' : '○ API Key Required'}
              </span>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <div>
                <label className="block text-slate-800 font-bold mb-1.5 flex items-center justify-between text-xs">
                  <span>Google Gemini API Key</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-red-600 hover:text-red-700 font-semibold underline"
                  >
                    Get API Key from Google AI Studio ↗
                  </a>
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full pl-3 pr-20 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono text-xs focus:ring-1 focus:ring-red-500 focus:outline-none"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700"
                      title={showKey ? 'Hide key' : 'Show key'}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">Dedicated AI Model</label>
                  <div className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs font-semibold flex items-center justify-between shadow-2xs">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Google Gemini 3.7 Flash (Exclusive Engine)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-600 font-mono font-bold border border-red-200">
                      gemini-3.7-flash
                    </span>
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTestingKey || !apiKeyInput.trim()}
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-black disabled:opacity-40 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                  >
                    {isTestingKey ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Testing Connection...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Test Gemini Connection</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {testResult && (
                <div className={`p-3.5 rounded-lg text-xs font-semibold border ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                  {testResult.message}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Deterministic Evaluation Tolerances */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="text-xs text-red-600 font-bold uppercase tracking-wider">
              2. Evaluation & Scoring Parameters
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs">Default Numerical Tolerance (± %)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={formState.defaultTolerancePercent}
                  onChange={(e) => setFormState({ ...formState, defaultTolerancePercent: parseFloat(e.target.value) || 2 })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-1 focus:ring-red-500"
                />
                <p className="text-[10px] text-slate-500 mt-1 font-medium">Tolerance delta for engineering numbers (e.g. 9.8 vs 9.81 m/s²)</p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs">Pass Mark Threshold (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formState.passPercentage}
                  onChange={(e) => setFormState({ ...formState, passPercentage: parseFloat(e.target.value) || 60 })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-1 focus:ring-red-500"
                />
                <p className="text-[10px] text-slate-500 mt-1 font-medium">Minimum score required for candidate qualification</p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs">Confidence Review Threshold (%)</label>
                <input
                  type="number"
                  min="50"
                  max="99"
                  value={formState.minConfidenceThreshold}
                  onChange={(e) => setFormState({ ...formState, minConfidenceThreshold: parseInt(e.target.value) || 85 })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-1 focus:ring-red-500"
                />
                <p className="text-[10px] text-slate-500 mt-1 font-medium">Answers with OCR confidence below this are flagged for human review</p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs">Negative Marking Per Incorrect</label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="5"
                  value={formState.negativeMarkPerIncorrect}
                  onChange={(e) => setFormState({ ...formState, negativeMarkPerIncorrect: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-1 focus:ring-red-500"
                />
                <p className="text-[10px] text-slate-500 mt-1 font-medium">Deduction applied for wrong answers (default 0.0)</p>
              </div>
            </div>

            <div className="space-y-2 pt-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.allowPartialCredit}
                  onChange={(e) => setFormState({ ...formState, allowPartialCredit: e.target.checked })}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-slate-800 font-medium text-xs">Allow Partial Credit for Unit Mismatches / Formula Steps</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.strictUnitMatching}
                  onChange={(e) => setFormState({ ...formState, strictUnitMatching: e.target.checked })}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-slate-800 font-medium text-xs">Enforce Strict Engineering Unit Matching (e.g. kΩ vs Ω)</span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2 shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
