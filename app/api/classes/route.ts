import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";

const createClassSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  color: z.string().trim().min(1).optional(),
  term: z.string().trim().optional(),
});

export async function GET() {
  const classes = await prisma.class.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: { units: true, materials: true, flashcards: true, assignments: true },
      },
    },
  });
  return NextResponse.json(classes);
}

export async function POST(req: NextRequest) {
  try {
    const body = createClassSchema.parse(await req.json());
    const created = await prisma.class.create({ data: body });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
