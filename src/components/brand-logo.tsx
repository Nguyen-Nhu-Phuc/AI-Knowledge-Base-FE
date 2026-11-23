import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandLogo({
  compact = false,
  href = "/app",
  className,
}: {
  compact?: boolean;
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
        className={cn(
        "group flex h-8 min-w-0 items-center outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        compact ? "justify-center" : "gap-2.5",
        className,
      )}
      aria-label="AI Knowledge Base"
    >
      <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg shadow-sm ring-1 ring-black/5 dark:ring-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand-mark.svg"
          alt=""
          width={32}
          height={32}
          className="h-full w-full object-cover"
          draggable={false}
        />
      </span>
      {!compact ? (
        <span className="font-display truncate text-[14px] font-semibold tracking-tight text-foreground">
          AI Knowledge Base
        </span>
      ) : null}
    </Link>
  );
}
