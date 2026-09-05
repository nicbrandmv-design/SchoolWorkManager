import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const classId = req.nextUrl.searchParams.get("classId");
  const unitIds = req.nextUrl.searchParams.get("unitIds")?.split(",").filter(Boolean);
  const conceptIds = req.nextUrl.searchParams.get("conceptIds")?.split(",").filter(Boolean);

  if (!classId) return jsonError("classId is required");

  const flashcards = await prisma.flashcard.findMany({
    where: {
      classId,
      ...(conceptIds?.length ? { conceptId: { in: conceptIds } } : {}),
      ...(!conceptIds?.length && unitIds?.length ? { unitId: { in: unitIds } } : {}),
    },
    include: { concept: true, unit: { select: { id: true, name: true } }, progress: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(flashcards);
}
