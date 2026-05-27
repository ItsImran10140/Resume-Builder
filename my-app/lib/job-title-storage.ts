const JOB_TITLE_KEY = "resume-builder:job-title";

export function getStoredJobTitle(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(JOB_TITLE_KEY) ?? "";
}

export function saveJobTitle(title: string) {
  if (typeof window === "undefined") return;
  if (title.trim()) {
    sessionStorage.setItem(JOB_TITLE_KEY, title);
  } else {
    sessionStorage.removeItem(JOB_TITLE_KEY);
  }
}
