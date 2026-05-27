import { Mark, mergeAttributes } from "@tiptap/core"

export const LETTER_SPACING_MIN = -5
export const LETTER_SPACING_MAX = 20
export const LETTER_SPACING_DEFAULT = 0
export const LETTER_SPACING_STEP = 0.5

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    letterSpacing: {
      setLetterSpacing: (letterSpacing: string) => ReturnType
      unsetLetterSpacing: () => ReturnType
    }
  }
}

export function parseLetterSpacingPx(
  value: string | null | undefined
): number | null {
  if (!value) return null
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*px$/i)
  if (!match) return null
  const parsed = Number.parseFloat(match[1])
  return Number.isFinite(parsed) ? parsed : null
}

export function formatLetterSpacingPx(px: number): string {
  const rounded = Math.round(px * 2) / 2
  return `${rounded}px`
}

export const LetterSpacing = Mark.create({
  name: "letterSpacing",

  addAttributes() {
    return {
      letterSpacing: {
        default: null,
        parseHTML: (element) => element.style.letterSpacing || null,
        renderHTML: (attributes) => {
          if (!attributes.letterSpacing) return {}
          return { style: `letter-spacing: ${attributes.letterSpacing}` }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: "span[style*='letter-spacing']",
        getAttrs: (element) => {
          const letterSpacing = (element as HTMLElement).style?.letterSpacing
          return letterSpacing ? { letterSpacing } : false
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setLetterSpacing:
        (letterSpacing: string) =>
        ({ commands }) =>
          commands.setMark(this.name, { letterSpacing }),
      unsetLetterSpacing:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    }
  },
})
