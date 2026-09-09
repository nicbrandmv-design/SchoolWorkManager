import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { put, del } from "@vercel/blob";

export const UPLOADS_DIR = path.join(process.cwd(), "storage", "uploads");

// Vercel's serverless functions don't have a writable, persistent local disk,
// so uploaded PDFs go to Vercel Blob storage there. Locally (no blob token
// configured) they're written to disk instead — no setup needed for dev.
const useBlobStorage = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export async function saveUpload(fileName: string, buffer: Buffer): Promise<string> {
  if (useBlobStorage) {
    const blob = await put(`uploads/${fileName}`, buffer, { access: "public" });
    return blob.url;
  }
  await mkdir(UPLOADS_DIR, { recursive: true });
  const filePath = path.join(UPLOADS_DIR, fileName);
  await writeFile(filePath, buffer);
  return filePath;
}

export async function deleteUpload(fileRef: string) {
  try {
    if (fileRef.startsWith("http://") || fileRef.startsWith("https://")) {
      await del(fileRef);
    } else {
      await unlink(fileRef);
    }
  } catch {
    // already gone, nothing to do
  }
}
