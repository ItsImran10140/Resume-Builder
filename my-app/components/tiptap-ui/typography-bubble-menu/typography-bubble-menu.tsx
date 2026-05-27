"use client"

import type { Editor } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"

import { BlockSpacingControl } from "@/components/tiptap-ui/block-spacing-control"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import { ColorHighlightPopover } from "@/components/tiptap-ui/color-highlight-popover"
import { FontSizeControl } from "@/components/tiptap-ui/font-size-control"
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { LetterSpacingControl } from "@/components/tiptap-ui/letter-spacing-control"
import { LinkPopover } from "@/components/tiptap-ui/link-popover"
import { LineHeightControl } from "@/components/tiptap-ui/line-height-control"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"

import "@/components/tiptap-ui/typography-bubble-menu/typography-bubble-menu.scss"

type TypographyBubbleMenuProps = {
  editor: Editor | null
}

function shouldShowTypographyMenu({
  editor,
  state,
}: {
  editor: Editor
  state: Editor["state"]
}): boolean {
  if (!editor.isEditable) return false
  if (editor.isActive("codeBlock")) return false

  const { from, to, empty } = state.selection
  if (empty || from === to) return false

  const selectedText = state.doc.textBetween(from, to, " ")
  return selectedText.trim().length > 0
}

export function TypographyBubbleMenu({ editor }: TypographyBubbleMenuProps) {
  if (!editor) return null

  const bubbleVariant = { variant: "bubble" as const }

  return (
    <BubbleMenu
      editor={editor}
      className="typography-bubble-menu"
      options={{
        placement: "bottom-start",
        offset: 10,
        flip: {
          padding: {
            top: 52,
            bottom: 8,
            left: 8,
            right: 8,
          },
        },
        shift: { padding: 8 },
      }}
      shouldShow={shouldShowTypographyMenu}
    >
      <div
        className="typography-bubble-menu-panel"
        role="toolbar"
        aria-label="Typography"
        onMouseDown={(event) => event.preventDefault()}
      >
        <div className="typography-bubble-menu-header">
          <span className="typography-bubble-menu-title">Typography</span>
        </div>

        <div className="typography-bubble-menu-tools" role="toolbar" aria-label="Text tools">
          <div className="typography-bubble-menu-tools-row">
            <UndoRedoButton action="undo" />
            <UndoRedoButton action="redo" />
            <HeadingDropdownMenu modal={false} levels={[1, 2, 3, 4]} />
            <ListDropdownMenu
              modal={false}
              types={["bulletList", "orderedList", "taskList"]}
            />
            <BlockquoteButton />
            <CodeBlockButton />
          </div>

          <div className="typography-bubble-menu-tools-row">
            <MarkButton type="bold" />
            <MarkButton type="italic" />
            <MarkButton type="strike" />
            <MarkButton type="underline" />
            <MarkButton type="code" />
            <MarkButton type="superscript" />
            <MarkButton type="subscript" />
            <ColorHighlightPopover />
            <LinkPopover />
          </div>

          <div className="typography-bubble-menu-tools-row">
            <TextAlignButton align="left" />
            <TextAlignButton align="center" />
            <TextAlignButton align="right" />
            <TextAlignButton align="justify" />
          </div>
        </div>

        <div className="typography-bubble-menu-body">
          <FontSizeControl {...bubbleVariant} />
          <LetterSpacingControl {...bubbleVariant} />
          <LineHeightControl {...bubbleVariant} />
          <BlockSpacingControl {...bubbleVariant} />
        </div>
      </div>
    </BubbleMenu>
  )
}
