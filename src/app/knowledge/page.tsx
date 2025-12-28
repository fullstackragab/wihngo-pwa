"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { BookOpen, Bird, AlertTriangle, Utensils, Home, Sun, Building, Heart, Shield } from "lucide-react";
import { motion } from "motion/react";
import { guideCategories } from "@/data/guides";
import { species } from "@/data/species";
import { guides } from "@/data/guides";

const iconMap: Record<string, React.ElementType> = {
  Utensils,
  Home,
  Sun,
  Building,
  Heart,
  Shield,
};

export default function KnowledgeHubPage() {
  const router = useRouter();

  const sections = [
    {
      title: "Guides",
      description: "Practical knowledge for bird care",
      href: "/knowledge/guides",
      icon: BookOpen,
      count: guides.length,
    },
    {
      title: "Species",
      description: "Learn about different birds",
      href: "/knowledge/species",
      icon: Bird,
      count: species.length,
    },
    {
      title: "Myths & Mistakes",
      description: "Common misconceptions debunked",
      href: "/knowledge/myths",
      icon: AlertTriangle,
      count: null,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title="Knowledge Hub" onBack={() => router.back()} />

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-4"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Trusted reference for bird care. We prefer accuracy and care over speed.
          </p>
        </motion.div>

        {/* Main Sections */}
        <div className="space-y-3">
          {sections.map((section, index) => (
            <motion.div
              key={section.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <Link href={section.href}>
                <Card className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <section.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-foreground">
                          {section.title}
                        </h3>
                        {section.count !== null && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {section.count}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Guide Categories Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pt-4"
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            Guide Categories
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(guideCategories).map(([key, category]) => {
              const Icon = iconMap[category.icon] || BookOpen;
              return (
                <Link key={key} href={`/knowledge/guides?category=${key}`}>
                  <Card className="p-4 hover:shadow-sm transition-shadow">
                    <Icon className="w-5 h-5 text-primary mb-2" />
                    <h4 className="text-sm font-medium text-foreground">
                      {category.title}
                    </h4>
                  </Card>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Note about content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-5 bg-accent/30 border-accent">
            <p className="text-sm text-foreground/80 leading-relaxed text-center">
              Our guides are being carefully prepared by people who care about
              getting it right. We prioritize accuracy over speed.
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
