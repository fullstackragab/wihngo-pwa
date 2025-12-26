"use client";

import { useState } from "react";
import { TopBar } from "./top-bar";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { Camera, Video } from "lucide-react";

interface UploadFlowProps {
  onBack: () => void;
  onComplete: () => void;
  userBirds: Array<{ id: string; name: string; species: string }>;
}

export function UploadFlow({ onBack, onComplete, userBirds }: UploadFlowProps) {
  const [step, setStep] = useState<"select" | "upload">("select");
  const [selectedBird, setSelectedBird] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [mediaType, setMediaType] = useState<"photo" | "video">("photo");

  if (step === "select") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar title="Share a Moment" onBack={onBack} />

        <div className="max-w-lg mx-auto p-4 space-y-6">
          <Card className="p-6 space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-foreground font-medium">Choose a bird</h3>
              <p className="text-sm text-muted-foreground">
                Share a special moment with the community
              </p>
            </div>

            {userBirds.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <p className="text-muted-foreground">
                  You haven&apos;t created a bird profile yet.
                </p>
                <Button
                  onClick={onBack}
                  variant="outline"
                >
                  Go to Profile
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {userBirds.map((bird) => (
                  <button
                    key={bird.id}
                    onClick={() => {
                      setSelectedBird(bird.id);
                      setStep("upload");
                    }}
                    className="w-full p-4 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-all text-left"
                  >
                    <p className="font-medium text-foreground">{bird.name}</p>
                    <p className="text-sm text-muted-foreground">{bird.species}</p>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title="Share a Moment" onBack={() => setStep("select")} />

      <div className="max-w-lg mx-auto p-4 space-y-6">
        <Card className="p-6 space-y-6">
          {/* Media type selection */}
          <div className="space-y-3">
            <label className="text-foreground font-medium">Type</label>
            <div className="flex gap-3">
              <button
                onClick={() => setMediaType("photo")}
                className={`flex-1 p-4 rounded-lg border transition-all ${
                  mediaType === "photo"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Camera className={`w-6 h-6 mx-auto mb-2 ${mediaType === "photo" ? "text-primary" : "text-muted-foreground"}`} />
                <p className={`text-sm text-center ${mediaType === "photo" ? "text-primary" : "text-muted-foreground"}`}>
                  Photo
                </p>
              </button>

              <button
                onClick={() => setMediaType("video")}
                className={`flex-1 p-4 rounded-lg border transition-all ${
                  mediaType === "video"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Video className={`w-6 h-6 mx-auto mb-2 ${mediaType === "video" ? "text-primary" : "text-muted-foreground"}`} />
                <p className={`text-sm text-center ${mediaType === "video" ? "text-primary" : "text-muted-foreground"}`}>
                  Video
                </p>
              </button>
            </div>
          </div>

          {/* Upload placeholder */}
          <div className="space-y-2">
            <label className="text-foreground font-medium">
              {mediaType === "photo" ? "Photo" : "Video"}
            </label>
            <div className="aspect-square rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center">
              <div className="text-center space-y-2 p-6">
                {mediaType === "photo" ? (
                  <Camera className="w-12 h-12 mx-auto text-muted-foreground" />
                ) : (
                  <Video className="w-12 h-12 mx-auto text-muted-foreground" />
                )}
                <p className="text-sm text-muted-foreground">
                  Tap to {mediaType === "photo" ? "upload photo" : "record video"}
                </p>
                {mediaType === "video" && (
                  <p className="text-xs text-muted-foreground">
                    Videos can be up to 60 seconds
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <label htmlFor="caption" className="text-foreground font-medium">
              Caption
            </label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Share what makes this moment special..."
              className="resize-none"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              This helps keep Wihngo running smoothly for everyone.
            </p>
          </div>

          <Button
            onClick={onComplete}
            disabled={!caption}
            className="w-full"
          >
            Share Moment
          </Button>
        </Card>
      </div>
    </div>
  );
}
