"use client"

import { useCallback, useEffect, useState } from "react"
import type { Editor } from "@tiptap/react"

import {
  LINE_HEIGHT_DEFAULT,
  LINE_HEIGHT_MAX,
  LINE_HEIGHT_MIN,
  LINE_HEIGHT_STEP,
} from "@/components/tiptap-extension/line-height-extension"
import {
  getBlockLineHeightDisplay,
  getTargetTextBlocks,
} from "@/components/tiptap-extension/text-block-typography-extension"
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

export function canSetLineHeight(editor: Editor | null): boolean {
  if (!editor?.isEditable) return false
  return getTargetTextBlocks(editor).length > 0
}

export function useLineHeight(editor?: Editor | null) {
  const { editor: activeEditor } = useTiptapEditor(editor)
  const [value, setValue] = useState(LINE_HEIGHT_DEFAULT)

  const sync = useCallback(() => {
    if (!activeEditor) return
    setValue(getBlockLineHeightDisplay(activeEditor))
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

  const setLineHeightValue = useCallback(
    (next: number) => {
      if (!activeEditor || !canSetLineHeight(activeEditor)) return false
      const success = activeEditor.chain().focus().setBlockLineHeight(next).run()
      if (success) setValue(getBlockLineHeightDisplay(activeEditor))
      return success
    },
    [activeEditor]
  )

  return {
    value,
    canSet: canSetLineHeight(activeEditor),
    setValue: setLineHeightValue,
    min: LINE_HEIGHT_MIN,
    max: LINE_HEIGHT_MAX,
    step: LINE_HEIGHT_STEP,
  }
}
