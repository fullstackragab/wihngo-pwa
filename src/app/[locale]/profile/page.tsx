"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { usePhantom } from "@/hooks/use-phantom";
import { linkWallet } from "@/services/wallet.service";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { LoadingScreen, LoadingSpinner } from "@/components/ui/loading";
import {
  User,
  Wallet,
  Heart,
  Bird as BirdIcon,
  ArrowLeft,
  LogOut,
  Info,
  BookOpen,
  HandHeart,
  Feather,
  Scale,
  Lightbulb,
  Library,
  ExternalLink,
  FileText,
  Users,
  Globe,
  Flower2,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { isConnected, walletAddress, connect, isPhantomInstalled } = usePhantom();
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    setConnectError(null);
    try {
      const publicKey = await connect();
      if (publicKey) {
        // Link wallet to user account in backend
        await linkWallet(publicKey.toBase58());
      }
    } catch (err) {
      console.error("Wallet connection error:", err);
      setConnectError(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

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
            <h2>{t("title")}</h2>
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
                    <span className="text-sm font-medium">{t("walletConnected")}</span>
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    {walletAddress}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Wallet className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {t("noWalletConnected")}
                    </span>
                  </div>
                  <Button
                    onClick={handleConnectWallet}
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <>
                        <LoadingSpinner className="w-4 h-4 me-2" />
                        {tCommon("loading")}
                      </>
                    ) : (
                      t("connect")
                    )}
                  </Button>
                </div>
                {!isPhantomInstalled && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg">
                    <a
                      href="https://phantom.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-purple-600 font-medium hover:underline"
                    >
                      {t("getPhantom")} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {connectError && (
                  <p className="text-xs text-destructive">{connectError}</p>
                )}
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
                <h4 className="mb-1">{t("birdsSupported")}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("birdsSupportedDesc")}
                </p>
              </div>
            </div>
          </Link>

          <Link href="/profile/my-birds">
            <div className="flex gap-3 p-4 bg-card rounded-xl border border-border/50">
              <BirdIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="mb-1">{t("myBirds")}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("myBirdsDesc")}
                </p>
              </div>
            </div>
          </Link>

          <Link href="/profile/memorial">
            <div className="flex gap-3 p-4 bg-card rounded-xl border border-border/50">
              <Flower2 className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="mb-1">{t("createMemorial")}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("createMemorialDesc")}
                </p>
              </div>
            </div>
          </Link>

          <Link href="/profile/wallet">
            <div className="flex gap-3 p-4 bg-card rounded-xl border border-border/50">
              <Wallet className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="mb-1">{t("walletSupport")}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("walletSupportDesc")}
                </p>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Learn More Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-3"
        >
          <h3 className="text-sm font-medium text-muted-foreground px-1">
            {t("exploreSection")}
          </h3>
          <Link href="/knowledge">
            <div className="flex gap-3 p-4 bg-card rounded-xl border border-border/50">
              <Library className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="mb-1">{t("knowledgeHub")}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("knowledgeHubDesc")}
                </p>
              </div>
            </div>
          </Link>

          <Link href="/initiatives">
            <div className="flex gap-3 p-4 bg-card rounded-xl border border-border/50">
              <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="mb-1">{tCommon("initiatives") || "Initiatives"}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("initiativesDesc")}
                </p>
              </div>
            </div>
          </Link>

          <h3 className="text-sm font-medium text-muted-foreground px-1 pt-3">
            {t("learnMore")}
          </h3>
          <Link href="/about">
            <div className="flex gap-3 p-4 bg-card rounded-xl border border-border/50">
              <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="mb-1">{t("aboutWihngo")}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("aboutWihngoDesc")}
                </p>
              </div>
            </div>
          </Link>

          <Link href="/why-birds-matter">
            <div className="flex gap-3 p-4 bg-card rounded-xl border border-border/50">
              <Feather className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="mb-1">{t("whyBirdsMatter")}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("whyBirdsMatterDesc")}
                </p>
              </div>
            </div>
          </Link>

          <Link href="/support">
            <div className="flex gap-3 p-4 bg-card rounded-xl border border-border/50">
              <HandHeart className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="mb-1">{t("supportBirds")}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("supportBirdsDesc")}
                </p>
              </div>
            </div>
          </Link>

          <Link href="/chicken-happiness">
            <div className="flex gap-3 p-4 bg-card rounded-xl border border-border/50">
              <BookOpen className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="mb-1">{t("chickenHappiness")}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("chickenHappinessDesc")}
                </p>
              </div>
            </div>
          </Link>

          <Link href="/our-principles">
            <div className="flex gap-3 p-4 bg-card rounded-xl border border-border/50">
              <Scale className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="mb-1">{t("ourPrinciples")}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("ourPrinciplesDesc")}
                </p>
              </div>
            </div>
          </Link>

          <Link href="/manifesto">
            <div className="flex gap-3 p-4 bg-card rounded-xl border border-border/50">
              <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="mb-1">{t("manifesto")}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("manifestoDesc")}
                </p>
              </div>
            </div>
          </Link>

          <Link href="/open-call">
            <div className="flex gap-3 p-4 bg-card rounded-xl border border-border/50">
              <Users className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="mb-1">{t("openCall")}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("openCallDesc")}
                </p>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Language Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h3 className="text-sm font-medium text-muted-foreground px-1">
            {tCommon("language")}
          </h3>
          <div className="p-4 bg-card rounded-xl border border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-primary" />
                <span className="font-medium">{tCommon("language")}</span>
              </div>
              <LanguageSwitcher variant="buttons" />
            </div>
          </div>
        </motion.div>

        {/* Edit Profile & Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-3"
        >
          <Link href="/profile/edit">
            <Button variant="outline" className="w-full rounded-full">
              {t("editProfile")}
            </Button>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 text-destructive font-medium"
          >
            <LogOut className="w-5 h-5" />
            {t("signOut")}
          </button>
        </motion.div>
      </div>

      {/* Bottom Nav spacer */}
      <div className="h-20" />
      <BottomNav />
    </div>
  );
}
