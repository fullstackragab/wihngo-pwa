"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBird, updateBird, updateBirdSupportSettings } from "@/services/bird.service";
import { uploadFile } from "@/services/api-helper";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { LoadingScreen } from "@/components/ui/loading";
import { ArrowLeft, Camera, Heart } from "lucide-react";
import Image from "next/image";
import { IMAGE_CONFIG } from "@/lib/config";

export default function EditBirdPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const birdId = params.birdId as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [age, setAge] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [supportEnabled, setSupportEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: bird, isLoading } = useQuery({
    queryKey: ["bird", birdId],
    queryFn: () => getBird(birdId),
    enabled: !!birdId && isAuthenticated,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      species: string;
      description?: string;
      location?: string;
      age?: string;
      imageS3Key?: string;
    }) => {
      return updateBird(birdId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bird", birdId] });
      queryClient.invalidateQueries({ queryKey: ["myBirds"] });
      router.back();
    },
  });

  const supportToggleMutation = useMutation({
    mutationFn: (enabled: boolean) => updateBirdSupportSettings(birdId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bird", birdId] });
    },
  });

  // Populate form when bird data loads
  useEffect(() => {
    if (bird) {
      setName(bird.name || "");
      setSpecies(bird.species || "");
      setDescription(bird.description || "");
      setLocation(bird.location || "");
      setAge(bird.age || "");
      setSupportEnabled(bird.supportEnabled !== false);
    }
  }, [bird]);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!bird) {
    return (
      <div className="min-h-screen-safe flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Bird not found</p>
          <Button onClick={() => router.push("/profile/my-birds")}>
            Back to My Birds
          </Button>
        </div>
      </div>
    );
  }

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!IMAGE_CONFIG.allowedTypes.includes(file.type)) {
      setError("Please select a valid image (JPEG, PNG, or WebP)");
      return;
    }

    if (file.size > IMAGE_CONFIG.maxSizeBytes) {
      setError(`Image must be smaller than ${IMAGE_CONFIG.maxSizeBytes / 1024 / 1024}MB`);
      return;
    }

    setError(null);
    setSelectedImage(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (!species.trim()) {
      setError("Species is required");
      return;
    }

    try {
      let imageS3Key = bird.imageS3Key;

      // Upload new image if selected
      if (selectedImage) {
        const uploadResult = await uploadFile<{ s3Key: string; url: string }>(
          `birds/${birdId}/image`,
          selectedImage,
          "file"
        );
        imageS3Key = uploadResult.s3Key;
      }

      await updateMutation.mutateAsync({
        name: name.trim(),
        species: species.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        age: age.trim() || undefined,
        imageS3Key,
      });
    } catch (err) {
      console.error("Failed to update bird:", err);
      setError(err instanceof Error ? err.message : "Failed to save changes");
    }
  };

  const handleSupportToggle = (enabled: boolean) => {
    setSupportEnabled(enabled);
    supportToggleMutation.mutate(enabled);
  };

  const currentImage = imagePreview || bird.imageUrl;

  return (
    <div className="min-h-screen-safe bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4 pt-safe sticky top-0 z-40">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-muted-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Edit {bird.name}</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 pb-safe">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bird Image */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div
                className="relative w-32 h-32 rounded-2xl overflow-hidden bg-muted cursor-pointer"
                onClick={handleImageClick}
              >
                {currentImage ? (
                  <Image
                    src={currentImage}
                    alt={bird?.name || "Bird"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                    <span className="text-4xl">🐦</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleImageClick}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={handleImageClick}
              className="text-sm text-primary hover:underline"
            >
              Change photo
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-xl text-center">
              {error}
            </div>
          )}

          {/* Form Fields */}
          <Card variant="outlined" padding="md">
            <div className="space-y-4">
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bird's name"
                required
              />
              <Input
                label="Species"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                placeholder="e.g., Canary, Parakeet"
                required
              />
              <Input
                label="Age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g., 2 years, Young"
              />
              <Input
                label="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Cairo, Egypt"
              />
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Story / Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell people about this bird..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all resize-none text-foreground placeholder:text-muted-foreground"
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {description.length}/2000
                </p>
              </div>
            </div>
          </Card>

          {/* Support Settings */}
          <Card variant="outlined" padding="md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Accept Support</p>
                  <p className="text-sm text-muted-foreground">
                    Allow people to send support for this bird
                  </p>
                </div>
              </div>
              <Switch
                checked={supportEnabled}
                onCheckedChange={handleSupportToggle}
                disabled={supportToggleMutation.isPending}
              />
            </div>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            fullWidth
            isLoading={updateMutation.isPending}
          >
            Save Changes
          </Button>
        </form>
      </main>
    </div>
  );
}
