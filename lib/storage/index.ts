import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { AppError } from "@/lib/errors";

export type StoredFile = {
  key: string;
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export interface StorageAdapter {
  save(file: File, folder: string): Promise<StoredFile>;
  delete(key: string): Promise<void>;
  absolutePath(key: string): string;
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

const DOCUMENT_EXTENSIONS: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "text/plain": ".txt",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
};

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export function isImageFile(file: File) {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type);
}

export function assertImageFile(file: File) {
  if (!isImageFile(file)) {
    throw new AppError("VALIDATION", "Photos must be JPEG, PNG, WebP, or GIF.");
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new AppError("VALIDATION", "Photos must be 5MB or smaller.");
  }
}

export function isDocumentFile(file: File) {
  return (ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(file.type);
}

export function assertDocumentFile(file: File) {
  if (!file.size) {
    throw new AppError("VALIDATION", "Choose a file to upload.");
  }

  if (!isDocumentFile(file)) {
    throw new AppError("VALIDATION", "Files must be PDF, Word, Excel, text, or an image.");
  }

  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new AppError("VALIDATION", "Files must be 10MB or smaller.");
  }
}

function extensionFor(file: File) {
  const fromName = path.extname(file.name);
  if (fromName) {
    return fromName;
  }

  return DOCUMENT_EXTENSIONS[file.type] ?? "";
}

export function isStoredFileUrl(url: string) {
  return url.startsWith("/api/files/");
}

function assertSafeKey(key: string) {
  const normalized = path.posix.normalize(key).replace(/^\/+/, "");
  if (!normalized || normalized.startsWith("..") || path.isAbsolute(normalized)) {
    throw new AppError("NOT_FOUND", "File not found");
  }

  const absolute = path.resolve(UPLOAD_ROOT, normalized);
  if (!absolute.startsWith(UPLOAD_ROOT)) {
    throw new AppError("NOT_FOUND", "File not found");
  }

  return { key: normalized, absolute };
}

class LocalStorageAdapter implements StorageAdapter {
  async save(file: File, folder: string): Promise<StoredFile> {
    if (!file.size) {
      throw new AppError("VALIDATION", "Choose a file to upload.");
    }

    const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, "");
    const extension = extensionFor(file) || ".bin";
    const key = `${safeFolder}/${randomUUID()}${extension}`;
    const { absolute } = assertSafeKey(key);

    await mkdir(path.dirname(absolute), { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolute, buffer);

    return {
      key,
      url: `/api/files/${key}`,
      fileName: sanitizeFileName(file.name),
      mimeType: file.type,
      sizeBytes: file.size,
    };
  }

  async delete(key: string) {
    const { absolute } = assertSafeKey(key);
    await unlink(absolute).catch(() => undefined);
  }

  absolutePath(key: string) {
    return assertSafeKey(key).absolute;
  }
}

export const storage: StorageAdapter = new LocalStorageAdapter();

export function fileKeyFromUrl(url: string) {
  return url.replace(/^\/api\/files\//, "");
}
