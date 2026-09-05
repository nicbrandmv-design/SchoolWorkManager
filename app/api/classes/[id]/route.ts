import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError } from "@/lib/api";

const updateClassSchema = z.object({
  name: z.string().trim().min(1).optional(),
  color: z.string().trim().min(1).optional(),
  term: z.string().trim().nullable().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      units: { orderBy: { order: "asc" }, include: { concepts: true } },
      materials: { orderBy: { uploadedAt: "desc" } },
      assignments: { orderBy: { dueDate: "asc" } },
    },
  });
  if (!cls) return jsonError("Class not found", 404);
  return NextResponse.json(cls);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = updateClassSchema.parse(await req.json());
    const updated = await prisma.class.update({ where: { id }, data: body });
    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.class.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
