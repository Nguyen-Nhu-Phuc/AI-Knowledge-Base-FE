"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy path — Super Admin lives at /app/super-admin */
export default function AdminRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/app/super-admin");
  }, [router]);
  return null;
}
