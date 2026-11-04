import { FormattingConfig, ParsedDocument, ParsedSection, ParsedQuestion } from '@/types/schema';

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

export async function applyFormatting(config: FormattingConfig, parsedDoc: ParsedDocument): Promise<void> {
  if (!officeContext) throw new Error('Office context not initialized');
  await officeContext.run(async (context: any) => {
    const doc = context.document;
    await setupPage(config, doc);
    await buildHeader(config, doc, parsedDoc);
    await buildSections(config, doc, parsedDoc);
    await setupFooter(config, doc);
    await context.sync();
  });
}

async function setupPage(config: FormattingConfig, doc: any): Promise<void> {
  const sections = doc.sections;
  sections.load('items');
  await doc.context.sync();
  sections.items.forEach((section: any) => {
    const margins = config.pageSetup.margins;
    section.getPageProperties().set({
      pageSize: config.pageSetup.paperSize,
      orientation: config.pageSetup.orientation,
      marginTop: margins.top,
      marginBottom: margins.bottom,
      marginLeft: margins.left,
      marginRight: margins.right,
    });
    if (config.pageSetup.columns === 2) {
      section.getPageProperties().columns = 2;
    }
  });
}

async function buildHeader(config: FormattingConfig, doc: any, parsedDoc: ParsedDocument): Promise<void> {
  if (!config.header.enabled) return;
  const body = doc.body;
  const metadata = parsedDoc.metadata || {};
  const rows = [
    [
      config.header.instituteName || metadata.instituteName || '',
      config.header.examTitle || metadata.examTitle || '',
    ],
    [
      config.header.instituteSubtitle || '',
      `${config.header.className || metadata.className || ''} | ${config.header.subject || metadata.subject || ''}`,
    ],
    [
      `Time: ${config.header.timeAllowed || metadata.timeAllowed || ''}`,
      `Max Marks: ${config.header.maxMarks || metadata.maxMarks || ''}`,
    ],
  ];
  if (config.header.paperSet) {
    rows.push(['', `Set: ${config.header.paperSet}`]);
  }
  const table = body.insertTable(rows.length, 2, 'Start', rows);
  table.style = 'Table Normal';
  table.autoFitBehavior(1);
  const headerStyle = config.header.style;
  table.rows.items.forEach((row: any, i: number) => {
    row.cells.items.forEach((cell: any, j: number) => {
      const para = cell.paragraphs.items[0];
      para.alignment = j === 0 ? 'Left' : 'Right';
      para.font.set({ bold: i === 0, size: i === 0 ? config.typography.titleSize : config.typography.subHeaderSize, name: config.typography.primaryFont });
      if (headerStyle === 'boxed') {
        cell.shadingColor = i === 0 ? '#F2F2F2' : 'white';
      }
    });
  });
  if (headerStyle === 'double-line') {
    const borderRow = body.insertParagraph('', 'After', table);
    borderRow.paragraphFormat.set({ borderBottom: { style: 'Double', size: 1.5, color: '000000' } });
  }
  if (config.header.showRollNoBoxes) {
    const rollRow = body.insertParagraph('', 'After', table);
    let rollText = 'Roll No.: ';
    for (let i = 0; i < config.header.rollNoBoxCount; i++) {
      rollText += '[ ] ';
    }
    rollRow.insertText(rollText, 'Replace');
    rollRow.font.set({ size: config.typography.questionSize, name: config.typography.primaryFont });
  }
  if (config.header.generalInstructions.length > 0) {
    const instPara = body.insertParagraph('', 'After', table);
    instPara.insertText('General Instructions:', 'Replace');
    instPara.font.set({ bold: true, size: config.typography.questionSize, name: config.typography.primaryFont });
    config.header.generalInstructions.forEach((inst, idx) => {
      const p = body.insertParagraph('', 'After', instPara);
      p.insertText(`${idx + 1}. ${inst}`, 'Replace');
      p.font.set({ size: config.typography.questionSize, name: config.typography.primaryFont });
      p.paragraphFormat.set({ leftIndent: 36, spaceAfter: 2 });
    });
  }
  body.insertParagraph('', 'After', table);
}

async function buildSections(config: FormattingConfig, doc: any, parsedDoc: ParsedDocument): Promise<void> {
  const body = doc.body;
  for (const section of parsedDoc.sections) {
    await buildSection(config, body, section);
  }
}

async function buildSection(config: FormattingConfig, body: any, section: ParsedSection): Promise<void> {
  const sectionPara = body.insertParagraph('', 'End');
  sectionPara.insertText(section.title, 'Replace');
  sectionPara.alignment = 'Centered';
  sectionPara.font.set({ bold: true, size: config.typography.sectionTitleSize, name: config.typography.primaryFont, underline: 'Single' });
  sectionPara.paragraphFormat.set({ spaceAfter: 6, spaceBefore: 12 });
  if (section.instructions) {
    const instPara = body.insertParagraph('', 'End');
    instPara.insertText(section.instructions, 'Replace');
    instPara.font.set({ italic: true, size: config.typography.questionSize, name: config.typography.primaryFont });
    instPara.alignment = 'Right';
    instPara.paragraphFormat.set({ spaceAfter: 6 });
  }
  if (section.sectionMarksSummary) {
    const marksPara = body.insertParagraph('', 'End');
    marksPara.insertText(section.sectionMarksSummary, 'Replace');
    marksPara.font.set({ bold: true, size: config.typography.questionSize, name: config.typography.primaryFont });
    marksPara.alignment = 'Right';
    marksPara.paragraphFormat.set({ spaceAfter: 6 });
  }
  for (const question of section.questions) {
    await buildQuestion(config, body, question);
    if (question.hasInternalChoiceAfter && config.questionsAndMarks.centerChoiceOr) {
      const orPara = body.insertParagraph('', 'End');
      orPara.insertText('OR', 'Replace');
      orPara.alignment = 'Centered';
      orPara.font.set({ bold: true, size: config.typography.questionSize, name: config.typography.primaryFont });
      orPara.paragraphFormat.set({ spaceBefore: 6, spaceAfter: 6 });
    }
    if (question.choiceAlternative) {
      await buildQuestion(config, body, {
        ...question.choiceAlternative,
        id: `${question.id}-alt`,
        qNo: '',
        type: question.choiceAlternative.options ? 'mcq' : 'standard',
      } as ParsedQuestion);
    }
  }
}

async function buildQuestion(config: FormattingConfig, body: any, question: ParsedQuestion): Promise<void> {
  const qPara = body.insertParagraph('', 'End');
  const prefix = config.questionsAndMarks.questionNumberPrefix;
  const qText = question.qNo ? `${prefix.replace('1', question.qNo)} ${question.text}` : question.text;
  qPara.insertText(qText, 'Replace');
  qPara.font.set({ size: config.typography.questionSize, name: config.typography.primaryFont });
  qPara.paragraphFormat.set({
    spaceAfter: config.typography.questionGapAfter,
    lineSpacing: config.typography.lineSpacing,
    leftIndent: 0,
    firstLineIndent: 0,
  });
  if (question.marks) {
    const marksText = formatMarks(config, question.marks);
    const tabStopPosition = config.pageSetup.margins.left + (config.pageSetup.paperSize === 'A4' ? 595 - config.pageSetup.margins.left - config.pageSetup.margins.right : 0);
    qPara.paragraphFormat.tabStops.add(tabStopPosition, 'Right', config.questionsAndMarks.marksLeader === 'dots' ? 'Dotted' : 'None');
    qPara.insertText(`\t${marksText}`, 'After');
  }
  if (question.type === 'mcq' && question.options && question.options.length > 0) {
    await buildMCQOptions(config, body, question.options);
  } else if (question.type === 'match' && question.matchColumns) {
    await buildMatchTable(config, body, question.matchColumns);
  } else if (question.subQuestions && question.subQuestions.length > 0) {
    for (const sq of question.subQuestions) {
      const sqPara = body.insertParagraph('', 'End');
      sqPara.insertText(`${config.questionsAndMarks.subQuestionStyle.replace('i', sq.label)} ${sq.text}`, 'Replace');
      sqPara.font.set({ size: config.typography.optionSize, name: config.typography.primaryFont });
      sqPara.paragraphFormat.set({ leftIndent: 36, spaceAfter: 2, lineSpacing: config.typography.lineSpacing });
      if (sq.marks) {
        sqPara.paragraphFormat.tabStops.add(500, 'Right', config.questionsAndMarks.marksLeader === 'dots' ? 'Dotted' : 'None');
        sqPara.insertText(`\t${formatMarks(config, sq.marks)}`, 'After');
      }
    }
  }
}

function formatMarks(config: FormattingConfig, marks: string): string {
  const fmt = config.questionsAndMarks.marksFormat;
  if (fmt === '[X]') return `[${marks}]`;
  if (fmt === '(X)') return `(${marks})`;
  return `${marks} Marks`;
}

async function buildMCQOptions(config: FormattingConfig, body: any, options: string[]): Promise<void> {
  const layout = config.mcqAndTables.mcqLayout;
  const labelStyle = config.mcqAndTables.optionLabelStyle;
  const labels = getOptionLabels(labelStyle, options.length);
  if (layout === '1-line' || (layout === 'auto' && options.every(o => o.length < 15))) {
    const row = body.insertParagraph('', 'End');
    options.forEach((opt, i) => {
      row.insertText(`${labels[i]} ${opt}    `, 'After');
    });
    row.font.set({ size: config.typography.optionSize, name: config.typography.primaryFont });
    row.paragraphFormat.set({ spaceAfter: config.typography.questionGapAfter });
  } else if (layout === '2x2-grid' || (layout === 'auto' && options.every(o => o.length < 35))) {
    const table = body.insertTable(2, 2, 'End', [
      [`${labels[0]} ${options[0]}`, `${labels[1]} ${options[1]}`],
      [`${labels[2]} ${options[2]}`, `${labels[3]} ${options[3]}`],
    ]);
    table.style = 'Table Normal';
    table.borders.set({ insideHorizontal: { style: 'None' }, insideVertical: { style: 'None' }, top: { style: 'None' }, bottom: { style: 'None' }, left: { style: 'None' }, right: { style: 'None' } });
    table.rows.items.forEach((row: any) => {
      row.cells.items.forEach((cell: any) => {
        cell.paragraphs.items[0].font.set({ size: config.typography.optionSize, name: config.typography.primaryFont });
        cell.paragraphs.items[0].paragraphFormat.set({ spaceAfter: 0, spaceBefore: 0 });
      });
    });
  } else {
    options.forEach((opt, i) => {
      const p = body.insertParagraph('', 'End');
      p.insertText(`${labels[i]} ${opt}`, 'Replace');
      p.font.set({ size: config.typography.optionSize, name: config.typography.primaryFont });
      p.paragraphFormat.set({ leftIndent: 36, spaceAfter: 2 });
    });
  }
}

function getOptionLabels(style: string, count: number): string[] {
  const base = style.replace(/[()]/g, '');
  if (base === 'a') return ['(a)', '(b)', '(c)', '(d)'].slice(0, count);
  if (base === 'A') return ['(A)', '(B)', '(C)', '(D)'].slice(0, count);
  if (base === 'i') return ['(i)', '(ii)', '(iii)', '(iv)'].slice(0, count);
  if (base === 'ক') return ['(ক)', '(খ)', '(গ)', '(ঘ)'].slice(0, count);
  return ['(a)', '(b)', '(c)', '(d)'].slice(0, count);
}

async function buildMatchTable(config: FormattingConfig, body: any, match: ParsedQuestion['matchColumns']): Promise<void> {
  if (!match) return;
  const rows = match.rows.length + 1;
  const data = [[match.colAHeader, match.colBHeader], ...match.rows];
  const table = body.insertTable(rows, 2, 'End', data);
  table.style = 'Table Normal';
  table.autoFitBehavior(1);
  table.rows.items[0].cells.items.forEach((cell: any) => {
    cell.paragraphs.items[0].font.set({ bold: true, size: config.typography.questionSize, name: config.typography.primaryFont });
    cell.shadingColor = '#E8F0FE';
  });
  for (let i = 1; i < rows; i++) {
    table.rows.items[i].cells.items.forEach((cell: any) => {
      cell.paragraphs.items[0].font.set({ size: config.typography.questionSize, name: config.typography.primaryFont });
    });
  }
  table.paragraphFormat.set({ spaceAfter: config.typography.questionGapAfter });
}

async function setupFooter(config: FormattingConfig, doc: any): Promise<void> {
  const sections = doc.sections;
  sections.load('items');
  await doc.context.sync();
  sections.items.forEach((section: any) => {
    const footer = section.getFooter('Primary');
    footer.clear();
    if (config.footer.pageNumberStyle !== 'none') {
      const p = footer.insertParagraph('', 'Start');
      if (config.footer.pageNumberStyle === 'page-x-of-y') {
        p.insertText('Page ', 'Replace');
        p.insertField('Page', 'After');
        p.insertText(' of ', 'After');
        p.insertField('NumPages', 'After');
      } else {
        p.insertText('- ', 'Replace');
        p.insertField('Page', 'After');
        p.insertText(' -', 'After');
      }
      p.alignment = 'Centered';
      p.font.set({ size: 9, name: config.typography.primaryFont });
    }
    if (config.footer.showPTO) {
      const ptoPara = footer.insertParagraph('', 'End');
      ptoPara.insertText('P.T.O.', 'Replace');
      ptoPara.alignment = 'Right';
      ptoPara.font.set({ bold: true, size: 10, name: config.typography.primaryFont });
    }
    if (config.footer.endMarkerText) {
      const endPara = footer.insertParagraph('', 'End');
      endPara.insertText(config.footer.endMarkerText, 'Replace');
      endPara.alignment = 'Centered';
      endPara.font.set({ bold: true, size: 10, name: config.typography.primaryFont });
    }
  });
}

export async function applyToSelection(config: FormattingConfig, parsedDoc: ParsedDocument): Promise<void> {
  if (!officeContext) throw new Error('Office context not initialized');
  await officeContext.run(async (context: any) => {
    const selection = context.document.getSelection();
    selection.load('text');
    await context.sync();
    const text = selection.text;
    if (!text.trim()) throw new Error('No text selected');
    selection.insertText('', 'Replace');
    await buildSections(config, context.document.body, parsedDoc);
    await context.sync();
  });
}

export async function readSelection(): Promise<string> {
  if (!officeContext) throw new Error('Office context not initialized');
  return officeContext.run(async (context: any) => {
    const selection = context.document.getSelection();
    selection.load('text');
    await context.sync();
    return selection.text;
  });
}

export async function readFullDocument(): Promise<string> {
  if (!officeContext) throw new Error('Office context not initialized');
  return officeContext.run(async (context: any) => {
    const body = context.document.body;
    body.load('text');
    await context.sync();
    return body.text;
  });
}