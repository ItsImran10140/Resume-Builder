/** Legacy default block gap applied by the editor — not part of uploaded resumes. */
const LEGACY_DEFAULT_BLOCK_SPACING = /margin-bottom:\s*8px;?/gi

/**
 * Removes editor-injected 8px block spacing so layout matches the source resume.
 */
export function stripDefaultBlockSpacingFromHtml(html: string): string {
  return html
    .replace(LEGACY_DEFAULT_BLOCK_SPACING, "")
    .replace(/\s*style="\s*"/gi, "")
    .replace(/\s*style='\s*'/gi, "")
}
