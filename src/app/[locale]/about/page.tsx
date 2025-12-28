"use client";

import { useRouter } from "next/navigation";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { motion } from "motion/react";

export default function AboutPage() {
  const router = useRouter();

  const values = [
    {
      title: "Love First",
      content:
        "Everything we do is driven by genuine love for birds and the people who care for them.",
    },
    {
      title: "Transparency",
      content:
        "We believe in complete openness about how we operate and how support reaches the birds.",
    },
    {
      title: "Community",
      content:
        "We bring together bird lovers to share stories, support each other, and celebrate the joy birds bring.",
    },
    {
      title: "Care",
      content:
        "We promote proper care practices including nutrition, hygiene, and health for all birds.",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title="About Wihngo" onBack={() => router.back()} />

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-4"
        >
          <p className="text-lg text-muted-foreground leading-relaxed">
            Built with love for birds and their humans
          </p>
        </motion.div>

        {/* Mission Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-primary/5 border-primary/20">
            <h3 className="text-primary font-medium mb-3">Our Mission</h3>
            <p className="text-foreground/80 leading-relaxed">
              Wihngo is a love-centric community for people who care about birds.
              We encourage people to care for and nurture birds, providing them
              with proper food, clean environments, and the love they deserve. We
              believe that every bird matters and that the bond between humans and
              birds is precious.
            </p>
          </Card>
        </motion.div>

        {/* Values Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="font-medium text-foreground text-center">Our Values</h2>
          <div className="grid gap-4">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card className="p-5">
                  <h3 className="text-foreground font-medium mb-2">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {value.content}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Vision Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6 bg-accent/30 border-accent">
            <h3 className="text-foreground font-medium mb-3">Our Vision</h3>
            <p className="text-foreground/80 leading-relaxed">
              We envision a world where every bird is treated with dignity, lives
              in a clean environment, enjoys proper nutrition, and feels loved.
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
