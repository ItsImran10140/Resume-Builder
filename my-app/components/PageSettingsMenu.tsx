"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  clampPadding,
  PAGE_PADDING_STEP,
  type PagePadding,
  type PagePaddingSide,
} from "@/lib/page-padding";
import { PAGE_SIZES, type PageSizeId } from "@/lib/page-size";
import "./PageSettingsMenu.scss";

type PageSettingsMenuProps = {
  pageSizeId: PageSizeId;
  pageCount: number;
  padding: PagePadding;
  onPageSizeChange: (id: PageSizeId) => void;
  onPaddingChange: (padding: PagePadding) => void;
};

const PADDING_SIDES: PagePaddingSide[] = ["top", "right", "bottom", "left"];

const SIDE_LABELS: Record<PagePaddingSide, string> = {
  top: "T",
  right: "R",
  bottom: "B",
  left: "L",
};

function ChevronRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M4.5 2.5L8 6L4.5 9.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LinkSidesIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      className={active ? "page-settings-link-icon--active" : undefined}
    >
      <rect
        x="2.5"
        y="2.5"
        width="9"
        height="9"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeDasharray={active ? undefined : "2 1.5"}
      />
      <circle cx="7" cy="3.25" r="0.75" fill="currentColor" />
      <circle cx="10.75" cy="7" r="0.75" fill="currentColor" />
      <circle cx="7" cy="10.75" r="0.75" fill="currentColor" />
      <circle cx="3.25" cy="7" r="0.75" fill="currentColor" />
    </svg>
  );
}

function PaddingStepper({
  value,
  onChange,
  ariaLabel,
}: {
  value: number;
  onChange: (next: number) => void;
  ariaLabel: string;
}) {
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = useCallback(() => {
    const parsed = Number.parseInt(draft, 10);
    if (!Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    onChange(clampPadding(parsed));
  }, [draft, onChange, value]);

  const nudge = (delta: number) => {
    onChange(clampPadding(value + delta));
  };

  return (
    <div className="page-settings-stepper">
      <button
        type="button"
        className="page-settings-stepper-btn"
        aria-label={`Decrease ${ariaLabel}`}
        onClick={() => nudge(-PAGE_PADDING_STEP)}
      >
        −
      </button>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        className="page-settings-stepper-input"
        value={draft}
        aria-label={ariaLabel}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
            inputRef.current?.blur();
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            nudge(PAGE_PADDING_STEP);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            nudge(-PAGE_PADDING_STEP);
          }
        }}
      />
      <button
        type="button"
        className="page-settings-stepper-btn"
        aria-label={`Increase ${ariaLabel}`}
        onClick={() => nudge(PAGE_PADDING_STEP)}
      >
        +
      </button>
    </div>
  );
}

function PaddingEditorCard({
  value,
  onChange,
}: {
  value: PagePadding;
  onChange: (padding: PagePadding) => void;
}) {
  const [isLinked, setIsLinked] = useState(
    () =>
      value.top === value.right &&
      value.right === value.bottom &&
      value.bottom === value.left,
  );

  const unifiedValue = value.top;

  const setUnified = useCallback(
    (next: number) => {
      const clamped = clampPadding(next);
      onChange({
        top: clamped,
        right: clamped,
        bottom: clamped,
        left: clamped,
      });
    },
    [onChange],
  );

  const setSide = useCallback(
    (side: PagePaddingSide, next: number) => {
      onChange({ ...value, [side]: clampPadding(next) });
    },
    [onChange, value],
  );

  const toggleLinked = () => {
    const nextLinked = !isLinked;
    setIsLinked(nextLinked);
    if (nextLinked) {
      const base = value.top;
      onChange({
        top: base,
        right: base,
        bottom: base,
        left: base,
      });
    }
  };

  return (
    <div
      className="page-settings-padding-card"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="page-settings-padding-card-top">
        {isLinked && (
          <div className="page-settings-padding-unified page-settings-padding-unified--active">
            <PaddingStepper
              value={unifiedValue}
              onChange={setUnified}
              ariaLabel="Padding all sides"
            />
          </div>
        )}
        <button
          type="button"
          className={`page-settings-padding-toggle ${!isLinked ? "page-settings-padding-toggle--active" : ""}`}
          aria-pressed={!isLinked}
          aria-label={
            isLinked
              ? "Edit padding per side"
              : "Link padding on all sides"
          }
          title={isLinked ? "Per-side padding" : "All sides"}
          onClick={toggleLinked}
        >
          <LinkSidesIcon active={!isLinked} />
        </button>
      </div>

      {!isLinked && (
        <>
          <div className="page-settings-padding-divider" />
          <div
            className="page-settings-padding-grid"
            role="group"
            aria-label="Per-side padding"
          >
            {PADDING_SIDES.map((side) => (
              <div key={side} className="page-settings-padding-grid-cell">
                <span className="page-settings-padding-grid-label">
                  {SIDE_LABELS[side]}
                </span>
                <PaddingStepper
                  value={value[side]}
                  onChange={(next) => setSide(side, next)}
                  ariaLabel={`${side} padding`}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function paddingSummary(padding: PagePadding): string {
  const { top, right, bottom, left } = padding;
  if (top === right && right === bottom && bottom === left) {
    return `${top}px`;
  }
  return "Mixed";
}

export function PageSettingsMenu({
  pageSizeId,
  pageCount,
  padding,
  onPageSizeChange,
  onPaddingChange,
}: PageSettingsMenuProps) {
  const currentSize = PAGE_SIZES[pageSizeId];

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="page-settings-trigger"
          aria-label="Page size and padding settings"
        >
          <span className="page-settings-trigger-label">Page</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
            <path
              d="M2.5 4L5 6.5L7.5 4"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="page-settings-menu"
          sideOffset={6}
          align="end"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className="page-settings-menu-item">
              <span>Page size</span>
              <span className="page-settings-menu-item-meta">
                {currentSize.label}
              </span>
              <ChevronRightIcon />
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.SubContent
                className="page-settings-submenu"
                sideOffset={4}
                alignOffset={-4}
              >
                {Object.values(PAGE_SIZES).map((size) => (
                  <DropdownMenu.Item
                    key={size.id}
                    className="page-settings-submenu-item"
                    onSelect={() => onPageSizeChange(size.id)}
                  >
                    <span>{size.label}</span>
                    <span className="page-settings-submenu-dim">
                      {size.width} × {size.height}
                    </span>
                    {pageSizeId === size.id && (
                      <span className="page-settings-check" aria-hidden>
                        ✓
                      </span>
                    )}
                  </DropdownMenu.Item>
                ))}
                <div className="page-settings-submenu-footer">
                  {pageCount} {pageCount === 1 ? "page" : "pages"}
                </div>
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>

          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className="page-settings-menu-item">
              <span>Padding</span>
              <span className="page-settings-menu-item-meta">
                {paddingSummary(padding)}
              </span>
              <ChevronRightIcon />
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.SubContent
                className="page-settings-submenu page-settings-submenu--padding"
                sideOffset={4}
                alignOffset={-4}
              >
                <PaddingEditorCard
                  value={padding}
                  onChange={onPaddingChange}
                />
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
