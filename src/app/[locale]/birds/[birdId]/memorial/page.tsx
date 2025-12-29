"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBird, getMemorial, getMemorialMessages, postMemorialMessage } from "@/services/bird.service";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { LoadingScreen, LoadingSpinner } from "@/components/ui/loading";
import { ArrowLeft, Heart, Send, Calendar, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";

export default function MemorialPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const birdId = params.birdId as string;
  const [message, setMessage] = useState("");
  const t = useTranslations("memorial");
  const tBirds = useTranslations("birds");
  const tAuth = useTranslations("auth");

  const { data: bird, isLoading: birdLoading } = useQuery({
    queryKey: ["bird", birdId],
    queryFn: () => getBird(birdId),
    enabled: !!birdId,
  });

  const { data: memorial, isLoading: memorialLoading } = useQuery({
    queryKey: ["memorial", birdId],
    queryFn: () => getMemorial(birdId),
    enabled: !!birdId && bird?.isMemorial === true,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["memorialMessages", birdId],
    queryFn: () => getMemorialMessages(birdId),
    enabled: !!birdId && bird?.isMemorial === true,
  });

  const postMessageMutation = useMutation({
    mutationFn: (content: string) => postMemorialMessage(birdId, { content }),
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["memorialMessages", birdId] });
      queryClient.invalidateQueries({ queryKey: ["memorial", birdId] });
    },
  });

  const handleSubmitMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && isAuthenticated) {
      postMessageMutation.mutate(message.trim());
    }
  };

  if (birdLoading) {
    return <LoadingScreen />;
  }

  if (!bird) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{tBirds("birdNotFound")}</p>
          <Button onClick={() => router.back()}>{tBirds("goBack")}</Button>
        </div>
      </div>
    );
  }

  if (!bird.isMemorial) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{t("noMemorial")}</p>
          <Link href={`/birds/${birdId}`}>
            <Button>{t("viewBirdProfile")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-8">
        {/* Memorial Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <div className="relative inline-block mb-6">
            {bird.imageUrl ? (
              <Image
                src={bird.imageUrl}
                alt={bird.name}
                width={160}
                height={160}
                className="w-40 h-40 rounded-full object-cover border-4 border-primary/20 shadow-lg"
              />
            ) : (
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-4 border-primary/20">
                <span className="text-5xl">🕊️</span>
              </div>
            )}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-foreground/80 text-card px-4 py-1 rounded-full text-sm whitespace-nowrap">
              {t("inLovingMemory")}
            </div>
          </div>

          <h1 className="text-2xl font-semibold mb-2">{bird.name}</h1>
          {bird.species && (
            <p className="text-muted-foreground mb-4">{bird.species}</p>
          )}

          {/* Stats */}
          {memorial && (
            <div className="flex justify-center gap-8 mt-6">
              {memorial.memorialDate && (
                <div className="text-center">
                  <Calendar className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {new Date(memorial.memorialDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div className="text-center">
                <Users className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {memorial.totalSupporters} {t("supporters")}
                </p>
              </div>
              <div className="text-center">
                <Heart className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-sm text-muted-foreground">
                  ${memorial.totalSupport?.toFixed(2) || '0.00'} {t("raised")}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Message about the bird */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border/50 p-6 mb-6"
        >
          <p className="text-foreground/80 text-center leading-relaxed">
            {t("touchedHearts", { name: bird.name })}
          </p>
          <p className="text-muted-foreground text-sm text-center mt-4 italic">
            &ldquo;{t("careQuote")}&rdquo;
          </p>
        </motion.div>

        {/* Tribute Messages Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="font-medium text-foreground">{t("tributes")}</h2>

          {/* Post Tribute Form */}
          {isAuthenticated ? (
            <form onSubmit={handleSubmitMessage} className="mb-6">
              <div className="bg-card rounded-2xl border border-border/50 p-4">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("shareTribute", { name: bird.name })}
                  className="w-full bg-transparent resize-none outline-none text-foreground placeholder:text-muted-foreground min-h-[80px]"
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-muted-foreground">
                    {message.length}/500
                  </span>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!message.trim() || postMessageMutation.isPending}
                    className="rounded-full gap-2"
                  >
                    {postMessageMutation.isPending ? (
                      <LoadingSpinner className="w-4 h-4" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {t("postTribute")}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <div className="bg-muted/50 rounded-2xl p-4 text-center mb-6">
              <p className="text-sm text-muted-foreground mb-2">
                {t("signInToShare")}
              </p>
              <Link href="/auth/login">
                <Button variant="outline" size="sm" className="rounded-full">
                  {tAuth("login")}
                </Button>
              </Link>
            </div>
          )}

          {/* Messages List */}
          {messagesLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border/50 text-center py-8">
              <p className="text-muted-foreground">
                {t("beFirstTribute", { name: bird.name })}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.messageId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-2xl border border-border/50 p-4"
                >
                  <div className="flex items-start gap-3">
                    {msg.userImageUrl ? (
                      <Image
                        src={msg.userImageUrl}
                        alt={msg.userName || "User"}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm">
                          {(msg.userName || "A")[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {msg.userName || "Anonymous"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-foreground/80 text-sm leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* View Profile Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <Link href={`/birds/${birdId}`}>
            <Button variant="outline" className="rounded-full">
              {t("viewProfile", { name: bird.name })}
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
