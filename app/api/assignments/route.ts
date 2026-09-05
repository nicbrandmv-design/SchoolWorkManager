import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";

const createAssignmentSchema = z.object({
  classId: z.string().min(1),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  type: z.enum(["HOMEWORK", "EXAM", "PROJECT", "OTHER"]).optional(),
});

export async function GET(req: NextRequest) {
  const classId = req.nextUrl.searchParams.get("classId") ?? undefined;
  const assignments = await prisma.assignment.findMany({
    where: classId ? { classId } : undefined,
    orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    include: { class: { select: { id: true, name: true, color: true } } },
  });
  return NextResponse.json(assignments);
}

export async function POST(req: NextRequest) {
  try {
    const body = createAssignmentSchema.parse(await req.json());
    const created = await prisma.assignment.create({
      data: {
        ...body,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
