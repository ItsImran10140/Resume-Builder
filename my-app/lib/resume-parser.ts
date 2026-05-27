import { extractPdfLayoutHtml } from "@/lib/pdf-text-layout";
import { plainTextToStructuredHtml } from "@/lib/plain-text-layout";

async function parsePdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;

  return extractPdfLayoutHtml(
    (n) => pdf.getPage(n),
    pdf.numPages
  );
}

async function parseDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.convertToHtml({
    arrayBuffer: await file.arrayBuffer(),
  });
  return result.value || "<p></p>";
}

export async function parseResumeFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (name.endsWith(".html") || name.endsWith(".htm") || type === "text/html") {
    return await file.text();
  }

  if (
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    type === "text/plain" ||
    type === "text/markdown"
  ) {
    return plainTextToStructuredHtml(await file.text());
  }

  if (
    name.endsWith(".docx") ||
    type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return parseDocx(file);
  }

  if (name.endsWith(".pdf") || type === "application/pdf") {
    return parsePdf(file);
  }

  throw new Error(
    "Unsupported file type. Please upload PDF, DOCX, TXT, or HTML."
  );
}

export function parseResumeText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Please paste your resume text or upload a file.");
  }

  if (trimmed.startsWith("<") && trimmed.includes(">")) {
    return trimmed;
  }

  return plainTextToStructuredHtml(trimmed);
}
