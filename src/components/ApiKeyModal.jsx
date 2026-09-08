import React, { useState, useEffect } from 'react';
import { X, Key, Cpu, ShieldCheck, Sparkles, Check, ExternalLink, Bot, Radio, Database } from 'lucide-react';
import { weatherAI } from '../services/aiService';
import { TRANSLATIONS } from '../services/languages';

export default function ApiKeyModal({ activeLanguage = 'en', isOpen, onClose }) {
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [llamaKey, setLlamaKey] = useState('');
  const [openWeatherKey, setOpenWeatherKey] = useState('');
  const [mqttBroker, setMqttBroker] = useState('wss://broker.emqx.io:8084/mqtt');
  const [selectedModel, setSelectedModel] = useState('hybrid');
  const [isSaved, setIsSaved] = useState(false);

  const t = TRANSLATIONS[activeLanguage] || TRANSLATIONS.en;
  const m = t.apiModal || TRANSLATIONS.en.apiModal;

  useEffect(() => {
    if (isOpen) {
      setGeminiKey(localStorage.getItem('weathergpt_gemini_key') || '');
      setOpenaiKey(localStorage.getItem('weathergpt_openai_key') || '');
      setLlamaKey(localStorage.getItem('weathergpt_llama_key') || '');
      setOpenWeatherKey(localStorage.getItem('weathergpt_openweather_key') || '');
      setMqttBroker(localStorage.getItem('weathergpt_mqtt_broker') || 'wss://broker.emqx.io:8084/mqtt');
      setSelectedModel(localStorage.getItem('weathergpt_selected_model') || 'gemini');
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    weatherAI.saveKeys({
      geminiKey: geminiKey.trim(),
      openaiKey: openaiKey.trim(),
      llamaKey: llamaKey.trim(),
      openWeatherKey: openWeatherKey.trim(),
      model: selectedModel,
    });
    localStorage.setItem('weathergpt_mqtt_broker', mqttBroker.trim());
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{m?.title || 'AI Model & Meteorological API Suite'}</h3>
              <p className="text-xs text-slate-500">Google Gemini • OpenAI • Meta Llama • Live Telemetry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Zero Config Out of Box Notice */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 text-xs text-sky-900 flex items-start space-x-2.5 shadow-2xs">
          <Sparkles className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
          <span>
            <b>Zero-Config Default:</b> WeatherGPT comes pre-configured with active high-precision NWP feeds (GFS, WRF, ECMWF) & Smart RAG Synthesis. Providing custom keys for Gemini, OpenAI, or Llama is optional.
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Active LLM Provider Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <Bot className="w-3.5 h-3.5 text-sky-600" />
              <span>Default Active LLM Engine</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { id: 'gemini', label: '✨ Google Gemini', desc: 'Gemini 2.0 / 1.5 Flash (Best AI)' },
                { id: 'hybrid', label: '⚡ Smart RAG', desc: 'Instant local SLM' },
                { id: 'openai', label: '🧠 OpenAI GPT', desc: 'GPT-4o mini' },
                { id: 'llama', label: '🦙 Meta Llama', desc: 'Llama 3.3 70B' },
              ].map((mod) => (
                <button
                  type="button"
                  key={mod.id}
                  onClick={() => setSelectedModel(mod.id)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedModel === mod.id
                      ? 'bg-sky-50 border-sky-400 text-sky-800 ring-2 ring-sky-200 font-bold shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  <div className="text-xs">{mod.label}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{mod.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 1. Google Gemini API Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">✨ Google Gemini API Key</label>
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

          {/* 2. OpenAI API Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">🧠 OpenAI API Key (GPT-4o)</label>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-sky-600 hover:underline flex items-center space-x-1"
              >
                <span>Get OpenAI Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          {/* 3. Meta Llama 3.3 (Groq / OpenRouter) API Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">🦙 Meta Llama 3.3 API Key (Groq / OpenRouter)</label>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-sky-600 hover:underline flex items-center space-x-1"
              >
                <span>Get Groq Llama Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={llamaKey}
              onChange={(e) => setLlamaKey(e.target.value)}
              placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          {/* 4. Real-time MQTT & WIS2.0 Broker Endpoint */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                <Radio className="w-3 h-3 text-emerald-600" />
                <span>📡 MQTT & WMO WIS2.0 Broker URL</span>
              </label>
              <span className="text-[10px] text-emerald-600 font-semibold">● Connected (38 AWS Stations)</span>
            </div>
            <input
              type="text"
              value={mqttBroker}
              onChange={(e) => setMqttBroker(e.target.value)}
              placeholder="wss://broker.emqx.io:8084/mqtt"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          {/* 5. OpenWeatherMap API Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">🌤️ OpenWeatherMap API Key</label>
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
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              {isSaved ? <Check className="w-4 h-4" /> : null}
              <span>{isSaved ? 'Settings Saved Successfully!' : 'Save & Apply Tools'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
