"use client";

import { Heart, Bird } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import Image from "next/image";

interface FeedCardProps {
  moment: {
    id: string;
    birdName: string;
    birdSpecies: string;
    caption: string;
    mediaUrl: string;
    mediaType: "photo" | "video";
    birdId: string;
  };
  onBirdClick: (birdId: string) => void;
  onSupportClick: (birdId: string, birdName: string) => void;
}

export function FeedCard({ moment, onBirdClick, onSupportClick }: FeedCardProps) {
  return (
    <Card className="overflow-hidden border-border/50 shadow-sm mb-4">
      {/* Bird header */}
      <button 
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-accent/30 transition-colors w-full text-left"
        onClick={() => onBirdClick(moment.birdId)}
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Bird className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">{moment.birdName}</p>
          <p className="text-sm text-muted-foreground">{moment.birdSpecies}</p>
        </div>
      </button>

      {/* Media */}
      <div className="relative aspect-square bg-muted">
        {moment.mediaType === "photo" ? (
          <Image
            src={moment.mediaUrl}
            alt={moment.caption || "Moment"}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <video
            src={moment.mediaUrl}
            className="w-full h-full object-cover"
            controls
            playsInline
          />
        )}
      </div>

      {/* Caption and actions */}
      <div className="p-4 space-y-3">
        <p className="text-foreground leading-relaxed">{moment.caption}</p>
        
        <Button
          onClick={() => onSupportClick(moment.birdId, moment.birdName)}
          className="w-full"
        >
          <Heart className="w-4 h-4" />
          Support {moment.birdName}
        </Button>
      </div>
    </Card>
  );
}
