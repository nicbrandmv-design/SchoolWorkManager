import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateStudyMaterial } from "@/lib/ai";
import { jsonError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const material = await prisma.material.findUnique({ where: { id } });
  if (!material) return jsonError("Material not found", 404);
  if (!material.extractedText) {
    return jsonError("No extracted text available for this material", 422);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonError(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local to enable AI generation.",
      500,
    );
  }

  let unitId = material.unitId;
  if (!unitId) {
    const count = await prisma.unit.count({ where: { classId: material.classId } });
    const unit = await prisma.unit.create({
      data: { classId: material.classId, name: material.originalName.replace(/\.pdf$/i, ""), order: count },
    });
    unitId = unit.id;
    await prisma.material.update({ where: { id }, data: { unitId } });
  }

  await prisma.material.update({ where: { id }, data: { status: "PROCESSING", errorMessage: null } });

  try {
    const result = await generateStudyMaterial(material.extractedText);

    const conceptIdByName = new Map<string, string>();
    for (const name of result.concepts) {
      const trimmed = name.trim();
      if (!trimmed) continue;
      const concept = await prisma.concept.upsert({
        where: { unitId_name: { unitId, name: trimmed } },
        update: {},
        create: { unitId, name: trimmed },
      });
      conceptIdByName.set(trimmed.toLowerCase(), concept.id);
    }

    async function resolveConceptId(name: string): Promise<string | null> {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const existing = conceptIdByName.get(trimmed.toLowerCase());
      if (existing) return existing;
      const concept = await prisma.concept.upsert({
        where: { unitId_name: { unitId: unitId!, name: trimmed } },
        update: {},
        create: { unitId: unitId!, name: trimmed },
      });
      conceptIdByName.set(trimmed.toLowerCase(), concept.id);
      return concept.id;
    }

    for (const card of result.flashcards) {
      const conceptId = await resolveConceptId(card.concept);
      await prisma.flashcard.create({
        data: {
          classId: material.classId,
          unitId,
          conceptId,
          materialId: material.id,
          front: card.front,
          back: card.back,
        },
      });
    }

    for (const q of result.quizQuestions) {
      const conceptId = await resolveConceptId(q.concept);
      await prisma.quizQuestion.create({
        data: {
          classId: material.classId,
          unitId,
          conceptId,
          materialId: material.id,
          question: q.question,
          choices: JSON.stringify(q.choices),
          answerIndex: q.answerIndex,
          explanation: q.explanation,
        },
      });
    }

    const updated = await prisma.material.update({
      where: { id },
      data: { status: "DONE" },
      include: { flashcards: true, quizQuestions: true, unit: true },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Generation failed";
    await prisma.material.update({
      where: { id },
      data: { status: "ERROR", errorMessage: message },
    });
    return jsonError(message, 500);
  }
}
