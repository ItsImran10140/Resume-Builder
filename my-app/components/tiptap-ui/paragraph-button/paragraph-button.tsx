"use client"

import { forwardRef, useCallback } from "react"

import type { UseParagraphConfig } from "@/components/tiptap-ui/paragraph-button/use-paragraph"
import {
  PARAGRAPH_SHORTCUT_KEY,
  useParagraph,
} from "@/components/tiptap-ui/paragraph-button/use-paragraph"
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"
import { parseShortcutKeys } from "@/lib/tiptap-utils"
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Badge } from "@/components/tiptap-ui-primitive/badge"

export interface ParagraphButtonProps
  extends Omit<ButtonProps, "type">,
    UseParagraphConfig {
  text?: string
  showShortcut?: boolean
}

export function ParagraphShortcutBadge({
  shortcutKeys = PARAGRAPH_SHORTCUT_KEY,
}: {
  shortcutKeys?: string
}) {
  return <Badge>{parseShortcutKeys({ shortcutKeys })}</Badge>
}

export const ParagraphButton = forwardRef<HTMLButtonElement, ParagraphButtonProps>(
  (
    {
      editor: providedEditor,
      text,
      hideWhenUnavailable = false,
      onToggled,
      showShortcut = false,
      onClick,
      children,
      ...buttonProps
    },
    ref
  ) => {
    const { editor } = useTiptapEditor(providedEditor)
    const {
      isVisible,
      canSet,
      isActive,
      handleSetParagraph,
      label,
      Icon,
      shortcutKeys,
    } = useParagraph({
      editor,
      hideWhenUnavailable,
      onToggled,
    })

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        handleSetParagraph()
      },
      [handleSetParagraph, onClick]
    )

    if (!isVisible) {
      return null
    }

    return (
      <Button
        type="button"
        variant="ghost"
        data-active-state={isActive ? "on" : "off"}
        role="button"
        tabIndex={-1}
        disabled={!canSet}
        data-disabled={!canSet}
        aria-label={label}
        aria-pressed={isActive}
        tooltip={label}
        onClick={handleClick}
        {...buttonProps}
        ref={ref}
      >
        {children ?? (
          <>
            <Icon className="tiptap-button-icon" />
            {text && <span className="tiptap-button-text">{text}</span>}
            {showShortcut && (
              <ParagraphShortcutBadge shortcutKeys={shortcutKeys} />
            )}
          </>
        )}
      </Button>
    )
  }
)

ParagraphButton.displayName = "ParagraphButton"
