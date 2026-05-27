type PdfTextItem = {
  str: string;
  x: number;
  y: number;
  fontSize: number;
  fontName: string;
  bold: boolean;
  italic: boolean;
  width: number;
};

type TextLine = {
  y: number;
  items: PdfTextItem[];
  text: string;
  avgFontSize: number;
  bold: boolean;
  centered: boolean;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isBoldFont(fontName: string): boolean {
  return /bold|black|heavy|semibold|demi/i.test(fontName);
}

function isItalicFont(fontName: string): boolean {
  return /italic|oblique/i.test(fontName);
}

function itemFromPdfJs(item: unknown): PdfTextItem | null {
  if (!item || typeof item !== "object" || !("str" in item)) return null;
  const raw = item as {
    str?: string;
    transform?: number[];
    width?: number;
    fontName?: string;
  };
  if (!raw.str?.trim()) return null;
  const t = raw.transform ?? [12, 0, 0, 12, 0, 0];
  const fontSize = Math.max(Math.abs(t[0]), Math.abs(t[3]), 10);
  const fontName = raw.fontName ?? "";
  return {
    str: raw.str,
    x: t[4],
    y: t[5],
    fontSize,
    fontName,
    bold: isBoldFont(fontName),
    italic: isItalicFont(fontName),
    width: raw.width ?? 0,
  };
}

function joinLineItems(items: PdfTextItem[]): string {
  const sorted = [...items].sort((a, b) => a.x - b.x);
  let text = "";
  let lastEnd = -Infinity;

  for (const item of sorted) {
    const gap = item.x - lastEnd;
    if (text && gap > item.fontSize * 0.35) {
      text += " ";
    }
    text += item.str;
    lastEnd = item.x + item.width;
  }

  return text.replace(/\s+/g, " ").trim();
}

function groupIntoLines(items: PdfTextItem[], pageWidth: number): TextLine[] {
  const Y_TOLERANCE = 3;
  const lines: TextLine[] = [];

  for (const item of items) {
    let line = lines.find((l) => Math.abs(l.y - item.y) <= Y_TOLERANCE);
    if (!line) {
      line = {
        y: item.y,
        items: [],
        text: "",
        avgFontSize: 0,
        bold: false,
        centered: false,
      };
      lines.push(line);
    }
    line.items.push(item);
  }

  for (const line of lines) {
    line.text = joinLineItems(line.items);
    const sizes = line.items.map((i) => i.fontSize);
    line.avgFontSize =
      sizes.reduce((a, b) => a + b, 0) / Math.max(sizes.length, 1);
    line.bold = line.items.every((i) => i.bold) || line.items[0]?.bold === true;
    const minX = Math.min(...line.items.map((i) => i.x));
    const maxX = Math.max(...line.items.map((i) => i.x + i.width));
    const center = (minX + maxX) / 2;
    line.centered = Math.abs(center - pageWidth / 2) < pageWidth * 0.12;
  }

  return lines.sort((a, b) => b.y - a.y);
}

function wrapChunk(item: PdfTextItem, text: string): string {
  let chunk = escapeHtml(text);
  if (item.bold) chunk = `<strong>${chunk}</strong>`;
  if (item.italic) chunk = `<em>${chunk}</em>`;
  return chunk;
}

function formatLineInline(line: TextLine): string {
  if (line.items.length <= 1) {
    const item = line.items[0];
    return item ? wrapChunk(item, line.text) : escapeHtml(line.text);
  }

  const sorted = [...line.items].sort((a, b) => a.x - b.x);
  let html = "";
  let lastEnd = -Infinity;

  for (const item of sorted) {
    const gap = item.x - lastEnd;
    if (html && gap > item.fontSize * 0.35) {
      html += " ";
    }
    html += wrapChunk(item, item.str);
    lastEnd = item.x + item.width;
  }

  return html;
}

function median(values: number[]): number {
  if (values.length === 0) return 12;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

const BULLET_RE = /^[•●○▪‣\-\–—\*]\s*/;
const HR_RE = /^[-–—_=─\s]{4,}$/;

const SECTION_HEADINGS = new Set([
  "profile summary",
  "summary",
  "technical skills",
  "skills",
  "experience",
  "work experience",
  "education",
  "projects",
  "certifications",
  "achievements",
  "contact",
]);

function isSectionHeading(text: string, bold: boolean): boolean {
  const normalized = text.replace(/[:\s]+$/g, "").trim().toLowerCase();
  return bold && (SECTION_HEADINGS.has(normalized) || normalized.length < 35);
}

function classifyLine(
  line: TextLine,
  medianFontSize: number,
  lineIndex: number,
  totalLines: number
): string {
  const text = line.text.trim();
  if (!text) return "";

  if (HR_RE.test(text.replace(/\s/g, ""))) {
    return "<hr>";
  }

  const bulletMatch = text.match(BULLET_RE);
  if (bulletMatch) {
    const body = escapeHtml(text.slice(bulletMatch[0].length).trim());
    return `<li>${body}</li>`;
  }

  const inline = formatLineInline(line);

  if (line.avgFontSize >= medianFontSize * 1.4 || (line.centered && lineIndex < 3)) {
    return `<h1>${inline}</h1>`;
  }

  if (
    line.avgFontSize >= medianFontSize * 1.12 ||
    isSectionHeading(text, line.bold)
  ) {
    return `<h2>${inline}</h2>`;
  }

  if (line.bold && text.length < 90) {
    return `<h3>${inline}</h3>`;
  }

  if (line.centered) {
    return `<p style="text-align: center">${inline}</p>`;
  }

  return `<p>${inline}</p>`;
}

function wrapListItems(htmlParts: string[]): string {
  const result: string[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length > 0) {
      result.push(`<ul>${listBuffer.join("")}</ul>`);
      listBuffer = [];
    }
  };

  for (const part of htmlParts) {
    if (part.startsWith("<li>")) {
      listBuffer.push(part);
    } else {
      flushList();
      result.push(part);
    }
  }
  flushList();
  return result.join("");
}

export function layoutLinesToHtml(lines: TextLine[]): string {
  const fontSizes = lines.flatMap((l) => l.items.map((i) => i.fontSize));
  const medianFontSize = median(fontSizes);

  const htmlParts = lines
    .map((line, index) =>
      classifyLine(line, medianFontSize, index, lines.length)
    )
    .filter(Boolean);

  const wrapped = wrapListItems(htmlParts);
  return wrapped || "<p></p>";
}

type PdfPageLike = {
  getViewport: (opts: { scale: number }) => { width: number };
  getTextContent: () => Promise<{ items: unknown[] }>;
};

export async function extractPdfLayoutHtml(
  getPage: (n: number) => Promise<PdfPageLike>,
  numPages: number
): Promise<string> {
  const pageHtml: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const pageItems: PdfTextItem[] = [];

    for (const raw of content.items) {
      const item = itemFromPdfJs(raw);
      if (item) pageItems.push(item);
    }

    const lines = groupIntoLines(pageItems, viewport.width);
    pageHtml.push(layoutLinesToHtml(lines));
  }

  return pageHtml.join("") || "<p></p>";
}
