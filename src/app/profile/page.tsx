"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { usePhantom } from "@/hooks/use-phantom";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading";
import {
  User,
  Wallet,
  Heart,
  Bird as BirdIcon,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { isConnected, walletAddress, connect } = usePhantom();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push("/");
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
              onClick={() => router.push("/")}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2>Profile</h2>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* User Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-card rounded-2xl border border-border/50 space-y-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {user.profileImageUrl ? (
                <Image
                  src={user.profileImageUrl}
                  alt={user.name || "User"}
                  width={64}
                  height={64}
                  className="object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-primary" strokeWidth={1.5} />
              )}
            </div>
            <div className="flex-1">
              <h3>{user.name || "Bird Supporter"}</h3>
              <p className="text-sm text-muted-foreground">
                {user.bio || "Making the world kinder for birds"}
              </p>
            </div>
          </div>

          {/* Wallet Status */}
          <div className="pt-4 border-t border-border/50">
            {isConnected ? (
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">Wallet Connected</span>
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    {walletAddress}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    No wallet connected
                  </span>
                </div>
                <Button
                  onClick={connect}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                >
                  Connect
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <Link href="/profile/loved-birds">
            <div className="flex gap-3 p-4 bg-card rounded-xl border border-border/50">
              <Heart className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="mb-1">Birds I&apos;ve Supported</h4>
                <p className="text-sm text-muted-foreground">
                  View the birds you&apos;ve helped
                </p>
              </div>
            </div>
          </Link>

          <Link href="/profile/my-birds">
            <div className="flex gap-3 p-4 bg-card rounded-xl border border-border/50">
              <BirdIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="mb-1">My Birds</h4>
                <p className="text-sm text-muted-foreground">
                  Manage birds you&apos;re caring for
                </p>
              </div>
            </div>
          </Link>

          <Link href="/profile/wallet">
            <div className="flex gap-3 p-4 bg-card rounded-xl border border-border/50">
              <Wallet className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="mb-1">Wallet & Payments</h4>
                <p className="text-sm text-muted-foreground">
                  Manage your wallet and view history
                </p>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Edit Profile & Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <Link href="/profile/edit">
            <Button variant="outline" className="w-full rounded-full">
              Edit Profile
            </Button>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 text-destructive font-medium"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </motion.div>
      </div>

      {/* Bottom Nav spacer */}
      <div className="h-20" />
      <BottomNav />
    </div>
  );
}
