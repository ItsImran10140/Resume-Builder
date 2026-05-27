import { Extension } from "@tiptap/core"
import type { Editor, NodeWithPos } from "@tiptap/react"

import {
  formatLetterSpacingPx,
  LETTER_SPACING_DEFAULT,
  parseLetterSpacingPx,
} from "@/components/tiptap-extension/letter-spacing-extension"
import {
  formatLineHeight,
  LINE_HEIGHT_DEFAULT,
  parseLineHeight,
} from "@/components/tiptap-extension/line-height-extension"
import { clamp, updateNodesAttr } from "@/lib/tiptap-utils"

export const BLOCK_SPACING_MIN = 0
export const BLOCK_SPACING_MAX = 80
export const BLOCK_SPACING_DEFAULT = 0
export const BLOCK_SPACING_STEP = 2

const BLOCK_TYPES = ["paragraph", "heading"] as const

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textBlockTypography: {
      setBlockLetterSpacing: (spacingPx: number) => ReturnType
      setBlockLineHeight: (lineHeight: number) => ReturnType
      setBlockSpacing: (spacingPx: number) => ReturnType
      unsetBlockSpacing: () => ReturnType
    }
  }
}

export function parseBlockSpacingPx(
  value: string | null | undefined
): number | null {
  if (!value) return null
  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*px$/i)
  if (!match) return null
  const parsed = Number.parseFloat(match[1])
  return Number.isFinite(parsed) ? parsed : null
}

export function formatBlockSpacingPx(px: number): string {
  return `${Math.round(px)}px`
}

/** Paragraphs/headings touched by the selection, or the block under the cursor. */
export function getTargetTextBlocks(
  editor: Editor | { state: Editor["state"] }
): NodeWithPos[] {
  const { from, to, empty } = editor.state.selection
  const results: NodeWithPos[] = []
  const seen = new Set<number>()

  editor.state.doc.nodesBetween(from, to, (node, pos) => {
    if (!BLOCK_TYPES.includes(node.type.name as (typeof BLOCK_TYPES)[number])) {
      return
    }
    if (seen.has(pos)) return
    seen.add(pos)
    results.push({ node: node as NodeWithPos["node"], pos })
  })

  if (results.length > 0) {
    return results.sort((a, b) => a.pos - b.pos)
  }

  if (empty) {
    const $from = editor.state.selection.$from
    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth)
      if (BLOCK_TYPES.includes(node.type.name as (typeof BLOCK_TYPES)[number])) {
        return [{ node, pos: $from.before(depth) }]
      }
    }
  }

  return []
}

export function getBlockLetterSpacingDisplayPx(
  editor: Editor | { state: Editor["state"] }
): number {
  const blocks = getTargetTextBlocks(editor)
  if (!blocks.length) return LETTER_SPACING_DEFAULT
  const raw = blocks[0].node.attrs.letterSpacing as string | undefined
  return parseLetterSpacingPx(raw) ?? LETTER_SPACING_DEFAULT
}

export function getBlockLineHeightDisplay(
  editor: Editor | { state: Editor["state"] }
): number {
  const blocks = getTargetTextBlocks(editor)
  if (!blocks.length) return LINE_HEIGHT_DEFAULT
  const raw = blocks[0].node.attrs.lineHeight as string | undefined
  return parseLineHeight(raw) ?? LINE_HEIGHT_DEFAULT
}

export function getBlockSpacingDisplayPx(
  editor: Editor | { state: Editor["state"] }
): number | null {
  const blocks = getTargetTextBlocks(editor)
  if (!blocks.length) return null

  const source =
    blocks.length === 1 ? blocks[0] : blocks[blocks.length - 2]
  const raw = source.node.attrs.blockSpacing as string | undefined
  return parseBlockSpacingPx(raw) ?? 0
}

function getBlockSpacingTargets(blocks: NodeWithPos[]): NodeWithPos[] {
  if (blocks.length === 0) return []
  if (blocks.length === 1) return blocks
  return blocks.slice(0, -1)
}

export const TextBlockTypography = Extension.create({
  name: "textBlockTypography",

  addGlobalAttributes() {
    return [
      {
        types: [...BLOCK_TYPES],
        attributes: {
          letterSpacing: {
            default: null,
            parseHTML: (element) =>
              (element as HTMLElement).style?.letterSpacing || null,
            renderHTML: (attributes) => {
              if (!attributes.letterSpacing) return {}
              return { style: `letter-spacing: ${attributes.letterSpacing}` }
            },
          },
          lineHeight: {
            default: null,
            parseHTML: (element) =>
              (element as HTMLElement).style?.lineHeight || null,
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) return {}
              return { style: `line-height: ${attributes.lineHeight}` }
            },
          },
          blockSpacing: {
            default: null,
            parseHTML: (element) =>
              (element as HTMLElement).style?.marginBottom || null,
            renderHTML: (attributes) => {
              if (!attributes.blockSpacing) return {}
              return { style: `margin-bottom: ${attributes.blockSpacing}` }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setBlockLetterSpacing:
        (spacingPx: number) =>
        ({ state, dispatch, tr }) => {
          const blocks = getTargetTextBlocks({ state })
          if (!blocks.length) return false

          const rounded = Math.round(clamp(spacingPx, -5, 20) * 2) / 2
          const next =
            rounded === 0 ? undefined : formatLetterSpacingPx(rounded)

          const changed = updateNodesAttr(tr, blocks, "letterSpacing", next)
          if (!changed) return false
          dispatch?.(tr)
          return true
        },
      setBlockLineHeight:
        (lineHeight: number) =>
        ({ state, dispatch, tr }) => {
          const blocks = getTargetTextBlocks({ state })
          if (!blocks.length) return false

          const rounded =
            Math.round(clamp(lineHeight, 0.8, 3) * 100) / 100
          const next =
            rounded === LINE_HEIGHT_DEFAULT
              ? undefined
              : formatLineHeight(rounded)

          const changed = updateNodesAttr(tr, blocks, "lineHeight", next)
          if (!changed) return false
          dispatch?.(tr)
          return true
        },
      setBlockSpacing:
        (spacingPx: number) =>
        ({ state, dispatch, tr }) => {
          const blocks = getTargetTextBlocks({ state })
          if (!blocks.length) return false

          const clamped = clamp(
            Math.round(spacingPx),
            BLOCK_SPACING_MIN,
            BLOCK_SPACING_MAX
          )
          const spacing =
            clamped === 0 ? undefined : formatBlockSpacingPx(clamped)
          const targets = getBlockSpacingTargets(blocks)

          const changed = updateNodesAttr(tr, targets, "blockSpacing", spacing)
          if (!changed) return false
          dispatch?.(tr)
          return true
        },
      unsetBlockSpacing:
        () =>
        ({ state, dispatch, tr }) => {
          const blocks = getTargetTextBlocks({ state })
          if (!blocks.length) return false

          const targets = getBlockSpacingTargets(blocks)
          const changed = updateNodesAttr(
            tr,
            targets,
            "blockSpacing",
            undefined
          )
          if (!changed) return false
          dispatch?.(tr)
          return true
        },
    }
  },
})
