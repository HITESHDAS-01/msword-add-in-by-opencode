'use client';

import { useState, useEffect, useCallback } from 'react';
import { Cpu, Sparkles, Key, Save, Eye, EyeOff, Check, AlertCircle, Info } from 'lucide-react';

interface AIProviderSettingsProps {
  onProviderChange?: (provider: 'gemini' | 'nim') => void;
}

const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Latest, fast, free tier' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', desc: 'Lightweight, free tier' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: 'Stable, free tier' },
  { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', desc: 'Small, very fast' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: 'Higher quality, rate limited' },
];

const NIM_MODELS = [
  { id: 'meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', desc: 'Free tier, fast, good JSON' },
  { id: 'mistralai/mixtral-8x7b-instruct-v0.1', name: 'Mixtral 8x7B', desc: 'Free tier, strong reasoning' },
  { id: 'google/gemma-2-9b-it', name: 'Gemma 2 9B', desc: 'Free tier, lightweight' },
  { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', desc: 'Higher quality, may need credits' },
  { id: 'nvidia/nemotron-3-ultra', name: 'Nemotron 3 Ultra', desc: 'NVIDIA flagship, may need credits' },
];

export function AIProviderSettings({ onProviderChange }: AIProviderSettingsProps) {
  const [provider, setProvider] = useState<'gemini' | 'nim'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('aiProvider') as 'gemini' | 'nim') || 'nim';
    }
    return 'nim';
  });
  
  const [geminiKey, setGeminiKey] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('geminiApiKey') || '';
    return '';
  });
  
  const [nimKey, setNimKey] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('nimApiKey') || '';
    return '';
  });
  
  const [geminiModel, setGeminiModel] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('geminiModel') || 'gemini-2.5-flash';
    return 'gemini-2.5-flash';
  });
  
  const [nimModel, setNimModel] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('nimModel') || 'meta/llama-3.1-8b-instruct';
    return 'meta/llama-3.1-8b-instruct';
  });
  
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showNimKey, setShowNimKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('aiProvider', provider);
    onProviderChange?.(provider);
  }, [provider, onProviderChange]);

  const handleSave = () => {
    if (provider === 'gemini' && !geminiKey.trim()) {
      setError('Please enter Gemini API key');
      return;
    }
    if (provider === 'nim' && !nimKey.trim()) {
      setError('Please enter NIM API key');
      return;
    }
    
    localStorage.setItem('geminiApiKey', geminiKey);
    localStorage.setItem('nimApiKey', nimKey);
    localStorage.setItem('geminiModel', geminiModel);
    localStorage.setItem('nimModel', nimModel);
    
    setSaved(true);
    setError(null);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestConnection = async () => {
    const key = provider === 'gemini' ? geminiKey : nimKey;
    const model = provider === 'gemini' ? geminiModel : nimModel;
    const baseURL = provider === 'nim' ? 'https://integrate.api.nvidia.com' : undefined;
    
    if (!key.trim()) {
      setError('Please enter API key first');
      return;
    }
    
    setError(null);
    try {
      if (provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Say "OK" in JSON: {"status":"ok"}' }] }],
            generationConfig: { responseMimeType: 'application/json', responseSchema: { type: 'object', properties: { status: { type: 'string' } } } }
          })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else {
        const res = await fetch(`${baseURL}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Reply with JSON: {"status":"ok"}' }], max_tokens: 10 })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }
      alert('✅ Connection successful!');
    } catch (e: any) {
      setError(`Connection failed: ${e.message}`);
    }
  };

  const currentKey = provider === 'gemini' ? geminiKey : nimKey;
  const currentModel = provider === 'gemini' ? geminiModel : nimModel;
  const models = provider === 'gemini' ? GEMINI_MODELS : NIM_MODELS;
  const setCurrentKey = provider === 'gemini' ? setGeminiKey : setNimKey;
  const setCurrentModel = provider === 'gemini' ? setGeminiModel : setNimModel;
  const showKey = provider === 'gemini' ? showGeminiKey : showNimKey;
  const setShowKey = provider === 'gemini' ? setShowGeminiKey : setShowNimKey;

  return (
    <div className="border border-office-gray-border rounded-md bg-white p-3 space-y-3">
      {/* Provider Selector */}
      <div>
        <label className="text-xs font-medium text-office-black block mb-2">AI Provider</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'gemini', name: 'Google Gemini', icon: Sparkles, desc: 'Free tier, vision support' },
            { id: 'nim', name: 'NVIDIA NIM', icon: Cpu, desc: 'Open models, self-hostable' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id as 'gemini' | 'nim')}
              className={`p-2.5 rounded-sm text-left transition-all ${
                provider === p.id
                  ? 'bg-office-blue-light border-2 border-office-blue'
                  : 'bg-white border border-office-gray-border hover:border-office-blue'
              }`}
            >
              <div className="flex items-center gap-2">
                <p.icon className={`w-4 h-4 ${provider === p.id ? 'text-office-blue' : 'text-office-gray'}`} />
                <span className="text-xs font-medium text-office-black">{p.name}</span>
                {provider === p.id && <Check className="w-3.5 h-3.5 text-office-blue" />}
              </div>
              <p className="text-[10px] text-office-gray mt-0.5">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* API Key Input */}
      <div>
        <label className="text-xs font-medium text-office-black block mb-1 flex items-center gap-1">
          API Key
          <span className="relative" title={provider === 'gemini' 
            ? 'Get key from https://makersuite.google.com/app/apikey' 
            : 'Get key from https://build.nvidia.com/'}>
            <Info className="w-3 h-3 text-office-gray" />
          </span>
        </label>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={currentKey}
            onChange={e => setCurrentKey(e.target.value)}
            placeholder={provider === 'gemini' ? 'AIzaSy...' : 'nvapi-...'}
            className="w-full px-2 py-1.5 text-xs border border-office-gray-border rounded-sm focus:outline-none focus:ring-1 focus:ring-office-blue pr-10"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-office-gray hover:text-office-blue"
            aria-label={showKey ? 'Hide key' : 'Show key'}
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-office-gray mt-1">
          {provider === 'gemini' 
            ? 'Free tier: 15 RPM, 1M tokens/day. Key stored locally in browser.'
            : 'Free tier on NVIDIA Build. Key stored locally in browser.'}
        </p>
      </div>

      {/* Model Selector */}
      <div>
        <label className="text-xs font-medium text-office-black block mb-1">Model</label>
        <select
          value={currentModel}
          onChange={e => setCurrentModel(e.target.value)}
          className="w-full px-2 py-1.5 text-xs border border-office-gray-border rounded-sm focus:outline-none focus:ring-1 focus:ring-office-blue bg-white"
        >
          {models.map(m => (
            <option key={m.id} value={m.id}>{m.name} — {m.desc}</option>
          ))}
        </select>
      </div>

      {/* Fallback Models Info */}
      <details className="text-xs text-office-gray">
        <summary className="cursor-pointer mb-1">Fallback models (auto-rotate on quota error)</summary>
        <ul className="list-disc list-inside space-y-0.5 ml-2">
          {models.filter(m => m.id !== currentModel).map(m => (
            <li key={m.id}>{m.name} — {m.desc}</li>
          ))}
        </ul>
      </details>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={handleSave}
          className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-1.5 bg-office-blue text-white text-xs font-medium rounded-sm hover:bg-office-blue-hover transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saved ? 'Saved!' : 'Save Settings'}</span>
        </button>
        <button
          onClick={handleTestConnection}
          className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-1.5 border border-office-gray-border text-office-gray text-xs font-medium rounded-sm hover:bg-office-gray-light transition-colors"
        >
          <Key className="w-3.5 h-3.5" />
          <span>Test Connection</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-red-50 border border-red-200 rounded-sm text-red-700 text-xs">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-green-50 border border-green-200 rounded-sm text-green-700 text-xs">
          <Check className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Settings saved to browser localStorage</span>
        </div>
      )}
    </div>
  );
}