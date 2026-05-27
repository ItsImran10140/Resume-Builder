import { Mark, mergeAttributes } from "@tiptap/core"

export const LINE_HEIGHT_MIN = 0.8
export const LINE_HEIGHT_MAX = 3
export const LINE_HEIGHT_DEFAULT = 1.35
export const LINE_HEIGHT_STEP = 0.05

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    lineHeight: {
      setLineHeight: (lineHeight: string) => ReturnType
      unsetLineHeight: () => ReturnType
    }
  }
}

export function parseLineHeight(
  value: string | null | undefined
): number | null {
  if (!value) return null
  const trimmed = value.trim()
  const unitless = Number.parseFloat(trimmed)
  if (Number.isFinite(unitless) && !trimmed.endsWith("%") && !trimmed.endsWith("px")) {
    return unitless
  }
  const percent = trimmed.match(/^(\d+(?:\.\d+)?)\s*%$/)
  if (percent) return Number.parseFloat(percent[1]) / 100
  return null
}

export function formatLineHeight(value: number): string {
  const rounded = Math.round(value * 100) / 100
  return String(rounded)
}

export const LineHeight = Mark.create({
  name: "lineHeight",

  addAttributes() {
    return {
      lineHeight: {
        default: null,
        parseHTML: (element) => element.style.lineHeight || null,
        renderHTML: (attributes) => {
          if (!attributes.lineHeight) return {}
          return { style: `line-height: ${attributes.lineHeight}` }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: "span[style*='line-height']",
        getAttrs: (element) => {
          const lineHeight = (element as HTMLElement).style?.lineHeight
          return lineHeight ? { lineHeight } : false
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setLineHeight:
        (lineHeight: string) =>
        ({ commands }) =>
          commands.setMark(this.name, { lineHeight }),
      unsetLineHeight:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    }
  },
})
