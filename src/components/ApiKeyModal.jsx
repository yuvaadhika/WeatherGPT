import React, { useState, useEffect } from 'react';
import { X, Key, Cpu, ShieldCheck, Sparkles, Check, ExternalLink } from 'lucide-react';
import { weatherAI } from '../services/aiService';

export default function ApiKeyModal({ isOpen, onClose }) {
  const [hfKey, setHfKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [openWeatherKey, setOpenWeatherKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHfKey(localStorage.getItem('weathergpt_hf_key') || '');
      setGeminiKey(localStorage.getItem('weathergpt_gemini_key') || '');
      setOpenWeatherKey(localStorage.getItem('weathergpt_openweather_key') || '');
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    weatherAI.saveKeys({
      hfKey: hfKey.trim(),
      geminiKey: geminiKey.trim(),
      openWeatherKey: openWeatherKey.trim(),
    });
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-600">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Models & API Configuration</h3>
              <p className="text-xs text-slate-500">Custom LLM Inference & Meteorological Telemetry Keys</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Public Mode Notice */}
        <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-800 flex items-start space-x-2">
          <Sparkles className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
          <span>
            <b>Zero-Configuration Default:</b> WeatherGPT runs out-of-the-box using high-precision real-time NWP feeds (Open-Meteo, RainViewer & WAQI). Providing custom API keys below is completely optional!
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Hugging Face API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <span>🤗 Hugging Face Inference API Key</span>
              </label>
              <a
                href="https://huggingface.co/settings/tokens"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-sky-600 hover:underline flex items-center space-x-1"
              >
                <span>Get HF Token</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={hfKey}
              onChange={(e) => setHfKey(e.target.value)}
              placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          {/* Gemini API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <span>✨ Google Gemini API Key</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-sky-600 hover:underline flex items-center space-x-1"
              >
                <span>Get Gemini Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          {/* OpenWeatherMap API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <span>🌤️ OpenWeatherMap API Key (Optional)</span>
              </label>
              <a
                href="https://home.openweathermap.org/api_keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-sky-600 hover:underline flex items-center space-x-1"
              >
                <span>Get Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={openWeatherKey}
              onChange={(e) => setOpenWeatherKey(e.target.value)}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-sm flex items-center space-x-1.5 transition-all"
            >
              {isSaved ? <Check className="w-4 h-4" /> : null}
              <span>{isSaved ? 'Settings Saved!' : 'Save Configurations'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
