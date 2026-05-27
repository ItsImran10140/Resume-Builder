export type ResumeContentJson = {
  html: string;
  fileName?: string;
};

export function parseResumeContent(content: unknown): ResumeContentJson {
  if (!content || typeof content !== "object") {
    return { html: "" };
  }

  const record = content as Record<string, unknown>;
  return {
    html: typeof record.html === "string" ? record.html : "",
    fileName:
      typeof record.fileName === "string" ? record.fileName : undefined,
  };
}

export function buildResumeContent(
  html: string,
  fileName?: string,
): ResumeContentJson {
  return fileName ? { html, fileName } : { html };
}
