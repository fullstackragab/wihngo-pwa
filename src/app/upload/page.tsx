"use client";

import { useRouter } from "next/navigation";
import { UploadFlow } from "@/components/upload-flow";
import { BottomNav } from "@/components/bottom-nav";

export default function UploadPage() {
  const router = useRouter();

  // Mock user birds - in a real app, this would come from an API
  const userBirds = [
    { id: "1", name: "Sunny", species: "Yellow Canary" },
    { id: "2", name: "Kiwi", species: "Green Parakeet" },
  ];

  return (
    <>
      <UploadFlow
        onBack={() => router.back()}
        onComplete={() => {
          router.push("/");
        }}
        userBirds={userBirds}
      />
      <BottomNav />
    </>
  );
}
