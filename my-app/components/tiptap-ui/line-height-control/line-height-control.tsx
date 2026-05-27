"use client"

import { TypographyMetricControl } from "@/components/tiptap-ui/typography-metric-control/typography-metric-control"
import { useLineHeight } from "@/components/tiptap-ui/line-height-control/use-line-height"

type LineHeightControlProps = {
  variant?: "toolbar" | "bubble"
}

export function LineHeightControl({ variant = "toolbar" }: LineHeightControlProps) {
  const { value, canSet, setValue, min, max, step } = useLineHeight()

  return (
    <TypographyMetricControl
      variant={variant}
      label="Line height"
      ariaLabel="Line height"
      value={value}
      unit=""
      min={min}
      max={max}
      step={step}
      decimals={2}
      disabled={!canSet}
      onChange={setValue}
    />
  )
}
