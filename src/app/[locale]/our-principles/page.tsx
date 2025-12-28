"use client";

import { useRouter } from "next/navigation";
import { OurPrinciples } from "@/components/our-principles";

export default function OurPrinciplesPage() {
  const router = useRouter();

  return <OurPrinciples onBack={() => router.back()} />;
}
