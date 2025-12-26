"use client";

import { TopBar } from "./top-bar";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Bird, Heart, DollarSign } from "lucide-react";
import Image from "next/image";

interface BirdProfileProps {
  bird: {
    id: string;
    name: string;
    species: string;
    description: string;
    imageUrl: string;
    totalSupport: number;
    ownerId: string;
  };
  moments: Array<{
    id: string;
    caption: string;
    mediaUrl: string;
    mediaType: "photo" | "video";
    createdAt: string;
  }>;
  onBack: () => void;
  onSupport: (birdId: string, birdName: string) => void;
}

export function BirdProfile({ bird, moments, onBack, onSupport }: BirdProfileProps) {
  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title={bird.name} onBack={onBack} />
      
      <div className="max-w-lg mx-auto">
        {/* Hero Image */}
        <div className="aspect-square bg-muted relative">
          <Image
            src={bird.imageUrl}
            alt={bird.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        <div className="p-4 space-y-6">
          {/* Bird Info */}
          <Card className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <h2 className="text-foreground text-xl font-medium">{bird.name}</h2>
                <p className="text-muted-foreground">{bird.species}</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-full">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="font-medium text-primary">{bird.totalSupport}</span>
              </div>
            </div>

            <p className="text-foreground leading-relaxed">
              {bird.description}
            </p>

            <Button
              onClick={() => onSupport(bird.id, bird.name)}
              className="w-full"
            >
              <Heart className="w-4 h-4" />
              Support {bird.name}
            </Button>
          </Card>

          {/* Moments */}
          <section className="space-y-3">
            <h3 className="text-foreground font-medium">Moments</h3>
            
            {moments.length === 0 ? (
              <Card className="p-8 text-center space-y-3">
                <Bird className="w-12 h-12 mx-auto text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-foreground">No moments yet</p>
                  <p className="text-sm text-muted-foreground">
                    Check back soon for updates
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {moments.map((moment) => (
                  <div key={moment.id} className="aspect-square rounded-lg overflow-hidden bg-muted relative">
                    {moment.mediaType === "photo" ? (
                      <Image
                        src={moment.mediaUrl}
                        alt={moment.caption}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <video
                        src={moment.mediaUrl}
                        className="w-full h-full object-cover"
                        playsInline
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
