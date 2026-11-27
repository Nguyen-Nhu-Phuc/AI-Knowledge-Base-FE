import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { APP_NAME } from "@/lib/brand";
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
      aria-label={APP_NAME}
    >
      <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-[9px] shadow-sm ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-[1.04] dark:ring-white/10">
        <BrandMark />
      </span>
      {!compact ? (
        <span className="font-display truncate text-[14px] font-semibold tracking-tight text-current">
          {APP_NAME}
        </span>
      ) : null}
    </Link>
  );
}
