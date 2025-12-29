"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { signup } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function SignupPage() {
  const router = useRouter();
  const { login: authLogin } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("passwordsNoMatch"));
      return;
    }

    if (password.length < 8) {
      setError(t("passwordTooShort"));
      return;
    }

    setIsLoading(true);

    try {
      const response = await signup({ name, email, password });
      authLogin(response);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen-safe flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 pt-safe">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground transition-colors">
          ← {tCommon("back")}
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col justify-center px-6 pb-12">
        <div className="max-w-sm mx-auto w-full space-y-8">
          {/* Logo */}
          <div className="text-center space-y-4">
            <Image
              src="/logo.png"
              alt="Wihngo"
              width={160}
              height={160}
              className="mx-auto"
            />
            <div>
              <h1 className="text-2xl font-medium text-foreground">{t("createAccount")}</h1>
              <p className="text-muted-foreground mt-1">{t("joinCommunity")}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              label={t("name")}
              placeholder={t("namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
            <Input
              type="email"
              label={t("email")}
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              type="password"
              label={t("password")}
              placeholder={t("createPassword")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              helperText={t("atLeast8Chars")}
            />
            <Input
              type="password"
              label={t("confirmPassword")}
              placeholder={t("confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />

            {error && (
              <div className="bg-destructive/10 text-destructive rounded-2xl p-3 text-sm text-center">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
              {t("createAccountBtn")}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center">
            {t("agreeToTerms")}{" "}
            <Link href="/terms" className="text-primary">
              {t("termsOfService")}
            </Link>{" "}
            {t("and")}{" "}
            <Link href="/privacy" className="text-primary">
              {t("privacyPolicy")}
            </Link>
          </p>

          <div className="text-center">
            <p className="text-muted-foreground">
              {t("hasAccount")}{" "}
              <Link href="/auth/login" className="text-primary font-medium">
                {t("login")}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
