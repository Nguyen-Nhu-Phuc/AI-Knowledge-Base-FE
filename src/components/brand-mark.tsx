"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/** Inline mark so the logo follows the live 3-color theme. */
export function BrandMark({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const bg = `tn-bg-${uid}`;
  const page = `tn-page-${uid}`;

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-full w-full", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={bg} x1="8" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--theme-tertiary)" />
          <stop offset="0.55" stopColor="var(--theme-primary)" />
          <stop offset="1" stopColor="var(--theme-secondary)" />
        </linearGradient>
        <linearGradient id={page} x1="20" y1="14" x2="46" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="color-mix(in srgb, var(--theme-secondary) 28%, white)" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${bg})`} />
      <circle cx="48" cy="14" r="18" fill="#ffffff" fillOpacity="0.14" />
      <path
        d="M20 16.5c0-1.4 1.1-2.5 2.5-2.5H36l10 9.5V47.5c0 1.4-1.1 2.5-2.5 2.5h-21c-1.4 0-2.5-1.1-2.5-2.5v-31z"
        fill={`url(#${page})`}
      />
      <path d="M36 14v7.5c0 1.1.9 2 2 2H46" fill="color-mix(in srgb, var(--theme-secondary) 55%, white)" />
      <path
        d="M25 30h14M25 36h14M25 42h9"
        stroke="var(--theme-tertiary)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="44.5" cy="43.5" r="8.5" fill="var(--theme-tertiary)" />
      <circle
        cx="44.5"
        cy="43.5"
        r="8.5"
        stroke="var(--theme-secondary)"
        strokeWidth="1.5"
        strokeOpacity="0.85"
      />
      <path
        d="M41.2 43.5l2.1 2.1 4.5-4.6"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
