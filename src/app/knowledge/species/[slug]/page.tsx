"use client";

import { useParams, useRouter } from "next/navigation";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bird, Clock, ArrowLeft, AlertTriangle, Lightbulb } from "lucide-react";
import { motion } from "motion/react";
import { getSpeciesBySlug } from "@/data/species";
import Link from "next/link";

export default function SpeciesDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const sp = getSpeciesBySlug(slug);

  if (!sp) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar title="Species" onBack={() => router.back()} />
        <div className="max-w-lg mx-auto p-4">
          <Card className="p-8 text-center">
            <Bird className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-medium text-foreground mb-2">Species not found</h2>
            <p className="text-muted-foreground mb-4">
              This species profile may have been moved or doesn&apos;t exist.
            </p>
            <Link href="/knowledge/species">
              <Button variant="outline" className="rounded-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Species
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  // Species profile is not ready
  if (!sp.isReady) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar title={sp.commonName} onBack={() => router.back()} />

        <div className="max-w-lg mx-auto p-4 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Bird className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-xl font-medium text-foreground mb-1">
              {sp.commonName}
            </h1>
            {sp.scientificName && (
              <p className="text-muted-foreground italic mb-4">
                {sp.scientificName}
              </p>
            )}
            {sp.description && (
              <p className="text-muted-foreground">{sp.description}</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 bg-accent/30 border-accent text-center">
              <Clock className="w-8 h-8 text-primary mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">
                This profile is being carefully prepared
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We&apos;re researching diet, habitat, common risks, and care tips
                for this species. The profile will be available once properly
                reviewed.
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <Link href="/knowledge/species">
              <Button variant="outline" className="rounded-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Explore Other Species
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  // Species profile is ready
  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title={sp.commonName} onBack={() => router.back()} />

      <div className="max-w-lg mx-auto p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-4"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Bird className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-xl font-medium text-foreground mb-1">
            {sp.commonName}
          </h1>
          {sp.scientificName && (
            <p className="text-muted-foreground italic">{sp.scientificName}</p>
          )}
        </motion.div>

        {sp.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-5">
              <p className="text-muted-foreground leading-relaxed">
                {sp.description}
              </p>
            </Card>
          </motion.div>
        )}

        {sp.diet && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-5">
              <h3 className="font-medium text-foreground mb-2">Diet</h3>
              <p className="text-muted-foreground">{sp.diet}</p>
            </Card>
          </motion.div>
        )}

        {sp.habitat && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-5">
              <h3 className="font-medium text-foreground mb-2">Habitat</h3>
              <p className="text-muted-foreground">{sp.habitat}</p>
            </Card>
          </motion.div>
        )}

        {sp.risks && sp.risks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-medium text-foreground">Common Risks</h3>
              </div>
              <ul className="space-y-2">
                {sp.risks.map((risk, index) => (
                  <li key={index} className="text-muted-foreground text-sm">
                    • {risk}
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        )}

        {sp.careTips && sp.careTips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-5 bg-primary/5 border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-primary" />
                <h3 className="font-medium text-foreground">Care Tips</h3>
              </div>
              <ul className="space-y-2">
                {sp.careTips.map((tip, index) => (
                  <li key={index} className="text-foreground/80 text-sm">
                    • {tip}
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
