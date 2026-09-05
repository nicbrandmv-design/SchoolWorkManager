import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";

const updateAssignmentSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  type: z.enum(["HOMEWORK", "EXAM", "PROJECT", "OTHER"]).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = updateAssignmentSchema.parse(await req.json());
    const updated = await prisma.assignment.update({
      where: { id },
      data: {
        ...body,
        dueDate: body.dueDate === undefined ? undefined : body.dueDate ? new Date(body.dueDate) : null,
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.assignment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
