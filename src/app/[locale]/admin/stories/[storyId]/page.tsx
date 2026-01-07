"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStoryForModeration,
  approveStory,
  rejectStory,
  hideStory,
} from "@/services/admin.service";
import { extractYouTubeId, getYouTubeEmbedUrl } from "@/types/community-story";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  ArrowLeft,
  Check,
  X,
  EyeOff,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("admin");

  const styles = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`px-3 py-1.5 text-sm font-medium rounded-full ${
        styles[status as keyof typeof styles] || styles.pending
      }`}
    >
      {t(`status.${status}`)}
    </span>
  );
}

// Confirmation modal
function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  confirmVariant = "default",
  isLoading,
  requireReason,
  reason,
  setReason,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "default" | "danger";
  isLoading: boolean;
  requireReason?: boolean;
  reason?: string;
  setReason?: (value: string) => void;
}) {
  const t = useTranslations("admin");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h3>
        <p className="text-neutral-600 mb-4">{description}</p>

        {requireReason && setReason && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t("review.reasonLabel")}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
              rows={3}
              placeholder={t("review.reasonPlaceholder")}
            />
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t("cancel")}
          </Button>
          <Button
            variant={confirmVariant === "danger" ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isLoading || (requireReason && !reason?.trim())}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminStoryReviewPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("admin");

  const storyId = params.storyId as string;

  // Modal states
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [hideModalOpen, setHideModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [hideReason, setHideReason] = useState("");

  // Fetch story details
  const { data: story, isLoading, error } = useQuery({
    queryKey: ["admin", "story", storyId],
    queryFn: () => getStoryForModeration(storyId),
    enabled: !!storyId,
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: () => approveStory(storyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      setApproveModalOpen(false);
      router.push("/admin/stories");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectStory(storyId, rejectReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      setRejectModalOpen(false);
      router.push("/admin/stories");
    },
  });

  const hideMutation = useMutation({
    mutationFn: () => hideStory(storyId, hideReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      setHideModalOpen(false);
      router.push("/admin/stories");
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-neutral-200 rounded w-32 animate-pulse" />
        <div className="bg-white rounded-xl border border-neutral-200 p-6 animate-pulse">
          <div className="aspect-video bg-neutral-200 rounded-lg mb-4" />
          <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-neutral-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !story) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("back")}
        </button>

        <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            {t("review.notFound")}
          </h3>
          <p className="text-neutral-500 mb-4">{t("review.notFoundDesc")}</p>
          <Button onClick={() => router.push("/admin/stories")}>
            {t("review.backToList")}
          </Button>
        </div>
      </div>
    );
  }

  const youtubeId = story.youtubeUrl ? extractYouTubeId(story.youtubeUrl) : null;
  const isPending = story.status === "pending";
  const isApproved = story.status === "approved";

  return (
    <div className="space-y-6 pb-32">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("back")}
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusBadge status={story.status} />
          <span className="text-sm text-neutral-500 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatDate(story.createdAt)}
          </span>
        </div>
      </div>

      {/* Content Card */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {/* Media */}
        {youtubeId ? (
          <div className="aspect-video">
            <iframe
              src={getYouTubeEmbedUrl(youtubeId)}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        ) : story.mediaUrl ? (
          story.mediaType === "video" ? (
            <video
              src={story.mediaUrl}
              controls
              className="w-full aspect-video object-contain bg-black"
            />
          ) : (
            <div className="aspect-video relative bg-neutral-100">
              <Image
                src={story.mediaUrl}
                alt="Story media"
                fill
                className="object-contain"
              />
            </div>
          )
        ) : null}

        {/* Description */}
        <div className="p-6">
          <h3 className="text-sm font-medium text-neutral-500 mb-2">
            {t("review.description")}
          </h3>
          <p className="text-neutral-900 whitespace-pre-wrap">
            {story.description || t("review.noDescription")}
          </p>
        </div>

        {/* Rejection reason (if rejected) */}
        {story.rejectionReason && (
          <div className="px-6 pb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-red-800 mb-1">
                {t("review.rejectionReason")}
              </h4>
              <p className="text-sm text-red-700">{story.rejectionReason}</p>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="px-6 pb-6 border-t border-neutral-100 pt-4">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-neutral-500">{t("review.storyId")}</dt>
              <dd className="text-neutral-900 font-mono text-xs mt-1">
                {story.id}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">{t("review.submittedBy")}</dt>
              <dd className="text-neutral-900 font-mono text-xs mt-1">
                {story.submittedByUserId}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-end gap-3">
          {isPending && (
            <>
              <Button
                variant="destructive"
                onClick={() => setRejectModalOpen(true)}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                {t("review.reject")}
              </Button>
              <Button
                onClick={() => setApproveModalOpen(true)}
                className="gap-2"
              >
                <Check className="w-4 h-4" />
                {t("review.approve")}
              </Button>
            </>
          )}
          {isApproved && (
            <Button
              variant="outline"
              onClick={() => setHideModalOpen(true)}
              className="gap-2"
            >
              <EyeOff className="w-4 h-4" />
              {t("review.hide")}
            </Button>
          )}
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        onConfirm={() => approveMutation.mutate()}
        title={t("review.approveTitle")}
        description={t("review.approveDesc")}
        confirmLabel={t("review.approve")}
        isLoading={approveMutation.isPending}
      />

      <ConfirmModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={() => rejectMutation.mutate()}
        title={t("review.rejectTitle")}
        description={t("review.rejectDesc")}
        confirmLabel={t("review.reject")}
        confirmVariant="danger"
        isLoading={rejectMutation.isPending}
        requireReason
        reason={rejectReason}
        setReason={setRejectReason}
      />

      <ConfirmModal
        isOpen={hideModalOpen}
        onClose={() => setHideModalOpen(false)}
        onConfirm={() => hideMutation.mutate()}
        title={t("review.hideTitle")}
        description={t("review.hideDesc")}
        confirmLabel={t("review.hide")}
        confirmVariant="danger"
        isLoading={hideMutation.isPending}
        requireReason
        reason={hideReason}
        setReason={setHideReason}
      />
    </div>
  );
}
