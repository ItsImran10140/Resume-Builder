"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import {
  PAGE_PADDING_MAX,
  PAGE_PADDING_MIN,
  PAGE_PADDING_STEP,
  type PagePadding,
  type PagePaddingSide,
  clampPadding,
} from "@/lib/page-padding"

import "./PagePaddingPanel.scss"

const PADDING_SIDES: PagePaddingSide[] = ["top", "right", "bottom", "left"]

const SIDE_HINTS: Record<PagePaddingSide, string> = {
  top: "T",
  right: "R",
  bottom: "B",
  left: "L",
}

const SIDE_ARIA: Record<PagePaddingSide, string> = {
  top: "Top padding",
  right: "Right padding",
  bottom: "Bottom padding",
  left: "Left padding",
}

function PaddingIcon() {
  return (
    <svg
      className="page-padding-icon"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="2.5"
        y="2.5"
        width="9"
        height="9"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <circle cx="7" cy="3.25" r="0.75" fill="currentColor" />
      <circle cx="10.75" cy="7" r="0.75" fill="currentColor" />
      <circle cx="7" cy="10.75" r="0.75" fill="currentColor" />
      <circle cx="3.25" cy="7" r="0.75" fill="currentColor" />
    </svg>
  )
}

type PaddingFieldProps = {
  side: PagePaddingSide
  value: number
  isFirst: boolean
  isLast: boolean
  isFocused: boolean
  onFocus: () => void
  onBlur: () => void
  onChange: (value: number) => void
}

function PaddingField({
  side,
  value,
  isFirst,
  isLast,
  isFocused,
  onFocus,
  onBlur,
  onChange,
}: PaddingFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isEditing) setDraft(String(value))
  }, [value, isEditing])

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const commitDraft = useCallback(() => {
    const parsed = Number.parseInt(draft, 10)
    if (!Number.isFinite(parsed)) {
      setDraft(String(value))
      setIsEditing(false)
      onBlur()
      return
    }
    onChange(clampPadding(parsed))
    setIsEditing(false)
    onBlur()
  }, [draft, onBlur, onChange, value])

  const nudge = useCallback(
    (delta: number) => {
      onChange(clampPadding(value + delta))
    },
    [onChange, value]
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault()
        commitDraft()
      } else if (event.key === "Escape") {
        event.preventDefault()
        setDraft(String(value))
        setIsEditing(false)
        onBlur()
      } else if (event.key === "ArrowUp") {
        event.preventDefault()
        nudge(PAGE_PADDING_STEP)
      } else if (event.key === "ArrowDown") {
        event.preventDefault()
        nudge(-PAGE_PADDING_STEP)
      }
    },
    [commitDraft, nudge, onBlur, value]
  )

  const cellClass = [
    "page-padding-cell",
    isFirst && "page-padding-cell--first",
    isLast && "page-padding-cell--last",
    isFocused && "page-padding-cell--focused",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div className="page-padding-field">
      <div className={cellClass}>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            className="page-padding-cell-input"
            value={draft}
            aria-label={`${SIDE_ARIA[side]} in pixels`}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitDraft}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
          />
        ) : (
          <button
            type="button"
            className="page-padding-cell-button"
            aria-label={`${SIDE_ARIA[side]}: ${value}px. Click to edit.`}
            onClick={() => {
              onFocus()
              setIsEditing(true)
            }}
          >
            {value}
          </button>
        )}
      </div>
      <span className="page-padding-field-hint">{SIDE_HINTS[side]}</span>
    </div>
  )
}

type PagePaddingPanelProps = {
  value: PagePadding
  onChange: (padding: PagePadding) => void
}

export function PagePaddingPanel({ value, onChange }: PagePaddingPanelProps) {
  const [focusedSide, setFocusedSide] = useState<PagePaddingSide | null>(null)

  const updateSide = useCallback(
    (side: PagePaddingSide, next: number) => {
      onChange({ ...value, [side]: next })
    },
    [onChange, value]
  )

  return (
    <section className="page-padding-panel" aria-label="Page padding">
      <div className="page-padding-panel-row">
        <div className="page-padding-panel-label">
          <PaddingIcon />
          <span>Padding</span>
        </div>

        <div className="page-padding-inputs" role="group" aria-label="Padding values">
          {PADDING_SIDES.map((side, index) => (
            <PaddingField
              key={side}
              side={side}
              value={value[side]}
              isFirst={index === 0}
              isLast={index === PADDING_SIDES.length - 1}
              isFocused={focusedSide === side}
              onFocus={() => setFocusedSide(side)}
              onBlur={() => setFocusedSide(null)}
              onChange={(next) => updateSide(side, next)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
