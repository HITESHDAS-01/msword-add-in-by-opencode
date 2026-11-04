'use client';

import { useState } from 'react';
import { Download, Upload, Plus, Trash2, Edit, Copy, FileJson } from 'lucide-react';
import { FormattingConfig } from '@/types/schema';
import { defaultPresets, presetNames } from '@/lib/defaultPresets';
import { getPresetConfig } from '@/lib/defaultPresets';

interface PresetsTabProps {
  config: FormattingConfig;
  onApplyPreset: (index: number) => void;
  onConfigChange: (config: FormattingConfig) => void;
}

interface CustomPreset extends FormattingConfig {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  createdAt: number;
}

export function PresetsTab({ config, onApplyPreset, onConfigChange }: PresetsTabProps) {
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('customPresets');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDesc, setSaveDesc] = useState('');

  const handleSavePreset = () => {
    if (!saveName.trim()) return;
    const newPreset: CustomPreset = {
      ...config,
      id: `custom-${Date.now()}`,
      name: saveName,
      description: saveDesc,
      isDefault: false,
      createdAt: Date.now(),
    };
    setCustomPresets(prev => [...prev, newPreset]);
    localStorage.setItem('customPresets', JSON.stringify([...customPresets, newPreset]));
    setShowSaveModal(false);
    setSaveName('');
    setSaveDesc('');
  };

  const handleDeletePreset = (id: string) => {
    const updated = customPresets.filter(p => p.id !== id);
    setCustomPresets(updated);
    localStorage.setItem('customPresets', JSON.stringify(updated));
  };

  const handleExportPreset = (preset: FormattingConfig) => {
    const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${preset.presetName || 'preset'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportPreset = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        const newPreset: CustomPreset = {
          ...imported,
          id: `custom-${Date.now()}`,
          name: imported.presetName || 'Imported Preset',
          description: 'Imported from file',
          isDefault: false,
          createdAt: Date.now(),
        };
        setCustomPresets(prev => [...prev, newPreset]);
        localStorage.setItem('customPresets', JSON.stringify([...customPresets, newPreset]));
      } catch {
        alert('Invalid preset file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-office-black">Built-in Presets</h3>
        <button
          onClick={() => { setSaveName(''); setSaveDesc(''); setShowSaveModal(true); }}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-office-blue text-white rounded-sm hover:bg-office-blue-hover"
          title="Save current form as preset"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Save as Preset</span>
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {defaultPresets.map((_, index) => (
          <PresetCard
            key={index}
            index={index}
            name={presetNames[index]}
            description={getPresetConfig(index).header.examTitle}
            onClick={() => onApplyPreset(index)}
            onExport={() => handleExportPreset(getPresetConfig(index))}
          />
        ))}
      </div>

      {customPresets.length > 0 && (
        <div className="pt-2 border-t border-office-gray-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-office-black">Custom Presets</h3>
            <label className="cursor-pointer">
              <Upload className="w-4 h-4 text-office-gray hover:text-office-blue" />
              <input type="file" accept=".json" onChange={handleImportPreset} className="sr-only" />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {customPresets.map(preset => (
              <CustomPresetCard
                key={preset.id}
                preset={preset}
                onApply={() => onConfigChange(preset)}
                onEdit={() => { setSaveName(preset.name); setSaveDesc(preset.description); setShowSaveModal(true); }}
                onDelete={() => handleDeletePreset(preset.id)}
                onExport={() => handleExportPreset(preset)}
              />
            ))}
          </div>
        </div>
      )}

      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h4 className="text-sm font-semibold mb-3">Save as Preset</h4>
            <div className="space-y-2">
              <input
                type="text"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                placeholder="Preset Name"
                className="w-full px-2 py-1.5 text-sm border border-office-gray-border rounded-sm focus:outline-none focus:ring-1 focus:ring-office-blue"
              />
              <textarea
                value={saveDesc}
                onChange={e => setSaveDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full px-2 py-1.5 text-sm border border-office-gray-border rounded-sm focus:outline-none focus:ring-1 focus:ring-office-blue"
              />
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-3 py-1.5 text-xs text-office-gray hover:bg-office-gray-light rounded-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreset}
                className="px-3 py-1.5 text-xs bg-office-blue text-white rounded-sm hover:bg-office-blue-hover"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PresetCard({ index, name, description, onClick, onExport }: { index: number; name: string; description: string; onClick: () => void; onExport: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative group p-2.5 text-left border border-office-gray-border rounded-md hover:border-office-blue hover:bg-office-blue-light transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-office-black">{name}</p>
          <p className="text-[11px] text-office-gray mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={e => { e.stopPropagation(); onExport(); }} className="icon-btn" title="Export JSON"><FileJson className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      <div className="absolute bottom-1.5 right-1.5 text-[10px] text-office-gray">Ctrl+{index + 1}</div>
    </button>
  );
}

function CustomPresetCard({ preset, onApply, onEdit, onDelete, onExport }: { preset: CustomPreset; onApply: () => void; onEdit: () => void; onDelete: () => void; onExport: () => void }) {
  return (
    <div className="relative group p-2.5 border border-office-gray-border rounded-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-office-black truncate">{preset.name}</p>
          <p className="text-[11px] text-office-gray mt-0.5 truncate">{preset.description}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={e => { e.stopPropagation(); onApply(); }} className="icon-btn" title="Apply"><Edit className="w-3.5 h-3.5" /></button>
          <button onClick={e => { e.stopPropagation(); onExport(); }} className="icon-btn" title="Export"><FileJson className="w-3.5 h-3.5" /></button>
          <button onClick={e => { e.stopPropagation(); onEdit(); }} className="icon-btn" title="Edit"><Copy className="w-3.5 h-3.5" /></button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="icon-btn text-red-500 hover:bg-red-50" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </div>
  );
}