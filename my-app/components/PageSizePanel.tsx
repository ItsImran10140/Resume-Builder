"use client"

import {
  PAGE_SIZES,
  type PageSizeId,
} from "@/lib/page-size"

import "./PageSizePanel.scss"

type PageSizePanelProps = {
  value: PageSizeId
  pageCount: number
  onChange: (id: PageSizeId) => void
}

export function PageSizePanel({ value, pageCount, onChange }: PageSizePanelProps) {
  return (
    <section className="page-size-panel" aria-label="Page size">
      <div className="page-size-panel-row">
        <label className="page-size-panel-label" htmlFor="resume-page-size">
          Page size
        </label>
        <select
          id="resume-page-size"
          className="page-size-select"
          value={value}
          onChange={(event) => onChange(event.target.value as PageSizeId)}
        >
          {Object.values(PAGE_SIZES).map((size) => (
            <option key={size.id} value={size.id}>
              {size.label} ({size.width} × {size.height})
            </option>
          ))}
        </select>
        <span className="page-size-count" aria-live="polite">
          {pageCount} {pageCount === 1 ? "page" : "pages"}
        </span>
      </div>
    </section>
  )
}
