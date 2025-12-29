"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { BottomNav } from "@/components/bottom-nav";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Wallet, CreditCard, History } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WalletPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen-safe bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 pt-safe sticky top-0 z-40">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Wallet & Support</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Wallet Balance */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-support-green/10 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-support-green" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Supported</p>
              <p className="text-2xl font-bold text-gray-900">$0.00</p>
            </div>
          </div>
        </Card>

        {/* Wallets */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Connected Wallets</h2>
          <Card>
            <div className="flex items-center gap-4 text-gray-500">
              <CreditCard className="w-5 h-5" />
              <p>No wallets connected</p>
            </div>
          </Card>
        </div>

        {/* Transaction History */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Transaction History</h2>
          <Card>
            <div className="flex flex-col items-center py-6 text-gray-500">
              <History className="w-10 h-10 mb-2" />
              <p>No transactions yet</p>
            </div>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
