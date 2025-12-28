"use client";

import { useAuth } from "@/contexts/auth-context";
import { BottomNav } from "@/components/bottom-nav";
import { LoadingScreen } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Bird, Heart } from "lucide-react";
import Image from "next/image";
import { motion } from "motion/react";

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return <LoadingScreen />;
  }

  // Welcome Screen (Figma design)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-secondary/30">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center max-w-md text-center space-y-8"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="relative"
        >
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <Bird className="w-12 h-12 text-primary" strokeWidth={1.5} />
          </div>
        </motion.div>

        {/* App Name */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="mb-2">Wihngo</h1>
          <p className="text-muted-foreground">
            Helping birds feel safe, fed, and loved.
          </p>
        </motion.div>

        {/* Hero Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="w-full rounded-3xl overflow-hidden shadow-lg relative aspect-[4/3]"
        >
          <Image
            src="https://images.unsplash.com/photo-1764179896031-967c3a77fff2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFsbCUyMGJpcmQlMjBuZXN0JTIwcGVhY2VmdWx8ZW58MXx8fHwxNzY2OTE0MTA3fDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Bird in nest"
            fill
            className="object-cover"
            unoptimized
          />
        </motion.div>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-foreground/80 leading-relaxed"
        >
          Join a community built on sympathy, care, and shared joy for birds.
          Every bit of support helps a bird feel welcome in this world.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex flex-col w-full gap-3"
        >
          <Link href="/birds" className="w-full">
            <Button size="lg" className="w-full rounded-full gap-2">
              <Heart className="w-4 h-4" />
              Support a Bird
            </Button>
          </Link>
          <Link href="/birds" className="w-full">
            <Button
              variant="outline"
              size="lg"
              className="w-full rounded-full"
            >
              Explore Birds
            </Button>
          </Link>
        </motion.div>

        {/* Auth Links */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="pt-2"
          >
            <p className="text-muted-foreground text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Bottom Nav - only show when authenticated */}
      {isAuthenticated && (
        <>
          <div className="h-20" />
          <BottomNav />
        </>
      )}
    </div>
  );
}
