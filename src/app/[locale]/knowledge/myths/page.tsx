"use client";

import { useRouter } from "next/navigation";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Clock, X, Check } from "lucide-react";
import { motion } from "motion/react";

export default function MythsPage() {
  const router = useRouter();

  // Placeholder myths - structure for when content is ready
  const myths = [
    {
      myth: "Birds will reject their babies if you touch them",
      isReady: false,
    },
    {
      myth: "Bread is good for ducks and birds",
      isReady: false,
    },
    {
      myth: "Birds don't need water in winter",
      isReady: false,
    },
    {
      myth: "It's okay to release pet birds into the wild",
      isReady: false,
    },
    {
      myth: "All seeds are safe for all birds",
      isReady: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title="Myths & Mistakes" onBack={() => router.back()} />

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-4"
        >
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-lg font-medium text-foreground mb-2">
            Common Misconceptions
          </h2>
          <p className="text-muted-foreground">
            Well-meaning advice that can actually harm birds. Learn what not to do.
          </p>
        </motion.div>

        {/* Myths List */}
        <div className="space-y-3">
          {myths.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="w-4 h-4 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground font-medium">
                      &ldquo;{item.myth}&rdquo;
                    </p>
                    {!item.isReady && (
                      <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Explanation being prepared
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-5 bg-accent/30 border-accent text-center">
            <Clock className="w-6 h-6 text-primary mx-auto mb-3" />
            <h3 className="font-medium text-foreground mb-2">
              Detailed explanations coming soon
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We&apos;re carefully researching each myth to provide accurate,
              helpful corrections. Quality matters more than speed.
            </p>
          </Card>
        </motion.div>

        {/* What we do know */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-5 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Check className="w-5 h-5 text-primary" />
              <h3 className="font-medium text-foreground">What we know for sure</h3>
            </div>
            <ul className="space-y-2 text-sm text-foreground/80">
              <li>• Clean water is essential for all birds</li>
              <li>• Hygiene prevents disease spread</li>
              <li>• Birds feel stress and calm</li>
              <li>• Small acts of care make a real difference</li>
            </ul>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
