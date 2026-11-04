'use client';

import { useEffect, useRef, useState } from 'react';
import { NavbarTabs } from '@/components/NavbarTabs';
import { PresetsTab } from '@/components/presets/PresetsTab';
import { FormTab } from '@/components/form/FormTab';
// import { PromptTab } from '@/components/prompt/PromptTab';
import { ScopeBar } from '@/components/ScopeBar';
import { FormattingConfig } from '@/types/schema';
import { defaultPresets, getPresetConfig, presetNames } from '@/lib/defaultPresets';
import { setOfficeContext } from '@/lib/wordEngine';
import { setOfficeContext as setSelectionContext } from '@/lib/selectionEngine';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'presets' | 'form' | 'prompt'>('presets');
  const [scope, setScope] = useState<'full' | 'selection'>('full');
  const [config, setConfig] = useState<FormattingConfig>(getPresetConfig(0));
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const officeInitialized = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Office) {
      (window as any).Office.onReady((info: any) => {
        if (info.host === (window as any).Office.HostType.Word) {
          const context = {
            document: (window as any).Office.context.document,
            run: (batch: any) => (window as any).Word.run(batch),
          };
          setOfficeContext(context);
          setSelectionContext(context);
          officeInitialized.current = true;
          showToast('Connected to Word', 'success');
        }
      });
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApplyPreset = (index: number) => {
    const newConfig = getPresetConfig(index);
    setConfig(newConfig);
    if (activeTab !== 'form') setActiveTab('form');
    showToast(`Loaded: ${presetNames[index] || 'Preset'}`, 'success');
  };

  const handleFormat = async () => {
    if (!officeInitialized.current) {
      showToast('Not connected to Word', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const { applyFormatting } = await import('@/lib/wordEngine');
      const { getSelectedText, getSelectedParagraphs, parseSelectionToStructured } = await import('@/lib/selectionEngine');
      const { readFullDocument } = await import('@/lib/wordEngine');
      
      let text: string;
      let parsedDoc;
      
      if (scope === 'selection') {
        text = await getSelectedText();
        parsedDoc = await parseSelectionToStructured(text);
      } else {
        text = await readFullDocument();
        const res = await fetch('/api/parse-doc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, config, scope }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        parsedDoc = data.data;
      }
      
      await applyFormatting(config, parsedDoc);
      showToast('Document formatted successfully!', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Formatting failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptAction = async (instruction: string, quickAction?: string) => {
    if (!officeInitialized.current) {
      showToast('Not connected to Word', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const { getSelectedText, parseSelectionToStructured } = await import('@/lib/selectionEngine');
      const { readFullDocument, applyFormatting } = await import('@/lib/wordEngine');
      
      let text: string;
      let parsedDoc: any;
      
      if (scope === 'selection') {
        text = await getSelectedText();
        parsedDoc = await parseSelectionToStructured(text);
      } else {
        text = await readFullDocument();
        const res = await fetch('/api/parse-doc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, config, scope }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        parsedDoc = data.data;
      }
      
      const res = await fetch('/api/prompt-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parsedDoc, instruction, quickAction }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      await applyFormatting(config, data.data);
      showToast('Prompt applied successfully!', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Prompt failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleApply = async (extractedConfig: Partial<FormattingConfig>) => {
    setConfig(prev => ({ ...prev, ...extractedConfig }));
    if (activeTab !== 'form') setActiveTab('form');
    showToast('Sample style applied to form', 'success');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <NavbarTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <ScopeBar scope={scope} onScopeChange={setScope} />
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="tab-panel" data-tab="presets">
          <PresetsTab
            config={config}
            onApplyPreset={handleApplyPreset}
            onConfigChange={setConfig}
          />
        </div>
        <div className="tab-panel" data-tab="form">
          <FormTab
            config={config}
            onConfigChange={setConfig}
            onFormat={handleFormat}
            isLoading={isLoading}
          />
        </div>
        <div className="tab-panel" data-tab="prompt">
          {/* <PromptTab
            config={config}
            onConfigChange={setConfig}
            onPromptAction={handlePromptAction}
            onSampleApply={handleSampleApply}
            isLoading={isLoading}
          /> */}
          <div className="p-4 text-center text-office-gray">Prompt tab - temporarily disabled</div>
        </div>
      </div>
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}