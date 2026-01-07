"use client";

import { useQuery } from "@tanstack/react-query";
import { getPendingStories, AdminStoryListItem } from "@/services/admin.service";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Clock, Image, Video, Youtube, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Skeleton component for loading state
function StoryRowSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-neutral-200 rounded-lg shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 bg-neutral-200 rounded w-3/4" />
          <div className="h-3 bg-neutral-200 rounded w-1/2" />
        </div>
        <div className="h-6 bg-neutral-200 rounded w-16" />
      </div>
    </div>
  );
}

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
      className={`px-2.5 py-1 text-xs font-medium rounded-full ${
        styles[status as keyof typeof styles] || styles.pending
      }`}
    >
      {t(`status.${status}`)}
    </span>
  );
}

// Media type icon
function MediaTypeIcon({ story }: { story: AdminStoryListItem }) {
  if (story.youtubeUrl) {
    return (
      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
        <Youtube className="w-6 h-6 text-red-600" />
      </div>
    );
  }
  if (story.mediaType === "video") {
    return (
      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
        <Video className="w-6 h-6 text-blue-600" />
      </div>
    );
  }
  if (story.mediaType === "image") {
    return (
      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
        <Image className="w-6 h-6 text-green-600" />
      </div>
    );
  }
  return (
    <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center shrink-0">
      <FileText className="w-6 h-6 text-neutral-600" />
    </div>
  );
}

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminStoriesPage() {
  const t = useTranslations("admin");

  const { data: stories, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["admin", "pendingStories"],
    queryFn: getPendingStories,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">
            {t("stories.title")}
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            {t("stories.subtitle")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
          {t("refresh")}
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          <StoryRowSkeleton />
          <StoryRowSkeleton />
          <StoryRowSkeleton />
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
          <p className="text-neutral-500 mb-4">{t("stories.loadError")}</p>
          <Button onClick={() => refetch()} variant="outline">
            {t("tryAgain")}
          </Button>
        </div>
      ) : !stories || stories.length === 0 ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            {t("stories.noPending")}
          </h3>
          <p className="text-neutral-500">{t("stories.allReviewed")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Count */}
          <p className="text-sm text-neutral-500">
            {t("stories.count", { count: stories.length })}
          </p>

          {/* Story List */}
          {stories.map((story) => (
            <Link key={story.id} href={`/admin/stories/${story.id}`}>
              <div className="bg-white rounded-lg border border-neutral-200 p-4 hover:border-neutral-300 hover:shadow-sm transition-all">
                <div className="flex items-start gap-4">
                  <MediaTypeIcon story={story} />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-900 line-clamp-2">
                      {story.description || t("stories.noDescription")}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(story.createdAt)}
                      </span>
                    </div>
                  </div>

                  <StatusBadge status={story.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
