"use client"

import { useCallback, useEffect, useState } from "react"
import type { Editor } from "@tiptap/react"

import { useTiptapEditor } from "@/hooks/use-tiptap-editor"
import {
  FONT_SIZE_DEFAULT,
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  FONT_SIZE_STEP,
  formatFontSizePx,
  parseFontSizePx,
} from "@/components/tiptap-extension/font-size-extension"
import { clamp, isMarkInSchema } from "@/lib/tiptap-utils"

export interface UseFontSizeConfig {
  editor?: Editor | null
  hideWhenUnavailable?: boolean
  variant?: "toolbar" | "bubble"
  onChanged?: (sizePx: number) => void
}

function getSelectionFontSizePx(editor: Editor): number | null {
  const { fontSize } = editor.getAttributes("fontSize")
  return parseFontSizePx(fontSize)
}

function getDisplayFontSizePx(editor: Editor): number {
  const fromMark = getSelectionFontSizePx(editor)
  if (fromMark !== null) return fromMark

  if (editor.isActive("heading", { level: 1 })) return 32
  if (editor.isActive("heading", { level: 2 })) return 24
  if (editor.isActive("heading", { level: 3 })) return 20
  if (editor.isActive("heading", { level: 4 })) return 18

  return FONT_SIZE_DEFAULT
}

export function canSetFontSize(editor: Editor | null): boolean {
  if (!editor?.isEditable) return false
  return isMarkInSchema("fontSize", editor)
}

export function applyFontSizePx(editor: Editor, sizePx: number): boolean {
  const clamped = clamp(Math.round(sizePx), FONT_SIZE_MIN, FONT_SIZE_MAX)
  return editor.chain().focus().setFontSize(formatFontSizePx(clamped)).run()
}

export function useFontSize(config: UseFontSizeConfig = {}) {
  const { editor: providedEditor, hideWhenUnavailable = false, onChanged } =
    config
  const { editor } = useTiptapEditor(providedEditor)
  const [fontSizePx, setFontSizePx] = useState(FONT_SIZE_DEFAULT)
  const [isVisible, setIsVisible] = useState(true)

  const syncFromEditor = useCallback(() => {
    if (!editor) return
    setFontSizePx(getDisplayFontSizePx(editor))
  }, [editor])

  useEffect(() => {
    if (!editor) return

    const handleUpdate = () => {
      syncFromEditor()
      setIsVisible(
        hideWhenUnavailable
          ? canSetFontSize(editor) && !editor.state.selection.empty
          : canSetFontSize(editor)
      )
    }

    handleUpdate()
    editor.on("selectionUpdate", handleUpdate)
    editor.on("transaction", handleUpdate)

    return () => {
      editor.off("selectionUpdate", handleUpdate)
      editor.off("transaction", handleUpdate)
    }
  }, [editor, hideWhenUnavailable, syncFromEditor])

  const applySize = useCallback(
    (nextPx: number) => {
      if (!editor || !canSetFontSize(editor)) return false
      const success = applyFontSizePx(editor, nextPx)
      if (success) {
        const clamped = clamp(
          Math.round(nextPx),
          FONT_SIZE_MIN,
          FONT_SIZE_MAX
        )
        setFontSizePx(clamped)
        onChanged?.(clamped)
      }
      return success
    },
    [editor, onChanged]
  )

  const increase = useCallback(() => {
    applySize(fontSizePx + FONT_SIZE_STEP)
  }, [applySize, fontSizePx])

  const decrease = useCallback(() => {
    applySize(fontSizePx - FONT_SIZE_STEP)
  }, [applySize, fontSizePx])

  const setSize = useCallback(
    (sizePx: number) => applySize(sizePx),
    [applySize]
  )

  return {
    editor,
    fontSizePx,
    isVisible,
    canSet: canSetFontSize(editor),
    increase,
    decrease,
    setSize,
    min: FONT_SIZE_MIN,
    max: FONT_SIZE_MAX,
  }
}
