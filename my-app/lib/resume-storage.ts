const RESUME_CONTENT_KEY = "resume-builder:content";
const RESUME_FILE_NAME_KEY = "resume-builder:file-name";
const RESUME_ID_KEY = "resume-builder:resume-id";

export function saveResumeContent(html: string, fileName?: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(RESUME_CONTENT_KEY, html);
  if (fileName) {
    sessionStorage.setItem(RESUME_FILE_NAME_KEY, fileName);
  } else {
    sessionStorage.removeItem(RESUME_FILE_NAME_KEY);
  }
}

export function getResumeContent(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(RESUME_CONTENT_KEY);
}

export function getResumeFileName(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(RESUME_FILE_NAME_KEY);
}

export function getResumeId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(RESUME_ID_KEY);
}

export function saveResumeId(id: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(RESUME_ID_KEY, id);
}

export function clearResumeContent() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(RESUME_CONTENT_KEY);
  sessionStorage.removeItem(RESUME_FILE_NAME_KEY);
  sessionStorage.removeItem(RESUME_ID_KEY);
}
