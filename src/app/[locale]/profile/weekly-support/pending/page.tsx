"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { usePhantom } from "@/hooks/use-phantom";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { LoadingScreen, LoadingSpinner } from "@/components/ui/loading";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wallet,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import {
  getPendingWeeklyPayments,
  approveWeeklyPayment,
  submitWeeklyPayment,
} from "@/services/weekly-support.service";
import { PendingWeeklyPayment } from "@/types/weekly-support";

type PaymentState = "idle" | "approving" | "signing" | "submitting" | "success" | "error";

interface PaymentStatus {
  paymentId: string;
  state: PaymentState;
  error?: string;
  signature?: string;
}

export default function PendingApprovalsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isConnected, connect, signTransaction, isPhantomInstalled } = usePhantom();
  const router = useRouter();
  const t = useTranslations("weeklySupport");
  const tCommon = useTranslations("common");

  const [pendingPayments, setPendingPayments] = useState<PendingWeeklyPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatuses, setPaymentStatuses] = useState<Map<string, PaymentStatus>>(new Map());

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
        const pending = await getPendingWeeklyPayments();
        setPendingPayments(pending.filter((p) => !p.isExpired));
      } catch (err) {
        console.error("Failed to load pending payments:", err);
        setError("Failed to load pending approvals");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [isAuthenticated]);

  const updatePaymentStatus = (paymentId: string, status: Partial<PaymentStatus>) => {
    setPaymentStatuses((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(paymentId) || { paymentId, state: "idle" as PaymentState };
      newMap.set(paymentId, { ...current, ...status });
      return newMap;
    });
  };

  const handleApprove = async (payment: PendingWeeklyPayment) => {
    // Connect wallet if not connected
    if (!isConnected) {
      try {
        await connect();
      } catch (err) {
        console.error("Failed to connect wallet:", err);
        updatePaymentStatus(payment.paymentId, {
          state: "error",
          error: "Please connect your Phantom wallet first",
        });
        return;
      }
    }

    // Step 1: Get the pre-filled transaction from backend
    updatePaymentStatus(payment.paymentId, { state: "approving" });

    try {
      const approveResponse = await approveWeeklyPayment({
        paymentId: payment.paymentId,
      });

      // Step 2: Sign with Phantom
      updatePaymentStatus(payment.paymentId, { state: "signing" });

      const signedTransaction = await signTransaction(approveResponse.serializedTransaction);

      // Step 3: Submit signed transaction to backend
      updatePaymentStatus(payment.paymentId, { state: "submitting" });

      const submitResponse = await submitWeeklyPayment({
        intentId: approveResponse.intentId,
        signedTransaction,
      });

      // Success!
      updatePaymentStatus(payment.paymentId, {
        state: "success",
        signature: submitResponse.signature,
      });

      // Remove from pending list after a brief delay
      setTimeout(() => {
        setPendingPayments((prev) =>
          prev.filter((p) => p.paymentId !== payment.paymentId)
        );
      }, 2000);
    } catch (err) {
      console.error("Failed to approve payment:", err);
      updatePaymentStatus(payment.paymentId, {
        state: "error",
        error: err instanceof Error ? err.message : "Failed to approve payment",
      });
    }
  };

  const getExpiryDays = (expiresAt: string): number => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  if (authLoading || isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/profile/weekly-support")}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2>{t("pendingApprovalsTitle")}</h2>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Wallet Status Banner */}
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-amber-50 rounded-xl border border-amber-200"
          >
            <div className="flex items-start gap-3">
              <Wallet className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-900">{t("walletRequired")}</p>
                <p className="text-sm text-amber-700 mb-3">
                  {t("walletRequiredDesc")}
                </p>
                {isPhantomInstalled ? (
                  <Button
                    onClick={() => connect()}
                    size="sm"
                    className="bg-primary hover:bg-primary-hover text-white rounded-full"
                  >
                    {t("connectWallet")}
                  </Button>
                ) : (
                  <a
                    href="https://phantom.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-purple-600 font-medium hover:underline"
                  >
                    {t("getPhantom")} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-destructive/10 rounded-xl text-destructive">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {/* Pending Payments List */}
        <AnimatePresence mode="popLayout">
          {pendingPayments.map((payment) => {
            const status = paymentStatuses.get(payment.paymentId);
            const expiryDays = getExpiryDays(payment.expiresAt);

            return (
              <motion.div
                key={payment.paymentId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                layout
                className="p-4 bg-card rounded-xl border border-border/50"
              >
                <div className="flex items-start gap-3">
                  {/* Bird Image */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
                    {payment.birdImageUrl ? (
                      <Image
                        src={payment.birdImageUrl}
                        alt={payment.birdName}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        🐦
                      </div>
                    )}
                  </div>

                  {/* Payment Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-neutral-900 truncate">
                      {payment.birdName}
                    </h4>
                    <p className="text-lg font-bold text-primary">
                      ${payment.totalAmount.toFixed(2)}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {t("weekOf")} {new Date(payment.weekStartDate).toLocaleDateString()}
                    </p>

                    {/* Expiry Warning */}
                    {expiryDays <= 2 && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                        <Clock className="w-3 h-3" />
                        <span>
                          {expiryDays === 0
                            ? t("expirestoday")
                            : t("expiresIn", { days: expiryDays })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="flex-shrink-0">
                    {status?.state === "success" ? (
                      <div className="flex items-center gap-2 text-primary">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm font-medium">{t("sent")}</span>
                      </div>
                    ) : status?.state === "error" ? (
                      <div className="text-right">
                        <p className="text-xs text-destructive mb-1">{status.error}</p>
                        <Button
                          onClick={() => handleApprove(payment)}
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                        >
                          {t("retry")}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleApprove(payment)}
                        disabled={
                          status?.state === "approving" ||
                          status?.state === "signing" ||
                          status?.state === "submitting"
                        }
                        size="sm"
                        className="bg-primary hover:bg-primary-hover text-white rounded-full min-w-[100px]"
                      >
                        {status?.state === "approving" ? (
                          <>
                            <LoadingSpinner className="w-4 h-4 me-1" />
                            {t("preparing")}
                          </>
                        ) : status?.state === "signing" ? (
                          <>
                            <LoadingSpinner className="w-4 h-4 me-1" />
                            {t("signing")}
                          </>
                        ) : status?.state === "submitting" ? (
                          <>
                            <LoadingSpinner className="w-4 h-4 me-1" />
                            {t("sending")}
                          </>
                        ) : (
                          t("approve")
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty State */}
        {pendingPayments.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {t("allCaughtUp")}
            </h3>
            <p className="text-neutral-600 mb-6">{t("noPendingPayments")}</p>
            <Button
              onClick={() => router.push("/profile/weekly-support")}
              variant="outline"
              className="rounded-full"
            >
              {t("backToSubscriptions")}
            </Button>
          </motion.div>
        )}

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 bg-neutral-50 rounded-xl space-y-2"
        >
          <h4 className="font-medium text-neutral-900">{t("oneClickApproval")}</h4>
          <p className="text-sm text-neutral-600">{t("oneClickApprovalDesc")}</p>
        </motion.div>
      </div>

      {/* Bottom Nav spacer */}
      <div className="h-20" />
      <BottomNav />
    </div>
  );
}
