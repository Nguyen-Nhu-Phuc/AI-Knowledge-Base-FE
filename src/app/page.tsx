import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { APP_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: APP_NAME,
  description:
    "Nơi đội ngũ hỏi tri thức nội bộ — có nguồn. Ask internal documents and get cited answers.",
};

export default function HomePage() {
  return <LandingPage />;
}
