"use client"

import { useCallback, useEffect, useState } from "react"
import type { Editor } from "@tiptap/react"

import {
  BLOCK_SPACING_DEFAULT,
  BLOCK_SPACING_MAX,
  BLOCK_SPACING_MIN,
  BLOCK_SPACING_STEP,
  getBlockSpacingDisplayPx,
  getTargetTextBlocks,
} from "@/components/tiptap-extension/text-block-typography-extension"
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

export function canSetBlockSpacing(editor: Editor | null): boolean {
  if (!editor?.isEditable) return false
  return getTargetTextBlocks(editor).length > 0
}

export function useBlockSpacing(editor?: Editor | null) {
  const { editor: activeEditor } = useTiptapEditor(editor)
  const [valuePx, setValuePx] = useState(BLOCK_SPACING_DEFAULT)
  const [canSet, setCanSet] = useState(false)

  const sync = useCallback(() => {
    if (!activeEditor) {
      setCanSet(false)
      return
    }
    const enabled = canSetBlockSpacing(activeEditor)
    setCanSet(enabled)
    if (enabled) {
      setValuePx(
        getBlockSpacingDisplayPx(activeEditor) ?? BLOCK_SPACING_DEFAULT
      )
    }
  }, [activeEditor])

  useEffect(() => {
    if (!activeEditor) return
    sync()
    activeEditor.on("selectionUpdate", sync)
    activeEditor.on("transaction", sync)
    return () => {
      activeEditor.off("selectionUpdate", sync)
      activeEditor.off("transaction", sync)
    }
  }, [activeEditor, sync])

  const setValue = useCallback(
    (next: number) => {
      if (!activeEditor || !canSetBlockSpacing(activeEditor)) return false
      const success = activeEditor.chain().focus().setBlockSpacing(next).run()
      if (success) {
        setValuePx(
          getBlockSpacingDisplayPx(activeEditor) ?? Math.round(next)
        )
      }
      return success
    },
    [activeEditor]
  )

  return {
    valuePx,
    canSet,
    setValue,
    min: BLOCK_SPACING_MIN,
    max: BLOCK_SPACING_MAX,
    step: BLOCK_SPACING_STEP,
  }
}
