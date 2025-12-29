"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyBirds } from "@/services/bird.service";
import { useAuth } from "@/contexts/auth-context";
import { BottomNav } from "@/components/bottom-nav";
import { LoadingScreen, LoadingSpinner } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bird, Plus, Pencil, Heart, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "motion/react";

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

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h2>My Birds</h2>
            </div>
            <Link href="/birds/create">
              <Button size="sm" className="rounded-full gap-1.5">
                <Plus className="w-4 h-4" />
                Add Bird
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : !birds || birds.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Bird className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No birds yet
            </h3>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              Add your first bird to start sharing their story and receiving support from the community.
            </p>
            <Link href="/birds/create">
              <Button size="lg" className="rounded-full gap-2">
                <Plus className="w-5 h-5" />
                Add Your First Bird
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {birds.map((bird, index) => (
              <motion.div
                key={bird.birdId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div
                  className="bg-card rounded-2xl border border-border/50 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/birds/${bird.birdId}`)}
                >
                  <div className="flex">
                    {/* Bird Image */}
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 bg-muted flex-shrink-0">
                      {bird.imageUrl ? (
                        <Image
                          src={bird.imageUrl}
                          alt={bird.name || "Bird"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                          <span className="text-3xl">🐦</span>
                        </div>
                      )}
                      {bird.isMemorial && (
                        <div className="absolute top-2 left-2 bg-foreground/70 text-card px-2 py-0.5 rounded-full text-xs">
                          Memorial
                        </div>
                      )}
                    </div>

                    {/* Bird Info */}
                    <div className="flex-1 p-4 min-w-0 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground truncate text-lg">
                          {bird.name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {bird.species}
                        </p>
                        {bird.location && (
                          <p className="text-sm text-muted-foreground truncate mt-0.5">
                            {bird.location}
                          </p>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Heart className="w-4 h-4" />
                          <span>{bird.lovedBy || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{bird.supportedBy || 0}</span>
                        </div>
                        {bird.totalSupport !== undefined && bird.totalSupport > 0 && (
                          <span className="text-sm text-primary font-medium">
                            ${bird.totalSupport.toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Edit Button */}
                    <div
                      className="flex items-center px-3 sm:px-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link href={`/birds/${bird.birdId}/edit`}>
                        <Button variant="outline" size="sm" className="rounded-full gap-1.5">
                          <Pencil className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Nav spacer */}
      <div className="h-20" />
      <BottomNav />
    </div>
  );
}
