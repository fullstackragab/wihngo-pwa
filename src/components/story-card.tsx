"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle, Play } from "lucide-react";
import { Story, STORY_MOODS } from "@/types/story";
import { Card } from "./ui/card";

interface StoryCardProps {
  story: Story;
}

export function StoryCard({ story }: StoryCardProps) {
  const mood = story.mode
    ? STORY_MOODS.find((m) => m.value === story.mode)
    : null;

  const hasVideo = !!story.videoUrl || !!story.videoS3Key;
  const hasImage = !!story.imageUrl || !!story.imageS3Key;
  const hasMedia = hasVideo || hasImage;

  return (
    <Link href={`/story/${story.storyId}`}>
      <Card variant="outlined" padding="none" className="overflow-hidden hover:border-primary/30 transition-colors">
        {hasMedia && (
          <div className="relative aspect-video bg-gray-100">
            {hasVideo ? (
              <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Play className="w-6 h-6 text-white fill-white" />
                </div>
              </div>
            ) : story.imageUrl ? (
              <Image
                src={story.imageUrl}
                alt=""
                fill
                className="object-cover"
              />
            ) : null}
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            {story.birds.map((birdName, i) => (
              <span
                key={i}
                className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full"
              >
                {birdName}
              </span>
            ))}
            {mood && (
              <span className="text-sm" title={mood.label}>
                {mood.emoji}
              </span>
            )}
          </div>
          <p className="text-gray-700 line-clamp-3 mb-3">{story.preview}</p>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{story.date}</span>
            <div className="flex items-center gap-4">
              {story.likeCount !== undefined && (
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{story.likeCount}</span>
                </div>
              )}
              {story.commentCount !== undefined && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{story.commentCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
