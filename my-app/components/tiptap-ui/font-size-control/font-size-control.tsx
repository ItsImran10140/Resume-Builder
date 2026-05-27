"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { MinusIcon } from "@/components/tiptap-icons/minus-icon"
import { PlusIcon } from "@/components/tiptap-icons/plus-icon"
import { Button } from "@/components/tiptap-ui-primitive/button"
import type { UseFontSizeConfig } from "@/components/tiptap-ui/font-size-control/use-font-size"
import { useFontSize } from "@/components/tiptap-ui/font-size-control/use-font-size"

import "@/components/tiptap-ui/font-size-control/font-size-control.scss"

export type FontSizeControlProps = UseFontSizeConfig

export function FontSizeControl(props: FontSizeControlProps) {
  const {
    fontSizePx,
    isVisible,
    canSet,
    increase,
    decrease,
    setSize,
    min,
    max,
  } = useFontSize(props)
  const variant = props.variant ?? "toolbar"
  const isBubble = variant === "bubble"
  const showTooltip = !isBubble

  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(String(fontSizePx))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isEditing) {
      setDraft(String(fontSizePx))
    }
  }, [fontSizePx, isEditing])

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const commitDraft = useCallback(() => {
    const parsed = Number.parseInt(draft, 10)
    if (!Number.isFinite(parsed)) {
      setDraft(String(fontSizePx))
      setIsEditing(false)
      return
    }
    setSize(parsed)
    setIsEditing(false)
  }, [draft, fontSizePx, setSize])

  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault()
        commitDraft()
      } else if (event.key === "Escape") {
        event.preventDefault()
        setDraft(String(fontSizePx))
        setIsEditing(false)
      }
    },
    [commitDraft, fontSizePx]
  )

  if (!isVisible) return null

  return (
    <div
      className={`tiptap-font-size-control tiptap-typography-metric${isBubble ? " tiptap-typography-metric--bubble" : ""}`}
      role="group"
      aria-label="Font size"
    >
      <span className="tiptap-typography-metric-label">Size</span>
      <div className="tiptap-typography-metric-controls">
        <Button
          type="button"
          variant="ghost"
          size="small"
          showTooltip={showTooltip}
          disabled={!canSet || fontSizePx <= min}
          tooltip="Decrease font size"
          aria-label="Decrease font size"
          onClick={decrease}
        >
          <MinusIcon className="tiptap-button-icon" />
        </Button>

        <div className="tiptap-font-size-control-value tiptap-typography-metric-value">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            className="tiptap-font-size-control-input"
            value={draft}
            aria-label="Font size in pixels"
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitDraft}
            onKeyDown={handleInputKeyDown}
          />
        ) : (
          <button
            type="button"
            className="tiptap-font-size-control-display"
            disabled={!canSet}
            aria-label={`Font size ${fontSizePx} pixels. Click to edit.`}
            onClick={() => setIsEditing(true)}
          >
            <span className="tiptap-font-size-control-number">{fontSizePx}</span>
            <span className="tiptap-font-size-control-unit">px</span>
          </button>
        )}
      </div>

        <Button
          type="button"
          variant="ghost"
          size="small"
          showTooltip={showTooltip}
          disabled={!canSet || fontSizePx >= max}
          tooltip="Increase font size"
          aria-label="Increase font size"
          onClick={increase}
        >
          <PlusIcon className="tiptap-button-icon" />
        </Button>
      </div>
    </div>
  )
}
