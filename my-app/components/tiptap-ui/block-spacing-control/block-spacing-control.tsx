"use client"

import { TypographyMetricControl } from "@/components/tiptap-ui/typography-metric-control/typography-metric-control"
import { useBlockSpacing } from "@/components/tiptap-ui/block-spacing-control/use-block-spacing"

type BlockSpacingControlProps = {
  variant?: "toolbar" | "bubble"
}

export function BlockSpacingControl({
  variant = "toolbar",
}: BlockSpacingControlProps) {
  const { valuePx, canSet, setValue, min, max, step } = useBlockSpacing()

  return (
    <div
      className={!canSet ? "tiptap-block-spacing--disabled" : undefined}
      title={
        canSet
          ? "Space after the selected paragraph or heading"
          : "Click inside or select a paragraph or heading"
      }
    >
      <TypographyMetricControl
        variant={variant}
        label="Gap"
        ariaLabel="Spacing between paragraphs"
        value={valuePx}
        unit="px"
        min={min}
        max={max}
        step={step}
        disabled={!canSet}
        onChange={setValue}
      />
    </div>
  )
}
