export type PagePadding = {
  top: number
  right: number
  bottom: number
  left: number
}

export type PagePaddingSide = keyof PagePadding

export const PAGE_PADDING_MIN = 0
export const PAGE_PADDING_MAX = 200
export const PAGE_PADDING_STEP = 4

/** Matches original 0.75in × 0.85in margins at 96 DPI */
export const DEFAULT_PAGE_PADDING: PagePadding = {
  top: 72,
  right: 82,
  bottom: 72,
  left: 82,
}

const RESUME_PADDING_KEY = "resume-builder:page-padding"

export function clampPadding(value: number): number {
  return Math.max(PAGE_PADDING_MIN, Math.min(PAGE_PADDING_MAX, Math.round(value)))
}

export function clampPagePadding(padding: PagePadding): PagePadding {
  return {
    top: clampPadding(padding.top),
    right: clampPadding(padding.right),
    bottom: clampPadding(padding.bottom),
    left: clampPadding(padding.left),
  }
}

export function getResumePagePadding(): PagePadding {
  if (typeof window === "undefined") return DEFAULT_PAGE_PADDING

  const raw = sessionStorage.getItem(RESUME_PADDING_KEY)
  if (!raw) return DEFAULT_PAGE_PADDING

  try {
    const parsed = JSON.parse(raw) as Partial<PagePadding>
    return clampPagePadding({
      top: parsed.top ?? DEFAULT_PAGE_PADDING.top,
      right: parsed.right ?? DEFAULT_PAGE_PADDING.right,
      bottom: parsed.bottom ?? DEFAULT_PAGE_PADDING.bottom,
      left: parsed.left ?? DEFAULT_PAGE_PADDING.left,
    })
  } catch {
    return DEFAULT_PAGE_PADDING
  }
}

export function saveResumePagePadding(padding: PagePadding) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(
    RESUME_PADDING_KEY,
    JSON.stringify(clampPagePadding(padding))
  )
}

export function pagePaddingToStyle(padding: PagePadding): {
  paddingTop: string
  paddingRight: string
  paddingBottom: string
  paddingLeft: string
  boxSizing: "border-box"
} {
  return {
    paddingTop: `${padding.top}px`,
    paddingRight: `${padding.right}px`,
    paddingBottom: `${padding.bottom}px`,
    paddingLeft: `${padding.left}px`,
    boxSizing: "border-box",
  }
}
