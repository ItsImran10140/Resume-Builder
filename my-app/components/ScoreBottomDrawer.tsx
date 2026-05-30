"use client";

import { AtsScorePanel } from "@/components/AtsScorePanel";

type ScoreBottomDrawerProps = {
  className?: string;
};

export function ScoreBottomDrawer({ className }: ScoreBottomDrawerProps) {
  return (
    <section className={className}>
      <AtsScorePanel compact />
    </section>
  );
}
