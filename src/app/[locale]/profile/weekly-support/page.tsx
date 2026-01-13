"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading";
import { ListItemSkeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  Pause,
  Play,
  Trash2,
  Bell,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import {
  getWeeklySupportSubscriptions,
  getWeeklySupportSummary,
  getPendingWeeklyPayments,
  pauseWeeklySupportSubscription,
  resumeWeeklySupportSubscription,
  cancelWeeklySupportSubscription,
} from "@/services/weekly-support.service";
import {
  WeeklySupportSubscriptionListItem,
  WeeklySupportSummary,
  PendingWeeklyPayment,
  DAY_NAMES,
} from "@/types/weekly-support";

export default function WeeklySupportPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations("weeklySupport");
  const tCommon = useTranslations("common");

  const [subscriptions, setSubscriptions] = useState<WeeklySupportSubscriptionListItem[]>([]);
  const [summary, setSummary] = useState<WeeklySupportSummary | null>(null);
  const [pendingPayments, setPendingPayments] = useState<PendingWeeklyPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    async function loadData() {
      if (!isAuthenticated) return;

      setIsLoading(true);
      setError(null);
      try {
        const [subs, sum, pending] = await Promise.all([
          getWeeklySupportSubscriptions(),
          getWeeklySupportSummary(),
          getPendingWeeklyPayments(),
        ]);
        setSubscriptions(subs);
        setSummary(sum);
        setPendingPayments(pending.filter(p => !p.isExpired));
      } catch (err) {
        console.error("Failed to load weekly support data:", err);
        setError("Failed to load weekly support data");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [isAuthenticated]);

  const handlePause = async (subscriptionId: string) => {
    setActionLoading(subscriptionId);
    try {
      await pauseWeeklySupportSubscription(subscriptionId);
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.subscriptionId === subscriptionId ? { ...s, status: "paused" } : s
        )
      );
    } catch (err) {
      console.error("Failed to pause subscription:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async (subscriptionId: string) => {
    setActionLoading(subscriptionId);
    try {
      await resumeWeeklySupportSubscription(subscriptionId);
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.subscriptionId === subscriptionId ? { ...s, status: "active" } : s
        )
      );
    } catch (err) {
      console.error("Failed to resume subscription:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (subscriptionId: string) => {
    if (!confirm("Are you sure you want to cancel this weekly support? This cannot be undone.")) {
      return;
    }
    setActionLoading(subscriptionId);
    try {
      await cancelWeeklySupportSubscription(subscriptionId);
      setSubscriptions((prev) =>
        prev.filter((s) => s.subscriptionId !== subscriptionId)
      );
    } catch (err) {
      console.error("Failed to cancel subscription:", err);
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="h-8 bg-neutral-200 rounded w-40 animate-pulse" />
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          <ListItemSkeleton />
          <ListItemSkeleton />
          <ListItemSkeleton />
          <ListItemSkeleton />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const activeSubs = subscriptions.filter((s) => s.status === "active");
  const pausedSubs = subscriptions.filter((s) => s.status === "paused");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/profile")}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2>{t("title")}</h2>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Pending Approvals Banner */}
        {pendingPayments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link href="/profile/weekly-support/pending">
              <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-xl border border-primary/20">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-neutral-900">
                    {pendingPayments.length} {t("pendingApprovals")}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {t("tapToApprove")}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              </div>
            </Link>
          </motion.div>
        )}

        {/* Summary Stats */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="p-4 bg-card rounded-xl border border-border/50 text-center">
              <p className="text-2xl font-bold text-primary">
                ${summary.weeklyTotalUsdc.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">{t("weeklyTotal")}</p>
            </div>
            <div className="p-4 bg-card rounded-xl border border-border/50 text-center">
              <p className="text-2xl font-bold text-neutral-900">
                ${summary.lifetimeTotalPaidUsdc.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">{t("lifetimeTotal")}</p>
            </div>
          </motion.div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-destructive/10 rounded-xl text-destructive">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {/* Active Subscriptions */}
        {activeSubs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-medium text-muted-foreground px-1">
              {t("activeSubscriptions")} ({activeSubs.length})
            </h3>
            {activeSubs.map((sub) => (
              <SubscriptionCard
                key={sub.subscriptionId}
                subscription={sub}
                actionLoading={actionLoading}
                onPause={handlePause}
                onResume={handleResume}
                onCancel={handleCancel}
                t={t}
              />
            ))}
          </motion.div>
        )}

        {/* Paused Subscriptions */}
        {pausedSubs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-medium text-muted-foreground px-1">
              {t("pausedSubscriptions")} ({pausedSubs.length})
            </h3>
            {pausedSubs.map((sub) => (
              <SubscriptionCard
                key={sub.subscriptionId}
                subscription={sub}
                actionLoading={actionLoading}
                onPause={handlePause}
                onResume={handleResume}
                onCancel={handleCancel}
                t={t}
              />
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {subscriptions.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {t("noSubscriptions")}
            </h3>
            <p className="text-neutral-600 mb-6">
              {t("noSubscriptionsDesc")}
            </p>
            <Link href="/birds">
              <Button className="bg-primary hover:bg-primary-hover text-white rounded-full">
                {t("browseBirds")}
              </Button>
            </Link>
          </motion.div>
        )}

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 bg-green-50 rounded-xl space-y-3"
        >
          <h4 className="font-medium text-neutral-900">{t("howItWorks")}</h4>
          <ul className="space-y-2 text-sm text-neutral-700">
            <li className="flex items-start gap-2">
              <span className="text-primary">1.</span>
              {t("howItWorksStep1")}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">2.</span>
              {t("howItWorksStep2")}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">3.</span>
              {t("howItWorksStep3")}
            </li>
          </ul>
          <p className="text-xs text-neutral-500 pt-2 border-t border-green-200">
            {t("nonCustodialNote")}
          </p>
        </motion.div>
      </div>

      {/* Bottom Nav spacer */}
      <div className="h-20" />
      <BottomNav />
    </div>
  );
}

interface SubscriptionCardProps {
  subscription: WeeklySupportSubscriptionListItem;
  actionLoading: string | null;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  t: (key: string) => string;
}

function SubscriptionCard({
  subscription,
  actionLoading,
  onPause,
  onResume,
  onCancel,
  t,
}: SubscriptionCardProps) {
  const isLoading = actionLoading === subscription.subscriptionId;
  const isPaused = subscription.status === "paused";

  return (
    <div className={`p-4 bg-card rounded-xl border ${isPaused ? 'border-neutral-300 opacity-75' : 'border-border/50'}`}>
      <div className="flex items-start gap-3">
        {/* Bird Image */}
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
          {subscription.birdImageUrl ? (
            <Image
              src={subscription.birdImageUrl}
              alt={subscription.birdName}
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              🐦
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-neutral-900 truncate">
              {subscription.birdName}
            </h4>
            {isPaused && (
              <span className="px-2 py-0.5 text-xs bg-neutral-200 text-neutral-600 rounded-full">
                {t("paused")}
              </span>
            )}
          </div>
          <p className="text-lg font-bold text-primary">
            ${subscription.amountUsdc.toFixed(2)}/week
          </p>
          {subscription.nextReminderAt && !isPaused && (
            <p className="text-xs text-neutral-500 mt-1">
              {t("nextReminder")}: {new Date(subscription.nextReminderAt).toLocaleDateString()}
            </p>
          )}
          <p className="text-xs text-neutral-500">
            {subscription.totalPaymentsCount} {t("paymentsCompleted")}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {isPaused ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onResume(subscription.subscriptionId)}
              disabled={isLoading}
              className="rounded-full text-primary hover:bg-primary/10"
              title={t("resume")}
            >
              {isLoading ? (
                <LoadingSpinner className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onPause(subscription.subscriptionId)}
              disabled={isLoading}
              className="rounded-full text-neutral-500 hover:bg-neutral-100"
              title={t("pause")}
            >
              {isLoading ? (
                <LoadingSpinner className="w-4 h-4" />
              ) : (
                <Pause className="w-4 h-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCancel(subscription.subscriptionId)}
            disabled={isLoading}
            className="rounded-full text-destructive hover:bg-destructive/10"
            title={t("cancel")}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
