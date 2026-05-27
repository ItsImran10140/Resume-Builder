import { Mark, mergeAttributes } from "@tiptap/core"

export const FONT_SIZE_MIN = 8
export const FONT_SIZE_MAX = 200
export const FONT_SIZE_DEFAULT = 16
export const FONT_SIZE_STEP = 1

export type FontSizeOptions = {
  HTMLAttributes: Record<string, unknown>
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (fontSize: string) => ReturnType
      unsetFontSize: () => ReturnType
    }
  }
}

export function parseFontSizePx(value: string | null | undefined): number | null {
  if (!value) return null
  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*px$/i)
  if (!match) return null
  const parsed = Number.parseFloat(match[1])
  return Number.isFinite(parsed) ? parsed : null
}

export function formatFontSizePx(px: number): string {
  return `${Math.round(px)}px`
}

export const FontSize = Mark.create<FontSizeOptions>({
  name: "fontSize",

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize || null,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) return {}
          return { style: `font-size: ${attributes.fontSize}` }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: "span[style*='font-size']",
        getAttrs: (element) => {
          const fontSize = (element as HTMLElement).style?.fontSize
          return fontSize ? { fontSize } : false
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ]
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ commands }) =>
          commands.setMark(this.name, { fontSize }),
      unsetFontSize:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    }
  },
})
