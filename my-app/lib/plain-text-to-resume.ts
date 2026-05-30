/** Coarse plain-text → structured resume for the FastAPI scorer. */

const SECTION_ALIASES: Record<string, string> = {
  experience: "experience",
  "work experience": "experience",
  employment: "experience",
  education: "education",
  skills: "skills",
  "technical skills": "skills",
  summary: "summary",
  profile: "summary",
  "profile summary": "summary",
  projects: "projects",
  certifications: "certifications",
  contact: "contact",
};

function normalizeHeader(line: string): string | null {
  const normalized = line
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim();
  return SECTION_ALIASES[normalized] ?? null;
}

function extractSections(text: string): Record<string, string> {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const buckets: Record<string, string[]> = {};
  let current = "header";

  for (const line of lines) {
    const section = normalizeHeader(line);
    if (section) {
      current = section;
      buckets[current] ??= [];
      continue;
    }
    buckets[current] ??= [];
    buckets[current].push(line);
  }

  return Object.fromEntries(
    Object.entries(buckets).map(([key, value]) => [key, value.join("\n").trim()]),
  );
}

function parseSkills(text: string): string[] {
  if (!text.trim()) return [];
  return [
    ...new Set(
      text
        .split(/[,;\n|•]/)
        .map((s) => s.replace(/^[-*]\s*/, "").trim())
        .filter((s) => s.length > 1 && s.length < 80),
    ),
  ];
}

function parseBullets(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-•*]\s+/, ""))
    .filter((line) => line.length > 2);
}

function parseExperience(text: string): { role: string; company: string; bullets: string[] }[] {
  const bullets = parseBullets(text);
  if (bullets.length === 0) return [];

  const roleLine = bullets.find((b) => /\d{4}|present|current/i.test(b)) ?? bullets[0];
  const detailBullets = bullets.filter((b) => b !== roleLine);

  return [
    {
      role: roleLine,
      company: "",
      bullets: detailBullets.length > 0 ? detailBullets : bullets,
    },
  ];
}

function parseEducation(text: string): string[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lines.length > 0 ? lines : [];
}

export function plainTextToResume(text: string): Record<string, unknown> {
  const sections = extractSections(text);
  const headerLines =
    sections.header?.split(/\r?\n/).map((l) => l.trim()).filter(Boolean) ?? [];
  const email = text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0];
  const linkedin = text.match(/linkedin\.com\/[\w/-]+/i)?.[0];

  const experienceText =
    sections.experience ?? sections.employment ?? "";
  const skillsText = sections.skills ?? "";
  const summaryText = sections.summary ?? sections.profile ?? "";
  const educationText = sections.education ?? "";

  return {
    name: headerLines[0] ?? "",
    email: email ?? "",
    linkedin: linkedin ?? "",
    summary: summaryText,
    skills: parseSkills(skillsText),
    experience: parseExperience(experienceText),
    education: parseEducation(educationText),
    projects: sections.projects ? [sections.projects] : [],
  };
}
