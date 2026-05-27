"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PagePadding } from "@/lib/page-padding";
import { pagePaddingToStyle } from "@/lib/page-padding";
import type { PageSize } from "@/lib/page-size";
import {
  calculatePageCount,
  measureCssLengthInPx,
  pageSizeCssVars,
} from "@/lib/page-size";
import "./ResumePreview.scss";

type ResumePreviewProps = {
  html: string;
  padding: PagePadding;
  pageSize: PageSize;
  onPageCountChange?: (count: number) => void;
};

export function ResumePreview({
  html,
  padding,
  pageSize,
  onPageCountChange,
}: ResumePreviewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const [pageHeightPx, setPageHeightPx] = useState(0);

  const updatePageCount = useCallback(() => {
    const doc = measureRef.current;
    if (!doc) return;

    const heightPx = measureCssLengthInPx(pageSize.height);
    if (heightPx <= 0) return;

    setPageHeightPx(heightPx);
    const next = calculatePageCount(doc.offsetHeight, heightPx);
    setPageCount(next);
    onPageCountChange?.(next);
  }, [onPageCountChange, pageSize.height]);

  useEffect(() => {
    const scroll = scrollRef.current;
    const doc = measureRef.current;
    if (!scroll || !doc) return;

    updatePageCount();

    const observer = new ResizeObserver(() => updatePageCount());
    observer.observe(scroll);
    observer.observe(doc);
    return () => observer.disconnect();
  }, [html, padding, pageSize, updatePageCount]);

  const pageIndexes = Array.from({ length: pageCount }, (_, i) => i);
  const documentStyle = {
    ...pagePaddingToStyle(padding),
    width: "100%",
  };

  return (
    <div className="resume-preview">
      <div ref={scrollRef} className="resume-preview-scroll">
        <div
          className="resume-preview-pages"
          style={pageSizeCssVars(pageSize)}
        >
          <div className="resume-preview-measure" aria-hidden>
            <article
              ref={measureRef}
              className="resume-preview-document"
              style={documentStyle}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>

          {pageIndexes.map((pageIndex) => (
            <section
              key={pageIndex}
              className="resume-preview-page"
              style={
                pageHeightPx > 0 ? { height: pageHeightPx } : undefined
              }
              aria-label={`Page ${pageIndex + 1}`}
            >
              <div className="resume-preview-page-clip">
                <article
                  className="resume-preview-document"
                  style={{
                    ...documentStyle,
                    marginTop:
                      pageHeightPx > 0
                        ? -pageIndex * pageHeightPx
                        : undefined,
                  }}
                  {...(pageIndex > 0 ? { "aria-hidden": true } : {})}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
