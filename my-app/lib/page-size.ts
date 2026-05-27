export type PageSizeId = "a4" | "letter"

export type PageSize = {
  id: PageSizeId
  label: string
  width: string
  height: string
}

export const PAGE_SIZES: Record<PageSizeId, PageSize> = {
  a4: {
    id: "a4",
    label: "A4",
    width: "210mm",
    height: "297mm",
  },
  letter: {
    id: "letter",
    label: "US Letter",
    width: "8.5in",
    height: "11in",
  },
}

export const DEFAULT_PAGE_SIZE_ID: PageSizeId = "a4"

const RESUME_PAGE_SIZE_KEY = "resume-builder:page-size"

export function getPageSize(id: PageSizeId): PageSize {
  return PAGE_SIZES[id]
}

export function getResumePageSizeId(): PageSizeId {
  if (typeof window === "undefined") return DEFAULT_PAGE_SIZE_ID

  const raw = sessionStorage.getItem(RESUME_PAGE_SIZE_KEY)
  if (raw === "a4" || raw === "letter") return raw
  return DEFAULT_PAGE_SIZE_ID
}

export function saveResumePageSizeId(id: PageSizeId) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(RESUME_PAGE_SIZE_KEY, id)
}

export function pageSizeCssVars(pageSize: PageSize): {
  ["--page-width"]: string
  ["--page-height"]: string
} {
  return {
    "--page-width": pageSize.width,
    "--page-height": pageSize.height,
  }
}

/** Small buffer so minor spacing/rounding does not force an extra page. */
export const PAGE_OVERFLOW_TOLERANCE_PX = 20

export function calculatePageCount(
  contentHeightPx: number,
  pageHeightPx: number
): number {
  if (pageHeightPx <= 0) return 1
  if (contentHeightPx <= pageHeightPx + PAGE_OVERFLOW_TOLERANCE_PX) return 1
  return Math.ceil(
    (contentHeightPx - PAGE_OVERFLOW_TOLERANCE_PX) / pageHeightPx
  )
}

/** Measure a CSS length (mm, in, px, etc.) in pixels. */
export function measureCssLengthInPx(value: string): number {
  if (typeof document === "undefined") return 0

  const probe = document.createElement("div")
  probe.style.position = "absolute"
  probe.style.visibility = "hidden"
  probe.style.pointerEvents = "none"
  probe.style.height = value
  probe.style.width = value
  document.body.appendChild(probe)
  const px = probe.offsetHeight || probe.offsetWidth
  document.body.removeChild(probe)
  return px
}
