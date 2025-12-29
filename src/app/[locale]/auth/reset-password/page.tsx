"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, CheckCircle, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { API_URL } from "@/lib/config";
import { useTranslations } from "next-intl";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isValidLink = email && token;

  const PASSWORD_REQUIREMENTS = [
    { label: t("req8to128"), test: (p: string) => p.length >= 8 && p.length <= 128 },
    { label: t("reqUppercase"), test: (p: string) => /[A-Z]/.test(p) },
    { label: t("reqLowercase"), test: (p: string) => /[a-z]/.test(p) },
    { label: t("reqNumber"), test: (p: string) => /[0-9]/.test(p) },
    { label: t("reqSpecial"), test: (p: string) => /[!@#$%^&*()_+\-=\[\]{}';:"|,.<>/?\\]/.test(p) },
  ];

  const passwordsMatch = newPassword === confirmPassword;
  const allRequirementsMet = PASSWORD_REQUIREMENTS.every(req => req.test(newPassword));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!passwordsMatch) {
      setError(t("passwordsNoMatch"));
      return;
    }

    if (!allRequirementsMet) {
      setError(t("passwordNotMeetReq"));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
          token,
          newPassword,
          confirmPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Reset failed" }));
        if (errorData.errors && Array.isArray(errorData.errors)) {
          throw new Error(errorData.errors.join(", "));
        }
        throw new Error(errorData.message || "Failed to reset password");
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  // Invalid link state
  if (!isValidLink) {
    return (
      <div className="min-h-screen-safe flex flex-col">
        <header className="px-6 py-4 pt-safe">
          <button onClick={() => router.push("/auth/login")} className="text-muted-foreground hover:text-foreground transition-colors">
            ← {t("backToLogin")}
          </button>
        </header>

        <main className="flex-1 flex flex-col justify-center px-6 pb-12">
          <div className="max-w-sm mx-auto w-full space-y-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h1 className="text-2xl font-medium text-foreground">{t("invalidResetLink")}</h1>
                <p className="text-muted-foreground mt-2">
                  {t("invalidResetLinkDesc")}
                </p>
              </div>
            </div>

            <Link href="/auth/forgot-password" className="block">
              <Button fullWidth size="lg">
                {t("requestNewLink")}
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen-safe flex flex-col">
        <header className="px-6 py-4 pt-safe">
          <button onClick={() => router.push("/auth/login")} className="text-muted-foreground hover:text-foreground transition-colors">
            ← {t("backToLogin")}
          </button>
        </header>

        <main className="flex-1 flex flex-col justify-center px-6 pb-12">
          <div className="max-w-sm mx-auto w-full space-y-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <div>
                <h1 className="text-2xl font-medium text-foreground">{t("passwordReset")}</h1>
                <p className="text-muted-foreground mt-2">
                  {t("passwordResetSuccess")}
                </p>
              </div>
            </div>

            <Link href="/auth/login" className="block">
              <Button fullWidth size="lg">
                {t("login")}
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Main form
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
              <KeyRound className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-medium text-foreground">{t("setNewPassword")}</h1>
              <p className="text-muted-foreground mt-1">
                {t("setNewPasswordDesc")}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                label={t("newPassword")}
                placeholder={t("newPasswordPlaceholder")}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                label={t("confirmPassword")}
                placeholder={t("confirmNewPassword")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                error={confirmPassword && !passwordsMatch ? t("passwordsNoMatch") : undefined}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Requirements */}
            {newPassword && (
              <div className="bg-secondary/50 rounded-2xl p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">{t("passwordRequirements")}</p>
                <ul className="space-y-1">
                  {PASSWORD_REQUIREMENTS.map((req, index) => {
                    const passed = req.test(newPassword);
                    return (
                      <li key={index} className={`text-sm flex items-center gap-2 ${passed ? "text-success" : "text-muted-foreground"}`}>
                        {passed ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-current" />
                        )}
                        {req.label}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 text-destructive rounded-2xl p-3 text-sm text-center">
                {error}
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              disabled={!allRequirementsMet || !passwordsMatch || !newPassword || !confirmPassword}
            >
              {t("resetPassword")}
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

function LoadingFallback() {
  return (
    <div className="min-h-screen-safe flex flex-col items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
