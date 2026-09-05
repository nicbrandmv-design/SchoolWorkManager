import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";

const createUnitSchema = z.object({
  classId: z.string().min(1),
  name: z.string().trim().min(1, "Name is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = createUnitSchema.parse(await req.json());
    const count = await prisma.unit.count({ where: { classId: body.classId } });
    const created = await prisma.unit.create({
      data: { ...body, order: count },
      include: { concepts: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
