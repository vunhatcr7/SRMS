import { randomUUID } from 'crypto';
import { Express } from 'express';
import { mkdir, readFile, rename, unlink, writeFile } from 'fs/promises';
import path from 'path';

const USER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STORAGE_KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const MAX_RESUME_FILE_SIZE = 5 * 1024 * 1024;

export class ResumeFileNotFoundError extends Error {
  constructor() {
    super('CV không tồn tại trong kho lưu trữ.');
    this.name = 'ResumeFileNotFoundError';
  }
}

export class InvalidResumeFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidResumeFileError';
  }
}

const getStorageRoot = (): string => {
  const configuredDirectory = process.env.CV_STORAGE_DIR;
  return path.resolve(
    configuredDirectory || path.resolve(__dirname, '../../storage/cv'),
  );
};

const getUserDirectory = (userId: string): string => {
  if (!USER_ID_PATTERN.test(userId)) {
    throw new Error('Candidate user id is invalid.');
  }

  const root = getStorageRoot();
  const directory = path.resolve(root, userId);
  const relativePath = path.relative(root, directory);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error('Resume path is outside the configured storage directory.');
  }

  return directory;
};

const getFilePath = (userId: string, storageKey: string): string => {
  if (!STORAGE_KEY_PATTERN.test(storageKey)) {
    throw new Error('Resume storage key is invalid.');
  }

  const directory = getUserDirectory(userId);
  const root = getStorageRoot();
  const filePath = path.resolve(directory, storageKey);
  const relativePath = path.relative(root, filePath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error('Resume path is outside the configured storage directory.');
  }

  return filePath;
};

export const validateResumeFile = (
  file: Express.Multer.File,
): 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => {
  if (!Buffer.isBuffer(file.buffer) || file.size !== file.buffer.length || file.size < 1 || file.size > MAX_RESUME_FILE_SIZE) {
    throw new InvalidResumeFileError('File CV phải có dung lượng từ 1 byte đến 5 MB.');
  }

  const extension = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;
  const isPdf = mimeType === 'application/pdf'
    && extension === '.pdf'
    && file.buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  const isDocx = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    && extension === '.docx'
    && file.buffer.length >= 4
    && file.buffer[0] === 0x50
    && file.buffer[1] === 0x4b
    && file.buffer[2] === 0x03
    && file.buffer[3] === 0x04;

  if (isPdf) {
    return 'application/pdf';
  }
  if (isDocx) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  throw new InvalidResumeFileError('Chỉ chấp nhận file PDF hoặc DOCX hợp lệ.');
};

export const storeResumeFile = async (userId: string, buffer: Buffer): Promise<string> => {
  const directory = getUserDirectory(userId);
  const storageKey = randomUUID();
  const filePath = getFilePath(userId, storageKey);
  const temporaryPath = path.join(directory, `.${storageKey}.tmp`);

  await mkdir(directory, { recursive: true });

  try {
    await writeFile(temporaryPath, buffer, { flag: 'wx', mode: 0o600 });
    await rename(temporaryPath, filePath);
    return storageKey;
  } catch (error: unknown) {
    try {
      await unlink(temporaryPath);
    } catch (cleanupError: unknown) {
      if ((cleanupError as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Failed to clean up temporary CV file:', cleanupError);
      }
    }
    throw error;
  }
};

export const readResumeFile = async (userId: string, storageKey: string): Promise<Buffer> => {
  const filePath = getFilePath(userId, storageKey);
  try {
    return await readFile(filePath);
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new ResumeFileNotFoundError();
    }
    throw error;
  }
};

export const removeResumeFile = async (userId: string, storageKey: string): Promise<void> => {
  const filePath = getFilePath(userId, storageKey);
  try {
    await unlink(filePath);
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
};
