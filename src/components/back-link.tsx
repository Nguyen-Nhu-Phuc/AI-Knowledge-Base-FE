"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "@/components/icons";
import { cn } from "@/lib/utils";

type BackLinkProps = {
  href?: string;
  label?: string;
  /** Icon only — label stays as aria-label / title. */
  iconOnly?: boolean;
  className?: string;
  onClick?: () => void;
};

export function BackLink({
  href,
  label,
  iconOnly = false,
  className,
  onClick,
}: BackLinkProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const text = label || t("common.back");

  const classes = cn(
    "inline-flex h-9 items-center gap-1.5 rounded-lg text-sm font-medium text-muted outline-none transition-colors",
    "hover:bg-ink-100 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-ink-800",
    iconOnly ? "w-9 justify-center px-0" : "px-2.5",
    className,
  );

  const content = (
    <>
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
      {!iconOnly ? <span>{text}</span> : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        aria-label={text}
        title={text}
        onClick={onClick}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      aria-label={text}
      title={text}
      onClick={() => {
        onClick?.();
        router.back();
      }}
    >
      {content}
    </button>
  );
}
