"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { forgotPassword } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await forgotPassword(email);
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen-safe flex flex-col">
        <header className="px-6 py-4 pt-safe">
          <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground transition-colors">
            ← {tCommon("back")}
          </button>
        </header>

        <main className="flex-1 flex flex-col justify-center px-6 pb-12">
          <div className="max-w-sm mx-auto w-full space-y-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <div>
                <h1 className="text-2xl font-medium text-foreground">{t("checkYourEmail")}</h1>
                <p className="text-muted-foreground mt-2">
                  {t("resetLinkSent")} <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {t("didntReceiveEmail")}
              </p>
              <Button
                variant="outline"
                fullWidth
                size="lg"
                onClick={() => setIsSuccess(false)}
              >
                {t("tryAgain")}
              </Button>
              <Link href="/auth/login" className="block">
                <Button variant="ghost" fullWidth size="lg">
                  {t("backToSignIn")}
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen-safe flex flex-col">
      <header className="px-6 py-4 pt-safe">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground transition-colors">
          ← {tCommon("back")}
        </button>
      </header>

      <main className="flex-1 flex flex-col justify-center px-6 pb-12">
        <div className="max-w-sm mx-auto w-full space-y-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-medium text-foreground">{t("forgotPasswordTitle")}</h1>
              <p className="text-muted-foreground mt-1">
                {t("forgotPasswordDesc")}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label={t("email")}
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            {error && (
              <div className="bg-destructive/10 text-destructive rounded-2xl p-3 text-sm text-center">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
              {t("sendResetLink")}
            </Button>
          </form>

          <div className="text-center">
            <Link href="/auth/login" className="text-sm text-primary">
              {t("backToSignIn")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
