"use client"

import { useCallback, useEffect, useState } from "react"
import type { Editor } from "@tiptap/react"

import { useTiptapEditor } from "@/hooks/use-tiptap-editor"
import { ParagraphIcon } from "@/components/tiptap-icons/paragraph-icon"
import {
  isNodeInSchema,
  isNodeTypeSelected,
  selectionWithinConvertibleTypes,
} from "@/lib/tiptap-utils"

export const PARAGRAPH_SHORTCUT_KEY = "mod+alt+0"

export interface UseParagraphConfig {
  editor?: Editor | null
  hideWhenUnavailable?: boolean
  onToggled?: () => void
}

export function canSetParagraph(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (
    !isNodeInSchema("paragraph", editor) ||
    isNodeTypeSelected(editor, ["image"])
  ) {
    return false
  }

  if (
    !selectionWithinConvertibleTypes(editor, [
      "paragraph",
      "heading",
      "bulletList",
      "orderedList",
      "taskList",
      "blockquote",
      "codeBlock",
    ])
  ) {
    return false
  }

  return editor.can().setParagraph()
}

export function isParagraphActive(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  return editor.isActive("paragraph") && !editor.isActive("heading")
}

export function setParagraphFormat(editor: Editor | null): boolean {
  if (!editor || !canSetParagraph(editor)) return false
  return editor.chain().focus().setParagraph().run()
}

export function shouldShowParagraphButton(props: {
  editor: Editor | null
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, hideWhenUnavailable } = props
  if (!editor) return false
  if (!hideWhenUnavailable) return true
  if (!editor.isEditable) return false
  return canSetParagraph(editor)
}

export function useParagraph(config?: UseParagraphConfig) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
    onToggled,
  } = config || {}

  const { editor } = useTiptapEditor(providedEditor)
  const [isVisible, setIsVisible] = useState(true)
  const canSet = canSetParagraph(editor)
  const isActive = isParagraphActive(editor)

  useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      setIsVisible(
        shouldShowParagraphButton({ editor, hideWhenUnavailable })
      )
    }

    handleSelectionUpdate()
    editor.on("selectionUpdate", handleSelectionUpdate)
    return () => editor.off("selectionUpdate", handleSelectionUpdate)
  }, [editor, hideWhenUnavailable])

  const handleSetParagraph = useCallback(() => {
    if (!editor) return false
    const success = setParagraphFormat(editor)
    if (success) onToggled?.()
    return success
  }, [editor, onToggled])

  return {
    isVisible,
    isActive,
    canSet,
    handleSetParagraph,
    label: "Paragraph",
    shortcutKeys: PARAGRAPH_SHORTCUT_KEY,
    Icon: ParagraphIcon,
  }
}
