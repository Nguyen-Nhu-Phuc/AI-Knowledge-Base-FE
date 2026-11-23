import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "surface-panel rounded-2xl p-5 transition-shadow duration-200 hover:shadow-soft",
        className,
      )}
    >
      {children}
    </div>
  );
}
