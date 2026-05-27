function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const BULLET_RE = /^[•●○▪‣\-\–—\*]\s+/;
const HR_RE = /^[-–—_=]{4,}$/;
const SECTION_RE =
  /^(profile summary|summary|technical skills|skills|experience|work experience|education|projects|certifications|achievements|contact)\s*:?\s*$/i;

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

export function plainTextToStructuredHtml(text: string): string {
  const rawLines = text.split(/\n/);
  const htmlParts: string[] = [];
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return;
    const joined = paragraphBuffer.map((l) => escapeHtml(l.trim())).join("<br>");
    htmlParts.push(`<p>${joined}</p>`);
    paragraphBuffer = [];
  };

  for (const rawLine of rawLines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      continue;
    }

    if (HR_RE.test(line.replace(/\s/g, ""))) {
      flushParagraph();
      htmlParts.push("<hr>");
      continue;
    }

    if (BULLET_RE.test(line)) {
      flushParagraph();
      const body = escapeHtml(line.replace(BULLET_RE, "").trim());
      htmlParts.push(`<li>${body}</li>`);
      continue;
    }

    if (SECTION_RE.test(line)) {
      flushParagraph();
      htmlParts.push(`<h2>${escapeHtml(line.replace(/:$/, ""))}</h2>`);
      continue;
    }

    // Short all-caps or title-like line alone → section heading
    if (
      line.length < 50 &&
      (line === line.toUpperCase() || /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(line))
    ) {
      const words = line.split(/\s+/);
      if (words.length <= 5 && !line.includes(",")) {
        flushParagraph();
        htmlParts.push(`<h2>${escapeHtml(line)}</h2>`);
        continue;
      }
    }

    // First non-empty line that looks like a name (short, no bullet)
    if (htmlParts.length === 0 && paragraphBuffer.length === 0 && line.length < 60) {
      flushParagraph();
      htmlParts.push(`<h1>${escapeHtml(line)}</h1>`);
      continue;
    }

    paragraphBuffer.push(line);
  }

  flushParagraph();

  const wrapped = wrapListItems(htmlParts);
  return wrapped || "<p></p>";
}
