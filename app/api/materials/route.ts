import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import { prisma } from "@/lib/prisma";
import { saveUpload } from "@/lib/storage";
import { extractPdfText } from "@/lib/pdf";
import { jsonError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const classId = req.nextUrl.searchParams.get("classId") ?? undefined;
  const materials = await prisma.material.findMany({
    where: classId ? { classId } : undefined,
    orderBy: { uploadedAt: "desc" },
    include: { unit: { select: { id: true, name: true } } },
  });
  return NextResponse.json(materials);
}

export async function POST(req: NextRequest) {
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

  const material = await prisma.material.create({
    data: {
      classId,
      unitId: typeof unitId === "string" && unitId ? unitId : null,
      originalName: file.name,
      filePath,
      status: "PROCESSING",
    },
  });

  try {
    const text = await extractPdfText(buffer);
    const updated = await prisma.material.update({
      where: { id: material.id },
      data: { extractedText: text, status: "PENDING" },
    });
    return NextResponse.json(updated, { status: 201 });
  } catch (err) {
    console.error(err);
    const failed = await prisma.material.update({
      where: { id: material.id },
      data: { status: "ERROR", errorMessage: "Failed to extract text from PDF" },
    });
    return NextResponse.json(failed, { status: 201 });
  }
}
