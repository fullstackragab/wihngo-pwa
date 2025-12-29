"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyBirds } from "@/services/bird.service";
import { useAuth } from "@/contexts/auth-context";
import { BottomNav } from "@/components/bottom-nav";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bird, Plus, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function MyBirdsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const { data: birds, isLoading } = useQuery({
    queryKey: ["myBirds"],
    queryFn: getMyBirds,
    enabled: isAuthenticated,
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
    <div className="min-h-screen-safe bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4 pt-safe sticky top-0 z-40">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 -ml-2">
              <ArrowLeft className="w-6 h-6 text-muted-foreground" />
            </button>
            <h1 className="text-xl font-bold text-foreground">My Birds</h1>
          </div>
          <Link href="/birds/create">
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
            <Bird className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No birds yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Add your first bird to start receiving support
            </p>
            <Link href="/birds/create">
              <Button>Add Bird</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {birds.map((bird) => (
              <Card
                key={bird.birdId}
                variant="outlined"
                padding="none"
                className="overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => router.push(`/birds/${bird.birdId}`)}
              >
                <div className="flex">
                  {/* Bird Image */}
                  <div className="relative w-24 h-24 bg-muted flex-shrink-0">
                    {bird.imageUrl ? (
                      <Image
                        src={bird.imageUrl}
                        alt={bird.name || "Bird"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                        <span className="text-2xl">🐦</span>
                      </div>
                    )}
                  </div>

                  {/* Bird Info */}
                  <div className="flex-1 p-3 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{bird.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{bird.species}</p>
                    {bird.location && (
                      <p className="text-sm text-muted-foreground truncate mt-1">{bird.location}</p>
                    )}
                  </div>

                  {/* Edit Button */}
                  <div
                    className="flex items-center px-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link href={`/birds/${bird.birdId}/edit`}>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
