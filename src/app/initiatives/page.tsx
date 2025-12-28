"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, ChevronRight, CheckCircle, Clock, Beaker } from "lucide-react";
import { motion } from "motion/react";
import { initiatives, getActiveInitiatives, getCompletedInitiatives } from "@/data/initiatives";

type Tab = "active" | "completed";

export default function InitiativesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("active");

  const activeInitiatives = getActiveInitiatives();
  const completedInitiatives = getCompletedInitiatives();

  const displayedInitiatives = tab === "active" ? activeInitiatives : completedInitiatives;

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title="Initiatives" onBack={() => router.back()} />

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-4"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Real solutions for better bird life. Ideas that become experiments that become impact.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2">
          <Button
            variant={tab === "active" ? "default" : "outline"}
            size="sm"
            className="flex-1 rounded-full"
            onClick={() => setTab("active")}
          >
            <Clock className="w-4 h-4 mr-2" />
            Active ({activeInitiatives.length})
          </Button>
          <Button
            variant={tab === "completed" ? "default" : "outline"}
            size="sm"
            className="flex-1 rounded-full"
            onClick={() => setTab("completed")}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Completed ({completedInitiatives.length})
          </Button>
        </div>

        {/* Initiatives List */}
        <div className="space-y-4">
          {displayedInitiatives.map((initiative, index) => (
            <motion.div
              key={initiative.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/initiatives/${initiative.slug}`}>
                <Card className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-foreground">
                          {initiative.title}
                        </h3>
                        {initiative.isExample && (
                          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Beaker className="w-3 h-3" />
                            Example
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {initiative.tagline}
                      </p>
                      {initiative.progress !== undefined && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress</span>
                            <span>{initiative.progress}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${initiative.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {displayedInitiatives.length === 0 && (
          <Card className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {tab === "completed"
                ? "No completed initiatives yet."
                : "No active initiatives at the moment."}
            </p>
          </Card>
        )}

        {/* Note about examples */}
        {tab === "active" && activeInitiatives.some((i) => i.isExample) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-5 bg-amber-50 border-amber-200">
              <div className="flex items-start gap-3">
                <Beaker className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-amber-800 mb-1">
                    About Example Initiatives
                  </h4>
                  <p className="text-sm text-amber-700">
                    These are for demonstration and discussion. They represent the
                    kind of work Wihngo aims to do. Real initiatives will be
                    clearly marked when they begin.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Vision note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-5 bg-primary/5 border-primary/20 text-center">
            <p className="text-sm text-foreground/80 leading-relaxed">
              Initiatives turn ideas into action. Every project is transparent,
              documented, and built with bird welfare as the only priority.
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
