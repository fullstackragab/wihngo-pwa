"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStory,
  getStoryComments,
  likeStory,
  unlikeStory,
  addComment,
} from "@/services/story.service";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingScreen, LoadingSpinner } from "@/components/ui/loading";
import { STORY_MOODS } from "@/types/story";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  Send,
  Play,
  Volume2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function StoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const storyId = params.id as string;

  const [comment, setComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);

  const { data: story, isLoading } = useQuery({
    queryKey: ["story", storyId],
    queryFn: () => getStory(storyId),
    enabled: !!storyId && isAuthenticated,
  });

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ["storyComments", storyId],
    queryFn: () => getStoryComments(storyId),
    enabled: !!storyId && isAuthenticated,
  });

  const likeMutation = useMutation({
    mutationFn: () => (isLiked ? unlikeStory(storyId) : likeStory(storyId)),
    onSuccess: () => {
      setIsLiked(!isLiked);
      queryClient.invalidateQueries({ queryKey: ["story", storyId] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => addComment(storyId, content),
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["storyComments", storyId] });
      queryClient.invalidateQueries({ queryKey: ["story", storyId] });
    },
  });

  if (!isAuthenticated) {
    router.push("/auth/login");
    return null;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!story) {
    return (
      <div className="min-h-screen-safe flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Story not found</p>
          <Button onClick={() => router.push("/stories")}>View Stories</Button>
        </div>
      </div>
    );
  }

  const mood = story.mode
    ? STORY_MOODS.find((m) => m.value === story.mode)
    : null;

  const hasVideo = !!story.videoUrl;
  const hasImage = !!story.imageUrl;
  const hasAudio = !!story.audioUrl;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Story about ${story.birds.map((b) => b.name).join(", ")}`,
          text: story.content.slice(0, 100),
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      commentMutation.mutate(comment.trim());
    }
  };

  return (
    <div className="min-h-screen-safe bg-white pb-20">
      {/* Header */}
      <header className="px-4 py-4 pt-safe border-b border-gray-100 sticky top-0 bg-white z-40">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <button onClick={handleShare} className="p-2 -mr-2">
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Media */}
      {(hasVideo || hasImage) && (
        <div className="relative aspect-video bg-gray-100">
          {hasVideo ? (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <video
                src={story.videoUrl!}
                controls
                className="w-full h-full object-contain"
                poster={story.imageUrl || undefined}
              />
            </div>
          ) : hasImage ? (
            <Image
              src={story.imageUrl!}
              alt="Story image"
              fill
              className="object-cover"
            />
          ) : null}
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-6">
        {/* Author & Birds */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-medium">
            {story.author.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-900">{story.author.name}</p>
            <p className="text-sm text-gray-500">
              {new Date(story.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Birds */}
        <div className="flex flex-wrap gap-2 mb-4">
          {story.birds.map((bird) => (
            <Link key={bird.birdId} href={`/bird/${bird.birdId}`}>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {bird.imageUrl && (
                  <Image
                    src={bird.imageUrl}
                    alt={bird.name}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                )}
                {bird.name}
              </span>
            </Link>
          ))}
          {mood && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm">
              {mood.emoji} {mood.label}
            </span>
          )}
        </div>

        {/* Audio Player */}
        {hasAudio && (
          <Card variant="outlined" className="mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-primary" />
            </div>
            <audio src={story.audioUrl!} controls className="flex-1 h-8" />
          </Card>
        )}

        {/* Story Content */}
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap mb-6">
          {story.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-6 py-4 border-y border-gray-100 mb-6">
          <button
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            className="flex items-center gap-2"
          >
            <Heart
              className={`w-6 h-6 transition-colors ${
                isLiked ? "text-heart-red fill-heart-red" : "text-gray-400"
              }`}
            />
            <span className="text-gray-600">{story.likeCount || 0}</span>
          </button>
          <div className="flex items-center gap-2 text-gray-400">
            <MessageCircle className="w-6 h-6" />
            <span className="text-gray-600">{story.commentCount || 0}</span>
          </div>
        </div>

        {/* Comments */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Comments</h3>

          {/* Comment Input */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
            <Button
              type="submit"
              disabled={!comment.trim() || commentMutation.isPending}
              className="px-4"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>

          {/* Comments List */}
          {commentsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : !comments || comments.length === 0 ? (
            <Card variant="outlined" className="text-center py-8">
              <p className="text-gray-500">No comments yet</p>
              <p className="text-sm text-gray-400">Be the first to comment!</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {comments.map((c) => (
                <div key={c.commentId} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-medium flex-shrink-0">
                    {c.userName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">
                        {c.userName}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm mt-1">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
