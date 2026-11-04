import { ParsedDocument, ParsedSection, ParsedQuestion } from '@/types/schema';

declare const Word: any;
declare const Office: any;

interface OfficeContext {
  document: any;
  run: <T>(batch: (context: any) => Promise<T>) => Promise<T>;
}

let officeContext: OfficeContext | null = null;

export function setOfficeContext(context: OfficeContext) {
  officeContext = context;
}

export async function getSelectedText(): Promise<string> {
  if (!officeContext) throw new Error('Office context not initialized');
  return officeContext.run(async (context: any) => {
    const selection = context.document.getSelection();
    selection.load('text, paragraphs');
    await context.sync();
    return selection.text;
  });
}

export async function getSelectedParagraphs(): Promise<string[]> {
  if (!officeContext) throw new Error('Office context not initialized');
  return officeContext.run(async (context: any) => {
    const selection = context.document.getSelection();
    selection.load('paragraphs');
    await context.sync();
    return selection.paragraphs.items.map((p: any) => p.text);
  });
}

export async function replaceSelection(text: string): Promise<void> {
  if (!officeContext) throw new Error('Office context not initialized');
  await officeContext.run(async (context: any) => {
    const selection = context.document.getSelection();
    selection.insertText(text, 'Replace');
    await context.sync();
  });
}

export async function insertAtSelection(text: string, location: 'Before' | 'After' | 'Replace' = 'After'): Promise<void> {
  if (!officeContext) throw new Error('Office context not initialized');
  await officeContext.run(async (context: any) => {
    const selection = context.document.getSelection();
    selection.insertText(text, location);
    await context.sync();
  });
}

export async function applyQuickAction(
  action: 'clean' | 'alignMarks' | 'fixNumbering' | 'mcqGrid' | 'matchTable',
  config: { marksFormat: string; marksLeader: string }
): Promise<void> {
  if (!officeContext) throw new Error('Office context not initialized');
  await officeContext.run(async (context: any) => {
    const selection = context.document.getSelection();
    selection.load('paragraphs');
    await context.sync();
    const paragraphs = selection.paragraphs.items;
    switch (action) {
      case 'clean':
        for (const para of paragraphs) {
          let text = para.text;
          text = text.replace(/[ \t]+/g, ' ');
          text = text.replace(/\n{3,}/g, '\n\n');
          text = text.replace(/^\s+|\s+$/g, '');
          para.insertText(text, 'Replace');
        }
        break;
      case 'alignMarks':
        for (const para of paragraphs) {
          const text = para.text;
          const marksMatch = text.match(/[\[\(]\s*\d+(\.\d+)?\s*[\]\)]/);
          if (marksMatch) {
            const cleanText = text.replace(marksMatch[0], '').trimEnd();
            para.insertText(cleanText, 'Replace');
            para.paragraphFormat.tabStops.add(500, 'Right', config.marksLeader === 'dots' ? 'Dotted' : 'None');
            para.insertText(`\t${marksMatch[0]}`, 'After');
          }
        }
        break;
      case 'fixNumbering':
        let counter = 1;
        for (const para of paragraphs) {
          const text = para.text;
          const numbered = text.replace(/^\s*(\d+[\.\)]\s*|Q\d+[\.\)]\s*)/, `${counter}. `);
          if (numbered !== text) {
            para.insertText(numbered, 'Replace');
            counter++;
          }
        }
        break;
      case 'mcqGrid':
        const mcqBlocks = splitIntoMCQBlocks(paragraphs);
        for (const block of mcqBlocks) {
          if (block.options.length >= 2) {
            const table = context.document.body.insertTable(2, 2, 'After', block.question);
            // Simplified - would need proper table population
          }
        }
        break;
      case 'matchTable':
        // Convert "A -> B" lines to table
        break;
    }
    await context.sync();
  });
}

function splitIntoMCQBlocks(paragraphs: any[]): { question: string; options: string[] }[] {
  const blocks: { question: string; options: string[] }[] = [];
  let currentQ = '';
  let currentOpts: string[] = [];
  for (const para of paragraphs) {
    const text = para.text.trim();
    if (!text) continue;
    if (/^[\d]+[\.\)]/.test(text) || /^Q\d+/.test(text)) {
      if (currentQ && currentOpts.length > 0) {
        blocks.push({ question: currentQ, options: currentOpts });
      }
      currentQ = text;
      currentOpts = [];
    } else if (/^[\(]?[a-dA-Di-ivIV][\)]/.test(text)) {
      currentOpts.push(text);
    }
  }
  if (currentQ && currentOpts.length > 0) {
    blocks.push({ question: currentQ, options: currentOpts });
  }
  return blocks;
}

export async function parseSelectionToStructured(text: string): Promise<ParsedDocument> {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection = { title: 'Section A', questions: [] };
  let qCounter = 1;
  let inSection = false;
  for (const line of lines) {
    if (line.match(/^section\s+[a-d]/i) || line.match(/^part\s+[a-d]/i)) {
      if (inSection && currentSection.questions.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { title: line.toUpperCase(), questions: [] };
      qCounter = 1;
      inSection = true;
      continue;
    }
    const mcqMatch = line.match(/^(\d+[\.\)]\s*|Q\d+[\.\)]\s*)(.+?)\s*[\[\(](\d+)[\]\)]/);
    if (mcqMatch) {
      currentSection.questions.push({
        id: `q-${qCounter}`,
        qNo: String(qCounter),
        type: 'standard',
        text: mcqMatch[2].trim(),
        marks: mcqMatch[3],
      });
      qCounter++;
      continue;
    }
    const optMatch = line.match(/^[\(]?([a-dA-Di-ivIV])[\)]\s*(.+)/);
    if (optMatch && currentSection.questions.length > 0) {
      const lastQ = currentSection.questions[currentSection.questions.length - 1];
      if (!lastQ.options) lastQ.options = [];
      lastQ.options.push(optMatch[2].trim());
      lastQ.type = 'mcq';
      continue;
    }
    if (line) {
      currentSection.questions.push({
        id: `q-${qCounter}`,
        qNo: String(qCounter),
        type: 'standard',
        text: line,
      });
      qCounter++;
    }
  }
  if (inSection && currentSection.questions.length > 0) {
    sections.push(currentSection);
  }
  return { sections };
}