"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { MinusIcon } from "@/components/tiptap-icons/minus-icon"
import { PlusIcon } from "@/components/tiptap-icons/plus-icon"
import { Button } from "@/components/tiptap-ui-primitive/button"

import "@/components/tiptap-ui/typography-metric-control/typography-metric-control.scss"

export type TypographyMetricControlProps = {
  label: string
  ariaLabel: string
  value: number
  unit: string
  min: number
  max: number
  step: number
  decimals?: number
  disabled?: boolean
  isVisible?: boolean
  variant?: "toolbar" | "bubble"
  onChange: (value: number) => void
}

export function TypographyMetricControl({
  label,
  ariaLabel,
  value,
  unit,
  min,
  max,
  step,
  decimals = 0,
  disabled = false,
  isVisible = true,
  variant = "toolbar",
  onChange,
}: TypographyMetricControlProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(formatDisplay(value, decimals))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isEditing) setDraft(formatDisplay(value, decimals))
  }, [value, decimals, isEditing])

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const commitDraft = useCallback(() => {
    const parsed = Number.parseFloat(draft)
    if (!Number.isFinite(parsed)) {
      setDraft(formatDisplay(value, decimals))
      setIsEditing(false)
      return
    }
    onChange(parsed)
    setIsEditing(false)
  }, [draft, decimals, onChange, value])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault()
        commitDraft()
      } else if (event.key === "Escape") {
        event.preventDefault()
        setDraft(formatDisplay(value, decimals))
        setIsEditing(false)
      }
    },
    [commitDraft, decimals, value]
  )

  if (!isVisible) return null

  const atMin = value <= min
  const atMax = value >= max

  const isBubble = variant === "bubble"
  const showTooltip = !isBubble

  return (
    <div
      className={`tiptap-typography-metric${isBubble ? " tiptap-typography-metric--bubble" : ""}`}
      role="group"
      aria-label={ariaLabel}
    >
      <span className="tiptap-typography-metric-label">{label}</span>
      <div className="tiptap-typography-metric-controls">
        <Button
          type="button"
          variant="ghost"
          size="small"
          showTooltip={showTooltip}
          disabled={disabled || atMin}
          tooltip={`Decrease ${ariaLabel.toLowerCase()}`}
          aria-label={`Decrease ${ariaLabel.toLowerCase()}`}
          onClick={() => onChange(roundMetric(value - step, decimals, min, max))}
        >
          <MinusIcon className="tiptap-button-icon" />
        </Button>

      <div className="tiptap-typography-metric-value">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            className="tiptap-typography-metric-input"
            value={draft}
            aria-label={ariaLabel}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitDraft}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <button
            type="button"
            className="tiptap-typography-metric-display"
            disabled={disabled}
            aria-label={`${ariaLabel}: ${formatDisplay(value, decimals)}${unit}. Click to edit.`}
            onClick={() => setIsEditing(true)}
          >
            <span className="tiptap-typography-metric-number">
              {formatDisplay(value, decimals)}
            </span>
            <span className="tiptap-typography-metric-unit">{unit}</span>
          </button>
        )}
      </div>

        <Button
          type="button"
          variant="ghost"
          size="small"
          showTooltip={showTooltip}
          disabled={disabled || atMax}
          tooltip={`Increase ${ariaLabel.toLowerCase()}`}
          aria-label={`Increase ${ariaLabel.toLowerCase()}`}
          onClick={() => onChange(roundMetric(value + step, decimals, min, max))}
        >
          <PlusIcon className="tiptap-button-icon" />
        </Button>
      </div>
    </div>
  )
}

function formatDisplay(value: number, decimals: number): string {
  return decimals > 0 ? value.toFixed(decimals) : String(Math.round(value))
}

function roundMetric(
  value: number,
  decimals: number,
  min: number,
  max: number
): number {
  const factor = 10 ** decimals
  const rounded = Math.round(value * factor) / factor
  return Math.max(min, Math.min(max, rounded))
}
