import { prisma } from "@/lib/prisma";
import { extractPdfText } from "@/lib/pdf";

export async function createMaterialFromBuffer(params: {
  classId: string;
  unitId: string | null;
  originalName: string;
  filePath: string;
  buffer: Buffer;
}) {
  const material = await prisma.material.create({
    data: {
      classId: params.classId,
      unitId: params.unitId,
      originalName: params.originalName,
      filePath: params.filePath,
      status: "PROCESSING",
    },
  });

  try {
    const text = await extractPdfText(params.buffer);
    return await prisma.material.update({
      where: { id: material.id },
      data: { extractedText: text, status: "PENDING" },
    });
  } catch (err) {
    console.error(err);
    return await prisma.material.update({
      where: { id: material.id },
      data: { status: "ERROR", errorMessage: "Failed to extract text from PDF" },
    });
  }
}
