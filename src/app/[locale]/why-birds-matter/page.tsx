"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { motion } from "motion/react";

export default function WhyBirdsMatterPage() {
  const router = useRouter();

  const sections = [
    {
      title: "The Silent Struggle",
      content:
        "Those who raise birds at home know how vulnerable they are. Their only resource is the food we provide; they cannot earn a living or find food on their own. When you put out food for them, birds try to hold onto it as if it were a treasure.",
    },
    {
      title: "Small Gestures, Big Hearts",
      content:
        "I once saw a fattened hen, after eating, sit next to the dish, clutching it with her wing as if afraid someone would take it from her. Some birds sit on top of their food, and some even tread on it with their feet. Birds do not have hands like we do; they simply peck with their beaks to eat or chirp to ask for something.",
    },
    {
      title: "The Challenge of Care",
      content:
        "Raising broiler chickens taught me about their needs. They are among the weakest creatures; they love clean water and cleanliness. Unfortunately, they are often neglected, especially regarding hygiene. They are kept in dirty places, and while they suffer, they cannot do anything about it.",
    },
    {
      title: "Dignity in Simple Things",
      content:
        "When a hen needs to relieve herself, she must do it right there, and all she can do is move to another spot. If there is no space, she is forced to sit on the waste and get dirty, which is torture for her. These creatures deserve better.",
    },
    {
      title: "Our Mission",
      content:
        "This initiative aims to encourage people to care for and nurture birds, including cleaning them and feeding them their favorite food. We want birds to stay healthy and feel loved.",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title="Why Birds Matter" onBack={() => router.back()} />

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-4"
        >
          <p className="text-lg text-muted-foreground leading-relaxed">
            They depend on us more than we realize
          </p>
        </motion.div>

        {/* Content Sections */}
        <div className="space-y-4">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <Card className="p-5">
                <h3 className="text-foreground font-medium mb-2">
                  {section.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {section.content}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="pt-4"
        >
          <Card className="p-6 bg-primary/5 border-primary/20 text-center">
            <h3 className="text-foreground font-medium mb-4">
              Support Birds with Wihngo
            </h3>
            <Link href="/birds">
              <Button size="lg" className="rounded-full gap-2">
                <Heart className="w-4 h-4" />
                Explore Birds
              </Button>
            </Link>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
