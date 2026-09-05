// Import the inner module directly, not the "pdf-parse" package root: that
// entry point's index.js runs a debug self-test on load (reads a fixture
// file that doesn't exist here) whenever bundlers break its `module.parent`
// check, which Turbopack/webpack do.
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer);
  return result.text.trim();
}
