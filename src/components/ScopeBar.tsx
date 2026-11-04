'use client';

import { FileText, MousePointer2 } from 'lucide-react';

interface ScopeBarProps {
  scope: 'full' | 'selection';
  onScopeChange: (scope: 'full' | 'selection') => void;
}

export function ScopeBar({ scope, onScopeChange }: ScopeBarProps) {
  return (
    <div className="flex items-center gap-2 px-1 py-1.5 bg-office-gray-light rounded-md border border-office-gray-border">
      <span className="text-xs font-medium text-office-gray mr-1">Scope:</span>
      <button
        onClick={() => onScopeChange('full')}
        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-sm transition-colors ${
          scope === 'full'
            ? 'bg-white text-office-blue shadow-sm border border-office-blue'
            : 'text-office-gray hover:bg-white'
        }`}
        title="Format entire document (Ctrl+Shift+F)"
      >
        <FileText className="w-3.5 h-3.5" />
        <span>Full Document</span>
      </button>
      <button
        onClick={() => onScopeChange('selection')}
        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-sm transition-colors ${
          scope === 'selection'
            ? 'bg-white text-office-blue shadow-sm border border-office-blue'
            : 'text-office-gray hover:bg-white'
        }`}
        title="Format selected text only (Ctrl+Shift+S)"
      >
        <MousePointer2 className="w-3.5 h-3.5" />
        <span>Selection</span>
      </button>
    </div>
  );
}