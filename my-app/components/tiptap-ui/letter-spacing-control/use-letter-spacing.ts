"use client"

import { useCallback, useEffect, useState } from "react"
import type { Editor } from "@tiptap/react"

import {
  LETTER_SPACING_DEFAULT,
  LETTER_SPACING_MAX,
  LETTER_SPACING_MIN,
  LETTER_SPACING_STEP,
} from "@/components/tiptap-extension/letter-spacing-extension"
import {
  getBlockLetterSpacingDisplayPx,
  getTargetTextBlocks,
} from "@/components/tiptap-extension/text-block-typography-extension"
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

export function canSetLetterSpacing(editor: Editor | null): boolean {
  if (!editor?.isEditable) return false
  return getTargetTextBlocks(editor).length > 0
}

export function useLetterSpacing(editor?: Editor | null) {
  const { editor: activeEditor } = useTiptapEditor(editor)
  const [valuePx, setValuePx] = useState(LETTER_SPACING_DEFAULT)

  const sync = useCallback(() => {
    if (!activeEditor) return
    setValuePx(getBlockLetterSpacingDisplayPx(activeEditor))
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
      if (!activeEditor || !canSetLetterSpacing(activeEditor)) return false
      const success = activeEditor
        .chain()
        .focus()
        .setBlockLetterSpacing(next)
        .run()
      if (success) setValuePx(getBlockLetterSpacingDisplayPx(activeEditor))
      return success
    },
    [activeEditor]
  )

  return {
    valuePx,
    canSet: canSetLetterSpacing(activeEditor),
    setValue,
    min: LETTER_SPACING_MIN,
    max: LETTER_SPACING_MAX,
    step: LETTER_SPACING_STEP,
  }
}
