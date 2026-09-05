import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

export const UPLOADS_DIR = path.join(process.cwd(), "storage", "uploads");

export async function saveUpload(fileName: string, buffer: Buffer) {
  await mkdir(UPLOADS_DIR, { recursive: true });
  const filePath = path.join(UPLOADS_DIR, fileName);
  await writeFile(filePath, buffer);
  return filePath;
}

export async function deleteUpload(filePath: string) {
  try {
    await unlink(filePath);
  } catch {
    // already gone, nothing to do
  }
}
