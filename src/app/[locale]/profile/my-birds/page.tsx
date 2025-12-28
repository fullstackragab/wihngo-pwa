"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserBirds } from "@/services/bird.service";
import { useAuth } from "@/contexts/auth-context";
import { BirdCard } from "@/components/bird-card";
import { BottomNav } from "@/components/bottom-nav";
import { LoadingSpinner } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bird, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MyBirdsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const { data: birds, isLoading } = useQuery({
    queryKey: ["myBirds", user?.userId],
    queryFn: () => getUserBirds(user!.userId),
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
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 -ml-2">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">My Birds</h1>
          </div>
          <Link href="/bird/create">
            <Button size="sm" className="gap-1">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </Link>
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
            <Bird className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No birds yet
            </h3>
            <p className="text-gray-500 mb-6">
              Add your first bird to start receiving support
            </p>
            <Link href="/bird/create">
              <Button>Add Bird</Button>
            </Link>
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
