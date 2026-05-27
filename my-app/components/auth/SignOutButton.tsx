"use client";

import { signOut } from "next-auth/react";

export function SignOutButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className={
        className ||
        "text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
      }
    >
      Sign out
    </button>
  );
}
