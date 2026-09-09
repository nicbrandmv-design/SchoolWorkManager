import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { saveUpload } from "@/lib/storage";
import { createMaterialFromBuffer } from "@/lib/materials";
import { jsonError, handleApiError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const classId = req.nextUrl.searchParams.get("classId") ?? undefined;
  const materials = await prisma.material.findMany({
    where: classId ? { classId } : undefined,
    orderBy: { uploadedAt: "desc" },
    include: { unit: { select: { id: true, name: true } } },
  });
  return NextResponse.json(materials);
}

const fromBlobSchema = z.object({
  classId: z.string().min(1),
  unitId: z.string().min(1).nullable().optional(),
  originalName: z.string().min(1),
  blobUrl: z.string().url(),
});

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  // The file was already uploaded directly from the browser to Vercel Blob
  // (bypassing this function's request-body size limit); we just fetch it
  // back once, server-side, to extract text and record it.
  if (contentType.includes("application/json")) {
    try {
      const { classId, unitId, originalName, blobUrl } = fromBlobSchema.parse(await req.json());

      const cls = await prisma.class.findUnique({ where: { id: classId } });
      if (!cls) return jsonError("Class not found", 404);

      const blobRes = await fetch(blobUrl);
      if (!blobRes.ok) return jsonError("Could not read the uploaded file", 502);
      const buffer = Buffer.from(await blobRes.arrayBuffer());

      const material = await createMaterialFromBuffer({
        classId,
        unitId: unitId ?? null,
        originalName,
        filePath: blobUrl,
        buffer,
      });
      return NextResponse.json(material, { status: 201 });
    } catch (err) {
      return handleApiError(err);
    }
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const classId = formData.get("classId");
  const unitId = formData.get("unitId");

  if (!(file instanceof File)) return jsonError("A PDF file is required");
  if (typeof classId !== "string" || !classId) return jsonError("classId is required");
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return jsonError("Only PDF files are supported");
  }

  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) return jsonError("Class not found", 404);

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || ".pdf";
  const storedName = `${randomUUID()}${ext}`;
  const filePath = await saveUpload(storedName, buffer);

  const material = await createMaterialFromBuffer({
    classId,
    unitId: typeof unitId === "string" && unitId ? unitId : null,
    originalName: file.name,
    filePath,
    buffer,
  });
  return NextResponse.json(material, { status: 201 });
}
