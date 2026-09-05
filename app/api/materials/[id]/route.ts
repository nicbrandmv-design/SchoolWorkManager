import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteUpload } from "@/lib/storage";
import { jsonError, handleApiError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const material = await prisma.material.findUnique({
    where: { id },
    include: {
      unit: { select: { id: true, name: true } },
      flashcards: { include: { concept: true } },
      quizQuestions: { include: { concept: true } },
    },
  });
  if (!material) return jsonError("Material not found", 404);
  return NextResponse.json(material);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const material = await prisma.material.findUnique({ where: { id } });
    if (!material) return jsonError("Material not found", 404);
    await prisma.material.delete({ where: { id } });
    await deleteUpload(material.filePath);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
