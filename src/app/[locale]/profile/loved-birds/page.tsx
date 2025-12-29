"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLovedBirds } from "@/services/bird.service";
import { useAuth } from "@/contexts/auth-context";
import { BirdCard } from "@/components/bird-card";
import { BottomNav } from "@/components/bottom-nav";
import { LoadingSpinner } from "@/components/ui/loading";
import { ArrowLeft, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function LovedBirdsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations("profile");

  const { data: birds, isLoading } = useQuery({
    queryKey: ["lovedBirds", user?.userId],
    queryFn: () => getLovedBirds(user!.userId),
    enabled: isAuthenticated && !!user?.userId,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen-safe bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 pt-safe sticky top-0 z-40">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">{t("lovedBirds")}</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : !birds || birds.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("noLovedBirdsYet")}
            </h3>
            <p className="text-gray-500">
              {t("tapHeartToSave")}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {birds.map((bird) => (
              <BirdCard key={bird.birdId} bird={bird} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
