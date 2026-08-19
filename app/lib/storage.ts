import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "uploads");
const ORIGINALS_DIR = path.join(STORAGE_ROOT, "originals");
const RESIZED_DIR = path.join(STORAGE_ROOT, "resized");

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(ORIGINALS_DIR, { recursive: true });
  await fs.mkdir(RESIZED_DIR, { recursive: true });
}

export async function saveOriginalImage(
  buffer: Buffer,
  originalFilename: string
): Promise<{ storageKey: string; fullPath: string }> {
  await ensureDirectories();
  const ext = path.extname(originalFilename) || ".bin";
  const uniqueId = crypto.randomUUID();
  const storageKey = `orig_${uniqueId}${ext}`;
  const fullPath = path.join(ORIGINALS_DIR, storageKey);

  await fs.writeFile(fullPath, buffer);
  return { storageKey, fullPath };
}

export async function saveResizedImage(
  buffer: Buffer,
  format: string
): Promise<{ outputKey: string; fullPath: string }> {
  await ensureDirectories();
  const uniqueId = crypto.randomUUID();
  const ext = format.toLowerCase().replace("jpeg", "jpg");
  const outputKey = `resize_${uniqueId}.${ext}`;
  const fullPath = path.join(RESIZED_DIR, outputKey);

  await fs.writeFile(fullPath, buffer);
  return { outputKey, fullPath };
}

export function getOriginalPath(storageKey: string): string {
  // Prevent directory traversal
  const safeKey = path.basename(storageKey);
  return path.join(ORIGINALS_DIR, safeKey);
}

export function getResizedPath(outputKey: string): string {
  const safeKey = path.basename(outputKey);
  return path.join(RESIZED_DIR, safeKey);
}

export async function deleteStorageFile(storageKey: string, isResized = false): Promise<void> {
  try {
    const filePath = isResized ? getResizedPath(storageKey) : getOriginalPath(storageKey);
    await fs.unlink(filePath);
  } catch (error) {
    // Ignore if file doesn't exist
  }
}
