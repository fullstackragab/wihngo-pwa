"use client";

import { useRouter } from "next/navigation";
import { OurPrinciples } from "@/components/our-principles";
import { BottomNav } from "@/components/bottom-nav";

export default function PrinciplesPage() {
  const router = useRouter();

  return (
    <>
      <OurPrinciples onBack={() => router.back()} />
      <BottomNav />
    </>
  );
}
