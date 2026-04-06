import fs from 'fs';
import path from 'path';

export async function parseResume(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.pdf') {
    const pdfParse = (await import('pdf-parse')).default;
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } else if (ext === '.docx') {
    const mammoth = (await import('mammoth'));
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } else if (ext === '.txt') {
    return fs.readFileSync(filePath, 'utf-8');
  }
  
  throw new Error('Unsupported file format. Use PDF, DOCX, or TXT.');
}

export function extractNameFromResume(text: string): string {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    if (firstLine.length < 50) {
      return firstLine;
    }
  }
  return 'Candidate';
}