"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBird, preUploadBirdImage } from "@/services/bird.service";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingScreen, LoadingSpinner } from "@/components/ui/loading";
import {
  ArrowLeft,
  Camera,
  MapPin,
  Bird,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

export default function CreateBirdPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("createBird");
  const tErrors = useTranslations("errors");

  // Form state
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [age, setAge] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageS3Key, setImageS3Key] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  // Auth check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const createBirdMutation = useMutation({
    mutationFn: createBird,
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to create bird profile");
    },
  });

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError(tErrors("selectImage"));
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(tErrors("imageTooLarge"));
        return;
      }

      // Show preview immediately
      setImagePreview(URL.createObjectURL(file));
      setError("");

      // Upload image immediately
      setIsUploading(true);
      try {
        const uploadResult = await preUploadBirdImage(file);
        setImageS3Key(uploadResult.s3Key);
      } catch (uploadErr) {
        console.error("Image upload failed:", uploadErr);
        setError(tErrors("uploadFailed"));
        setImagePreview(null);
        setImageS3Key(null);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    setImageS3Key(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!name.trim()) {
      setError(tErrors("enterBirdName"));
      return;
    }
    if (!species.trim()) {
      setError(tErrors("enterSpecies"));
      return;
    }

    try {
      // Create bird with already-uploaded image S3 key
      const bird = await createBirdMutation.mutateAsync({
        name: name.trim(),
        species: species.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        age: age.trim() || undefined,
        imageS3Key: imageS3Key || undefined,
      });

      // Invalidate queries and navigate
      queryClient.invalidateQueries({ queryKey: ["myBirds"] });
      queryClient.invalidateQueries({ queryKey: ["birds"] });
      queryClient.invalidateQueries({ queryKey: ["bird", bird.birdId] });
      router.push(`/birds/${bird.birdId}`);
    } catch {
      // Error handled by mutation
    }
  };

  const isSubmitting = isUploading || createBirdMutation.isPending;
  const canSubmit = name.trim() && species.trim() && !isSubmitting;

  if (authLoading) {
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
              onClick={() => router.back()}
              className="rounded-full"
              disabled={isSubmitting}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2>{t("title")}</h2>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pb-2"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Bird className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-1">
            {t("createProfile")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("shareStory")}
          </p>
        </motion.div>

        {/* Photo Upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          {imagePreview ? (
            <div className="relative aspect-square max-w-xs mx-auto rounded-2xl overflow-hidden bg-muted">
              <Image
                src={imagePreview}
                alt="Bird preview"
                fill
                className={`object-cover ${isUploading ? "opacity-50" : ""}`}
              />
              {/* Upload status overlay */}
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner className="w-8 h-8" />
                    <span className="text-sm font-medium">{t("uploading")}</span>
                  </div>
                </div>
              )}
              {/* Upload complete indicator */}
              {!isUploading && imageS3Key && (
                <div className="absolute bottom-2 left-2 bg-green-500 text-white rounded-full p-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={isUploading}
                className="absolute top-2 right-2 w-8 h-8 bg-foreground/80 rounded-full flex items-center justify-center text-background hover:bg-foreground transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[4/3] max-w-xs mx-auto rounded-2xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-3 hover:bg-muted/50 transition-colors"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">{t("addPhoto")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("photoHint")}
                </p>
              </div>
            </button>
          )}
        </motion.div>

        {/* Basic Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              {t("name")} <span className="text-destructive">*</span>
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              maxLength={50}
            />
          </div>

          <div>
            <label htmlFor="species" className="block text-sm font-medium text-foreground mb-2">
              {t("species")} <span className="text-destructive">*</span>
            </label>
            <Input
              id="species"
              type="text"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              placeholder={t("speciesPlaceholder")}
              maxLength={100}
            />
          </div>

          <div>
            <label htmlFor="age" className="block text-sm font-medium text-foreground mb-2">
              {t("age")}
            </label>
            <Input
              id="age"
              type="text"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder={t("agePlaceholder")}
              maxLength={50}
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-foreground mb-2">
              {t("location")}
            </label>
            <div className="relative">
              <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("locationPlaceholder")}
                className="ps-10"
                maxLength={100}
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
              {t("about")}
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("aboutPlaceholder")}
              className="w-full min-h-[120px] px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1 text-end">
              {description.length}/1000
            </p>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/10 text-destructive rounded-xl p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="pt-2"
        >
          <Button
            type="submit"
            size="lg"
            disabled={!canSubmit}
            className="w-full rounded-full gap-2"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner className="w-5 h-5" />
                {isUploading ? t("uploading") : t("creating")}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                {t("createButton")}
              </>
            )}
          </Button>
        </motion.div>

        {/* Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-center text-xs text-muted-foreground"
        >
          {t("canEditLater")}
        </motion.p>
      </form>
    </div>
  );
}
