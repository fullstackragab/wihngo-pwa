"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { submitCommunityStory, uploadStoryMedia } from "@/services/community-story.service";
import {
  extractYouTubeId,
  getYouTubeThumbnail,
} from "@/types/community-story";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading";
import { ArrowLeft, CheckCircle, AlertCircle, Play, Upload, X, ImageIcon, Video } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";

// Media limits
const MAX_IMAGE_SIZE_MB = 10;
const MAX_VIDEO_SIZE_MB = 50;
const MAX_VIDEO_DURATION_SECONDS = 60;

export default function SubmitCommunityStoryPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const t = useTranslations("communityStories.submit");
  const tCommon = useTranslations("common");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [description, setDescription] = useState("");
  const [urlError, setUrlError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Media upload state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [mediaError, setMediaError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedMediaKey, setUploadedMediaKey] = useState<string | null>(null);

  // Extract video ID for preview (only if URL provided)
  const videoId = youtubeUrl ? extractYouTubeId(youtubeUrl) : null;
  const thumbnailUrl = videoId ? getYouTubeThumbnail(videoId) : null;

  // At least one of YouTube URL, description, or media must be provided
  const hasContent = !!(youtubeUrl.trim() || description.trim() || uploadedMediaKey);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (mediaPreview) {
        URL.revokeObjectURL(mediaPreview);
      }
    };
  }, [mediaPreview]);

  const submitMutation = useMutation({
    mutationFn: submitCommunityStory,
    onSuccess: () => {
      setIsSuccess(true);
    },
  });

  const validateUrl = (url: string): boolean => {
    if (!url) {
      setUrlError("");
      return true;
    }
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      setUrlError(t("invalidUrl"));
      return false;
    }
    setUrlError("");
    return true;
  };

  const validateVideoDuration = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        if (video.duration > MAX_VIDEO_DURATION_SECONDS) {
          setMediaError(t("videoTooLong", { seconds: MAX_VIDEO_DURATION_SECONDS }));
          resolve(false);
        } else {
          resolve(true);
        }
      };
      video.onerror = () => {
        setMediaError(t("invalidVideo"));
        resolve(false);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaError("");

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setMediaError(t("invalidFileType"));
      return;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (isImage && fileSizeMB > MAX_IMAGE_SIZE_MB) {
      setMediaError(t("imageTooLarge", { size: MAX_IMAGE_SIZE_MB }));
      return;
    }
    if (isVideo && fileSizeMB > MAX_VIDEO_SIZE_MB) {
      setMediaError(t("videoTooLarge", { size: MAX_VIDEO_SIZE_MB }));
      return;
    }

    // Check video duration
    if (isVideo) {
      const isValidDuration = await validateVideoDuration(file);
      if (!isValidDuration) return;
    }

    // Set preview
    const previewUrl = URL.createObjectURL(file);
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaPreview(previewUrl);
    setMediaType(isImage ? "image" : "video");
    setMediaFile(file);

    // Upload the file
    setIsUploading(true);
    try {
      const result = await uploadStoryMedia(file);
      setUploadedMediaKey(result.mediaKey);
    } catch {
      setMediaError(t("uploadFailed"));
      clearMedia();
    } finally {
      setIsUploading(false);
    }
  };

  const clearMedia = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setUploadedMediaKey(null);
    setMediaError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasContent) return;
    if (youtubeUrl && !validateUrl(youtubeUrl)) return;

    submitMutation.mutate({
      youtubeUrl: youtubeUrl.trim() || undefined,
      description: description.trim() || undefined,
      mediaKey: uploadedMediaKey || undefined,
    });
  };

  if (authLoading || !isAuthenticated) {
    return null;
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-lg mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 text-center shadow-sm"
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              {t("successTitle")}
            </h2>
            <p className="text-neutral-600 mb-6">{t("successDesc")}</p>
            <Link href="/community-stories">
              <Button className="w-full">{t("backToStories")}</Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-700" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">
              {t("title")}
            </h1>
            <p className="text-sm text-neutral-500">{t("subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-lg mx-auto px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Media Upload */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t("media")} <span className="text-neutral-400">({tCommon("optional")})</span>
            </label>

            {!mediaPreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <Upload className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                <p className="text-neutral-600 mb-1">{t("uploadMedia")}</p>
                <p className="text-sm text-neutral-500">
                  {t("mediaLimits", { imageSize: MAX_IMAGE_SIZE_MB, videoSize: MAX_VIDEO_SIZE_MB, duration: MAX_VIDEO_DURATION_SECONDS })}
                </p>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-neutral-200">
                {mediaType === "image" ? (
                  <div className="aspect-video relative">
                    <Image
                      src={mediaPreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <video
                    src={mediaPreview}
                    controls
                    className="w-full aspect-video object-cover"
                  />
                )}

                {/* Upload indicator */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <LoadingSpinner className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">{t("uploading")}</p>
                    </div>
                  </div>
                )}

                {/* Remove button */}
                {!isUploading && (
                  <button
                    type="button"
                    onClick={clearMedia}
                    className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}

                {/* Type indicator */}
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded-full text-white text-xs flex items-center gap-1">
                  {mediaType === "image" ? (
                    <><ImageIcon className="w-3 h-3" /> {t("imageLabel")}</>
                  ) : (
                    <><Video className="w-3 h-3" /> {t("videoLabel")}</>
                  )}
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {mediaError && (
              <p className="text-sm text-red-500 mt-2">{mediaError}</p>
            )}
          </div>

          {/* YouTube URL (Optional) */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t("youtubeUrl")} <span className="text-neutral-400">({tCommon("optional")})</span>
            </label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => {
                setYoutubeUrl(e.target.value);
                if (urlError) validateUrl(e.target.value);
              }}
              onBlur={() => validateUrl(youtubeUrl)}
              placeholder={t("youtubeUrlPlaceholder")}
              className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
            />
            {urlError && (
              <p className="text-sm text-red-500 mt-1">{urlError}</p>
            )}
            <p className="text-sm text-neutral-500 mt-1">{t("youtubeUrlHint")}</p>

            {/* YouTube Preview */}
            {thumbnailUrl && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 aspect-video rounded-xl overflow-hidden bg-neutral-200 relative"
              >
                <Image
                  src={thumbnailUrl}
                  alt="Video preview"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-6 h-6 text-neutral-900 ml-0.5" />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t("description")} <span className="text-neutral-400">({tCommon("optional")})</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors resize-none"
            />
          </div>

          {/* Submission Guidelines */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900 mb-2">
                  {t("guidelines")}
                </h4>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>• {t("guideline1")}</li>
                  <li>• {t("guideline2")}</li>
                  <li>• {t("guideline3")}</li>
                  <li>• {t("guideline4")}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!hasContent || !!urlError || isUploading || submitMutation.isPending}
          >
            {submitMutation.isPending ? t("submitting") : t("submitButton")}
          </Button>

          {submitMutation.isError && (
            <p className="text-sm text-red-500 text-center">
              {tCommon("error")}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
