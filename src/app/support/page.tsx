"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { motion } from "motion/react";

export default function SupportPage() {
  const router = useRouter();

  const emotionalParagraphs = [
    "Birds cannot speak for themselves. They cannot earn a living or seek help on their own. Their only resource is the care we choose to give them. When a bird clutches food with her wing, afraid it might be taken away, you realize how precious even the smallest gift of care can be.",
    "Every bird deserves clean water, proper food, and a clean space to live. Many are kept in conditions that cause them suffering, unable to change their situation. With your support, we can change that story for more birds.",
    "A small amount may not mean much to you, but it brings happiness to these creatures. Your contribution helps provide food, veterinary care, and the love that every bird deserves.",
  ];

  const clarifications = [
    {
      text: "I described the suffering of chickens to highlight their reality, hoping people will treat them better.",
    },
    {
      text: "Wihngo is not a charity and is not responsible for all birds worldwide.",
    },
    {
      text: "Wihngo is a community for bird lovers to share moments of love and care with their birds. If you have a bird you love and care for, you can share these moments on Wihngo.",
    },
    {
      text: "You can support birds on Wihngo by sending money to the bird, so the owner can buy food for the bird or any other stuff. $1 can feed the bird for a week.",
    },
    {
      text: "Wihngo is a for-profit business and charges a 5% fee on every transaction made on the platform.",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title="Support Birds" onBack={() => router.back()} />

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-4"
        >
          <h2 className="text-2xl font-medium text-foreground mb-2">
            They Need Your Help
          </h2>
          <p className="text-muted-foreground">
            A small gesture from you means the world to them
          </p>
        </motion.div>

        {/* Emotional Content */}
        <div className="space-y-4">
          {emotionalParagraphs.map((paragraph, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <Card className="p-5">
                <p className="text-muted-foreground leading-relaxed">
                  {paragraph}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Support CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pt-2"
        >
          <Link href="/birds">
            <Button size="lg" className="w-full rounded-full gap-2">
              <Heart className="w-4 h-4" />
              Find a Bird to Support
            </Button>
          </Link>
          <p className="text-center text-sm text-muted-foreground mt-3">
            Every contribution, no matter how small, makes a real difference.
          </p>
        </motion.div>

        {/* About Wihngo Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6 bg-muted/50">
            <h3 className="text-foreground font-medium mb-4 text-center">
              About Wihngo
            </h3>
            <div className="space-y-4">
              {clarifications.map((item, index) => (
                <p
                  key={index}
                  className="text-muted-foreground leading-relaxed text-sm"
                >
                  {item.text}
                </p>
              ))}
            </div>
            <p className="text-foreground/80 leading-relaxed text-sm italic mt-4 text-center">
              We may not be able to help every bird in the world, but we can
              bring happiness to the birds in our care – and we hope that
              kindness extends to every living creature.
            </p>
          </Card>
        </motion.div>

        {/* Support Wihngo Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <Link
            href="/support-wihngo"
            className="text-primary underline underline-offset-4"
          >
            Want to support Wihngo directly?
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
