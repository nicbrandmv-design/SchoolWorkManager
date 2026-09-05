import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

const client = new Anthropic();

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

// Keep each call comfortably inside the model's context window.
const MAX_CHARS_PER_CHUNK = 60_000;

export const GeneratedFlashcardSchema = z.object({
  front: z.string(),
  back: z.string(),
  concept: z.string(),
});

export const GeneratedQuizQuestionSchema = z.object({
  question: z.string(),
  choices: z.array(z.string()).min(2).max(6),
  answerIndex: z.number().int().min(0),
  explanation: z.string(),
  concept: z.string(),
});

export const GenerationResultSchema = z.object({
  concepts: z.array(z.string()),
  flashcards: z.array(GeneratedFlashcardSchema),
  quizQuestions: z.array(GeneratedQuizQuestionSchema),
});

export type GenerationResult = z.infer<typeof GenerationResultSchema>;

function chunkText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxChars) {
    chunks.push(text.slice(i, i + maxChars));
  }
  return chunks;
}

async function generateFromChunk(chunk: string): Promise<GenerationResult> {
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system:
      "You are an expert study-guide writer helping a student turn their class notes into " +
      "study material. Read the provided notes and produce: (1) a short list of the distinct " +
      "concepts/topics covered, (2) a set of flashcards (front = question or term, back = " +
      "concise answer/definition) covering the important facts, and (3) multiple-choice quiz " +
      "questions (4 choices each, one correct) testing understanding of the material. Tag every " +
      "flashcard and quiz question with the single concept name (from your concepts list) it " +
      "belongs to best. Cover the material thoroughly but avoid trivial or redundant cards.",
    messages: [
      {
        role: "user",
        content: `Here are the notes:\n\n${chunk}`,
      },
    ],
    output_config: {
      format: zodOutputFormat(GenerationResultSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("Model did not return valid structured output");
  }
  return response.parsed_output;
}

export async function generateStudyMaterial(text: string): Promise<GenerationResult> {
  const chunks = chunkText(text, MAX_CHARS_PER_CHUNK);
  const results = await Promise.all(chunks.map(generateFromChunk));

  const merged: GenerationResult = { concepts: [], flashcards: [], quizQuestions: [] };
  const seenConcepts = new Set<string>();
  for (const result of results) {
    for (const concept of result.concepts) {
      const key = concept.trim().toLowerCase();
      if (!seenConcepts.has(key)) {
        seenConcepts.add(key);
        merged.concepts.push(concept.trim());
      }
    }
    merged.flashcards.push(...result.flashcards);
    merged.quizQuestions.push(...result.quizQuestions);
  }
  return merged;
}
