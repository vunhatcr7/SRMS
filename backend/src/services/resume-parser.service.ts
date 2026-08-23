import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import { Express } from 'express';

const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const extractResumeText = async (file: Express.Multer.File): Promise<string> => {
  if (file.mimetype === 'application/pdf') {
    const parser = new PDFParse({ data: file.buffer });
    try {
      const result = await parser.getText();
      return result.text.trim();
    } finally {
      await parser.destroy();
    }
  }

  if (file.mimetype === DOCX_MIME_TYPE) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value.trim();
  }

  throw new Error('Định dạng CV không được hỗ trợ.');
};