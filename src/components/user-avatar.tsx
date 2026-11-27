"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { getAvatarPalette, getInitials } from "@/lib/initials";

export function UserAvatar({
  name,
  avatarUrl,
  className,
  textClassName,
}: {
  name?: string | null;
  avatarUrl?: string | null;
  className?: string;
  textClassName?: string;
}) {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [avatarUrl]);

  const showImage = Boolean(avatarUrl) && !broken;
  const initials = getInitials(name);
  const palette = useMemo(
    () => getAvatarPalette(initials || name),
    [initials, name],
  );

  return (
    <span
      className={cn(
        "relative inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-[11px] font-semibold",
        showImage && "bg-accent-soft text-accent-soft-fg",
        className,
      )}
      style={
        showImage
          ? undefined
          : { backgroundColor: palette.bg, color: palette.fg }
      }
      aria-hidden={!showImage}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl!}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
          draggable={false}
        />
      ) : (
        <span className={cn("select-none", textClassName)}>{initials}</span>
      )}
    </span>
  );
}
