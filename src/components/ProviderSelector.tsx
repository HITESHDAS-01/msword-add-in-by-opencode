'use client';

import { useState } from 'react';
import { Cpu, Sparkles, Check } from 'lucide-react';

interface ProviderSelectorProps {
  currentProvider: 'gemini' | 'nim';
  onChange: (provider: 'gemini' | 'nim') => void;
}

const providers = [
  {
    id: 'gemini' as const,
    name: 'Google Gemini',
    model: 'Gemini 2.5 Flash',
    icon: Sparkles,
    description: 'Fast, free tier available',
    features: ['Text & Vision', 'JSON Schema', 'Low latency'],
  },
  {
    id: 'nim' as const,
    name: 'NVIDIA NIM',
    model: 'Llama 3.1 405B / Nemotron 3 Ultra',
    icon: Cpu,
    description: 'Enterprise-grade, self-hostable',
    features: ['Open models', 'Custom endpoints', 'High throughput'],
  },
];

export function ProviderSelector({ currentProvider, onChange }: ProviderSelectorProps) {
  return (
    <div className="border border-office-gray-border rounded-md p-3 space-y-2">
      <label className="text-xs font-medium text-office-black block mb-2">AI Provider</label>
      <div className="grid grid-cols-2 gap-2">
        {providers.map(provider => (
          <button
            key={provider.id}
            onClick={() => onChange(provider.id)}
            className={`relative p-2.5 rounded-sm text-left transition-all ${
              currentProvider === provider.id
                ? 'bg-office-blue-light border-2 border-office-blue'
                : 'bg-white border border-office-gray-border hover:border-office-blue hover:bg-office-blue-light/50'
            }`}
          >
            {currentProvider === provider.id && (
              <Check className="absolute top-1 right-1 text-office-blue" size={14} />
            )}
            <div className="flex items-center gap-2 mb-1">
              <provider.icon className={`w-4 h-4 ${currentProvider === provider.id ? 'text-office-blue' : 'text-office-gray'}`} />
              <span className="text-xs font-medium text-office-black">{provider.name}</span>
            </div>
            <p className="text-[11px] text-office-gray">{provider.model}</p>
            <p className="text-[10px] text-office-gray mt-1">{provider.description}</p>
            <ul className="mt-1.5 space-y-0.5">
              {provider.features.map((f, i) => (
                <li key={i} className="flex items-center gap-1 text-[10px] text-office-gray">
                  <span className="w-1 h-1 rounded-full bg-office-gray" />
                  {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </div>
  );
}