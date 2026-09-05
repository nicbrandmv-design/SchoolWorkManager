import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";

const MAX_BOX = 5;
const MIN_BOX = 1;

const progressSchema = z.object({
  flashcardId: z.string().min(1),
  correct: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    const { flashcardId, correct } = progressSchema.parse(await req.json());

    const existing = await prisma.studyProgress.findUnique({ where: { flashcardId } });
    const nextBox = correct
      ? Math.min(MAX_BOX, (existing?.box ?? MIN_BOX) + 1)
      : MIN_BOX;

    const progress = await prisma.studyProgress.upsert({
      where: { flashcardId },
      update: {
        box: nextBox,
        lastReviewedAt: new Date(),
        timesCorrect: { increment: correct ? 1 : 0 },
        timesWrong: { increment: correct ? 0 : 1 },
      },
      create: {
        flashcardId,
        box: nextBox,
        lastReviewedAt: new Date(),
        timesCorrect: correct ? 1 : 0,
        timesWrong: correct ? 0 : 1,
      },
    });

    return NextResponse.json(progress);
  } catch (err) {
    return handleApiError(err);
  }
}
