"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { Bird, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { species } from "@/data/species";

export default function SpeciesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title="Species" onBack={() => router.back()} />

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-4"
        >
          <p className="text-muted-foreground">
            Learn about different bird species, their needs, and how to help them.
          </p>
        </motion.div>

        {/* Species List */}
        <div className="space-y-3">
          {species.map((sp, index) => (
            <motion.div
              key={sp.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/knowledge/species/${sp.slug}`}>
                <Card className="p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bird className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground">
                        {sp.commonName}
                      </h3>
                      {sp.scientificName && (
                        <p className="text-sm text-muted-foreground italic">
                          {sp.scientificName}
                        </p>
                      )}
                      {!sp.isReady && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                          Being prepared
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-5 bg-accent/30 border-accent text-center">
            <p className="text-sm text-foreground/80">
              Species profiles are being carefully researched. More species will
              be added over time.
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
