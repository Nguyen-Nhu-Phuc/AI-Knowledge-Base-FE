import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Consistent page width + vertical rhythm inside the app shell. */
export function AppPage({
  children,
  className,
  wide = false,
}: {
  children: ReactNode;
  className?: string;
  /** Use more of the main column (lists, admin, chat). */
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "w-full",
        wide ? "max-w-[1400px]" : "app-page",
        "mx-auto space-y-6 md:space-y-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
