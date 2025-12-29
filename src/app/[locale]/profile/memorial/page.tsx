"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyBirds, markAsMemorial } from "@/services/bird.service";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { LoadingScreen, LoadingSpinner } from "@/components/ui/loading";
import {
  ArrowLeft,
  Bird,
  Heart,
  Flower2,
  AlertTriangle,
  Check,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";

type Step = "select" | "confirm" | "complete";

export default function MemorialAnnouncementPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [step, setStep] = useState<Step>("select");
  const [selectedBirdId, setSelectedBirdId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { data: birds, isLoading } = useQuery({
    queryKey: ["myBirds"],
    queryFn: getMyBirds,
    enabled: isAuthenticated,
  });

  const markMemorialMutation = useMutation({
    mutationFn: markAsMemorial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBirds"] });
      queryClient.invalidateQueries({ queryKey: ["birds"] });
      queryClient.invalidateQueries({ queryKey: ["bird", selectedBirdId] });
      setStep("complete");
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to update. Please try again.");
    },
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

  // Filter out birds that are already memorials
  const eligibleBirds = birds?.filter((bird) => !bird.isMemorial) || [];
  const selectedBird = birds?.find((bird) => bird.birdId === selectedBirdId);

  const handleSelectBird = (birdId: string) => {
    setSelectedBirdId(birdId);
    setStep("confirm");
    setError("");
  };

  const handleConfirm = () => {
    if (selectedBirdId) {
      markMemorialMutation.mutate(selectedBirdId);
    }
  };

  const handleBack = () => {
    if (step === "confirm") {
      setStep("select");
      setSelectedBirdId(null);
      setError("");
    } else {
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="rounded-full"
              disabled={markMemorialMutation.isPending}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2>Memorial</h2>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Select Bird */}
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Intro */}
              <div className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-foreground/5 flex items-center justify-center">
                  <Flower2 className="w-8 h-8 text-foreground/70" />
                </div>
                <h1 className="text-xl font-semibold text-foreground mb-2">
                  Create a Memorial
                </h1>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  Honor your bird&apos;s memory and allow the community to share tributes.
                </p>
              </div>

              {/* Bird List */}
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : eligibleBirds.length === 0 ? (
                <div className="text-center py-12">
                  <Bird className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {birds && birds.length > 0
                      ? "All your birds are already memorials."
                      : "You don't have any birds yet."}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 rounded-full"
                    onClick={() => router.push("/profile/my-birds")}
                  >
                    Go to My Birds
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Select a bird to create a memorial:
                  </p>
                  {eligibleBirds.map((bird, index) => (
                    <motion.button
                      key={bird.birdId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSelectBird(bird.birdId)}
                      className="w-full bg-card rounded-2xl border border-border/50 p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                        {bird.imageUrl ? (
                          <Image
                            src={bird.imageUrl}
                            alt={bird.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                            <span className="text-2xl">🐦</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {bird.name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {bird.species}
                        </p>
                      </div>
                      <Flower2 className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Confirm */}
          {step === "confirm" && selectedBird && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Bird Preview */}
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-foreground/10">
                  {selectedBird.imageUrl ? (
                    <Image
                      src={selectedBird.imageUrl}
                      alt={selectedBird.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                      <span className="text-4xl">🐦</span>
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-1">
                  {selectedBird.name}
                </h2>
                <p className="text-muted-foreground">{selectedBird.species}</p>
              </div>

              {/* Confirmation Message */}
              <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-foreground mb-1">
                      This action cannot be undone
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Creating a memorial is a permanent change. Please confirm this is what you want.
                    </p>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-4 space-y-3">
                  <p className="text-sm text-foreground">
                    When you create a memorial for {selectedBird.name}:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      A dedicated memorial page will be created
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      The community can share tributes and memories
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      Past supporters will be notified with a compassionate message
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      {selectedBird.name} will no longer accept new support
                    </li>
                  </ul>
                </div>
              </div>

              {/* Compassionate note */}
              <div className="bg-primary/5 rounded-2xl p-4 text-center">
                <Heart className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-sm text-foreground/80 italic">
                  &ldquo;Every bird that graces our lives leaves footprints on our hearts.&rdquo;
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-destructive/10 text-destructive rounded-xl p-4 text-sm text-center">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <Button
                  onClick={handleConfirm}
                  disabled={markMemorialMutation.isPending}
                  className="w-full rounded-full gap-2"
                  size="lg"
                >
                  {markMemorialMutation.isPending ? (
                    <>
                      <LoadingSpinner className="w-5 h-5" />
                      Creating Memorial...
                    </>
                  ) : (
                    <>
                      <Flower2 className="w-5 h-5" />
                      Create Memorial for {selectedBird.name}
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={markMemorialMutation.isPending}
                  className="w-full rounded-full"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Complete */}
          {step === "complete" && selectedBird && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 space-y-6"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Flower2 className="w-10 h-10 text-primary" />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Memorial Created
                </h2>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  {selectedBird.name}&apos;s memorial page is now live.
                  The community can share their tributes and memories.
                </p>
              </div>

              <div className="bg-card rounded-2xl border border-border/50 p-4 max-w-sm mx-auto">
                <p className="text-sm text-muted-foreground mb-1">
                  All past supporters have been notified
                </p>
                <p className="text-xs text-muted-foreground/70">
                  They received a compassionate email about {selectedBird.name}&apos;s memorial.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  onClick={() => router.push(`/birds/${selectedBirdId}/memorial`)}
                  className="w-full rounded-full gap-2"
                  size="lg"
                >
                  <Heart className="w-5 h-5" />
                  View Memorial Page
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/profile/my-birds")}
                  className="w-full rounded-full"
                >
                  Back to My Birds
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
