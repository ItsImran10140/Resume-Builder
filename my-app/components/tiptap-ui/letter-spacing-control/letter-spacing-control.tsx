"use client"

import { TypographyMetricControl } from "@/components/tiptap-ui/typography-metric-control/typography-metric-control"
import { useLetterSpacing } from "@/components/tiptap-ui/letter-spacing-control/use-letter-spacing"

type LetterSpacingControlProps = {
  variant?: "toolbar" | "bubble"
}

export function LetterSpacingControl({
  variant = "toolbar",
}: LetterSpacingControlProps) {
  const { valuePx, canSet, setValue, min, max, step } = useLetterSpacing()

  return (
    <TypographyMetricControl
      variant={variant}
      label="Spacing"
      ariaLabel="Letter spacing"
      value={valuePx}
      unit="px"
      min={min}
      max={max}
      step={step}
      decimals={1}
      disabled={!canSet}
      onChange={setValue}
    />
  )
}
