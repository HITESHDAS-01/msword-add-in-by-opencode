import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
import { FormattingConfig, SampleExtractionResult } from '@/types/schema';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: true,
  parseAttributeValue: true,
});

function twipsToPoints(twips: number): number {
  return twips / 20;
}

function twipsToInches(twips: number): number {
  return twips / 1440;
}

function extractFontSize(szVal?: string): number {
  if (!szVal) return 11;
  const val = parseInt(szVal, 10);
  return isNaN(val) ? 11 : val / 2;
}

function extractMargins(docProps: any): FormattingConfig['pageSetup']['margins'] {
  const pgMar = docProps['w:pgMar'];
  if (!pgMar) return { top: 72, bottom: 72, left: 72, right: 72 };
  return {
    top: twipsToPoints(parseInt(pgMar['@_w:top'] || '1440', 10)),
    bottom: twipsToPoints(parseInt(pgMar['@_w:bottom'] || '1440', 10)),
    left: twipsToPoints(parseInt(pgMar['@_w:left'] || '1440', 10)),
    right: twipsToPoints(parseInt(pgMar['@_w:right'] || '1440', 10)),
  };
}

function extractPageSize(docProps: any): { paperSize: FormattingConfig['pageSetup']['paperSize']; orientation: FormattingConfig['pageSetup']['orientation'] } {
  const pgSz = docProps['w:pgSz'];
  if (!pgSz) return { paperSize: 'A4', orientation: 'Portrait' };
  const w = parseInt(pgSz['@_w:w'] || '11906', 10);
  const h = parseInt(pgSz['@_w:h'] || '16838', 10);
  const orient = pgSz['@_w:orient'] === 'landscape' ? 'Landscape' : 'Portrait';
  let paperSize: FormattingConfig['pageSetup']['paperSize'] = 'A4';
  if (w === 12240 && h === 15840) paperSize = 'Letter';
  else if (w === 13920 && h === 22920) paperSize = 'Legal';
  else if (w === 16838 && h === 11906) paperSize = 'A4';
  return { paperSize, orientation: orient };
}

function extractFonts(stylesXml: any): { primary: string; secondary: string } {
  const styles = stylesXml['w:styles']?.['w:style'] || [];
  const fonts = new Set<string>();
  styles.forEach((style: any) => {
    const rPr = style['w:rPr'];
    if (rPr?.['w:rFonts']) {
      const rf = rPr['w:rFonts'];
      if (rf['@_w:ascii']) fonts.add(rf['@_w:ascii']);
      if (rf['@_w:hAnsi']) fonts.add(rf['@_w:hAnsi']);
      if (rf['@_w:cs']) fonts.add(rf['@_w:cs']);
      if (rf['@_w:eastAsia']) fonts.add(rf['@_w:eastAsia']);
    }
  });
  const fontArray = Array.from(fonts);
  return {
    primary: fontArray[0] || 'Times New Roman',
    secondary: fontArray[1] || 'Nirmala UI',
  };
}

function extractHeaderStructure(documentXml: any): Partial<FormattingConfig['header']> {
  const body = documentXml['w:document']?.['w:body'];
  if (!body) return {};
  const children = body['w:p'] || [];
  const headerInfo: Partial<FormattingConfig['header']> = {
    instituteName: '',
    instituteSubtitle: '',
    examTitle: '',
    className: '',
    subject: '',
    timeAllowed: '',
    maxMarks: '',
  };
  children.slice(0, 10).forEach((p: any) => {
    const text = extractParagraphText(p);
    if (text.length > 3 && text.length < 80) {
      if (!headerInfo.instituteName && text.match(/school|institute|college|academy|university/i)) {
        headerInfo.instituteName = text;
      } else if (!headerInfo.examTitle && text.match(/exam|test|examination|assessment/i)) {
        headerInfo.examTitle = text;
      } else if (!headerInfo.subject && text.match(/subject|paper|mathematics|science|english|hindi/i)) {
        headerInfo.subject = text;
      }
    }
  });
  return headerInfo;
}

function extractParagraphText(p: any): string {
  if (!p) return '';
  const runs = p['w:r'] || [];
  return runs.map((r: any) => r['w:t']?.['#text'] || '').join('');
}

export async function extractDocxStyle(file: File): Promise<SampleExtractionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const documentXmlFile = zip.file('word/document.xml');
    const stylesXmlFile = zip.file('word/styles.xml');
    const settingsXmlFile = zip.file('word/settings.xml');
    if (!documentXmlFile || !stylesXmlFile) {
      throw new Error('Invalid .docx: missing document.xml or styles.xml');
    }
    const documentXmlText = await documentXmlFile.async('text');
    const stylesXmlText = await stylesXmlFile.async('text');
    const documentXml = parser.parse(documentXmlText);
    const stylesXml = parser.parse(stylesXmlText);
    const docProps = documentXml['w:document']?.['w:body']?.['w:sectPr'] || {};
    const margins = extractMargins(docProps);
    const { paperSize, orientation } = extractPageSize(docProps);
    const { primary, secondary } = extractFonts(stylesXml);
    const header = extractHeaderStructure(documentXml);
    const config: Partial<FormattingConfig> = {
      pageSetup: {
        paperSize,
        orientation,
        columns: 1,
        margins,
        pageBorder: 'none',
      },
      header: {
        enabled: true,
        style: 'boxed',
        instituteName: header.instituteName || 'YOUR SCHOOL NAME',
        instituteSubtitle: header.instituteSubtitle || 'Address Line 1, City - PIN',
        examTitle: header.examTitle || 'EXAMINATION',
        className: header.className || 'Class X',
        subject: header.subject || 'SUBJECT',
        subjectCode: '',
        paperSet: 'Set-A',
        timeAllowed: header.timeAllowed || '3 Hours',
        maxMarks: header.maxMarks || '80',
        showRollNoBoxes: true,
        rollNoBoxCount: 5,
        generalInstructions: [],
      },
      typography: {
        primaryFont: primary,
        secondaryFont: secondary,
        titleSize: 16,
        subHeaderSize: 12,
        sectionTitleSize: 12,
        questionSize: 11.5,
        optionSize: 11,
        lineSpacing: 1.15,
        questionGapAfter: 4,
      },
      questionsAndMarks: {
        sectionStyle: 'centered-underline',
        questionNumberPrefix: '1.',
        subQuestionStyle: '(i)',
        marksFormat: '[X]',
        marksLeader: 'dots',
        centerChoiceOr: true,
      },
      mcqAndTables: {
        mcqLayout: 'auto',
        optionLabelStyle: '(a)',
        preserveEquationsAndImages: true,
      },
      footer: {
        pageNumberStyle: 'page-x-of-y',
        showPTO: true,
        endMarkerText: '*** END OF QUESTION PAPER ***',
        watermarkText: '',
      },
    };
    return { config, confidence: 0.75, source: 'docx' };
  } catch (error) {
    console.error('DOCX extraction error:', error);
    throw new Error(`Failed to extract style from .docx: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}