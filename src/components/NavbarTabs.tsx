'use client';

import { useState, useEffect } from 'react';
import { LayoutDashboard, Settings, MessageSquare, FileText, MousePointer2, Maximize2 } from 'lucide-react';

interface NavbarTabsProps {
  activeTab: 'presets' | 'form' | 'prompt';
  onTabChange: (tab: 'presets' | 'form' | 'prompt') => void;
}

export function NavbarTabs({ activeTab, onTabChange }: NavbarTabsProps) {
  const tabs = [
    { id: 'presets', label: 'Presets', icon: LayoutDashboard, shortcut: '1' },
    { id: 'form', label: 'Form', icon: Settings, shortcut: '2' },
    { id: 'prompt', label: 'Prompt', icon: MessageSquare, shortcut: '3' },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') onTabChange('presets');
      if (e.key === '2') onTabChange('form');
      if (e.key === '3') onTabChange('prompt');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTabChange]);

  return (
    <div className="flex border-b border-office-gray-border bg-white sticky top-0 z-10">
      {tabs.map(({ id, label, icon: Icon, shortcut }) => (
        <button
          key={id}
          onClick={() => onTabChange(id as any)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium transition-colors ${
            activeTab === id
              ? 'text-office-blue bg-office-blue-light border-b-2 border-office-blue'
              : 'text-office-gray hover:bg-office-gray-light'
          }`}
          title={`Ctrl+${shortcut}`}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
          <kbd className="hidden xs:inline-flex px-1 text-[10px] bg-office-gray-border rounded">Ctrl+{shortcut}</kbd>
        </button>
      ))}
    </div>
  );
}