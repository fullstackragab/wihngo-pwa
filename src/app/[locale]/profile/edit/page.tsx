"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, User, Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { updateProfile, uploadProfileImage } from "@/services/user.service";
import { IMAGE_CONFIG } from "@/lib/config";

export default function EditProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading, updateUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setBio(user.bio || "");
    }
  }, [user]);

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

  if (authLoading || !isAuthenticated || !user) {
    return null;
  }

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!IMAGE_CONFIG.allowedTypes.includes(file.type)) {
      setError("Please select a valid image (JPEG, PNG, or WebP)");
      return;
    }

    // Validate file size
    if (file.size > IMAGE_CONFIG.maxSizeBytes) {
      setError(`Image must be smaller than ${IMAGE_CONFIG.maxSizeBytes / 1024 / 1024}MB`);
      return;
    }

    setError(null);
    setSelectedImage(file);

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      let profileImageUrl = user.profileImageUrl;

      // Upload new image if selected
      if (selectedImage) {
        const uploadResult = await uploadProfileImage(selectedImage);
        profileImageUrl = uploadResult.url;

        // Update profile with new image S3 key
        await updateProfile({
          name,
          bio,
          profileImageS3Key: uploadResult.s3Key,
        });
      } else {
        // Just update name and bio
        await updateProfile({ name, bio });
      }

      // Update local user state
      updateUser({ ...user, name, bio, profileImageUrl });
      router.back();
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen-safe bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4 pt-safe sticky top-0 z-40">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-muted-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Edit Profile</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 pb-safe">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Image */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div
                className="relative w-24 h-24 rounded-full overflow-hidden bg-muted cursor-pointer"
                onClick={handleImageClick}
              >
                {imagePreview || user.profileImageUrl ? (
                  <Image
                    src={imagePreview || user.profileImageUrl || ""}
                    alt={user.name || "User"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary">
                    <User className="w-12 h-12 text-white" />
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
                placeholder="Your name"
                required
              />
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all resize-none text-foreground placeholder:text-muted-foreground"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {bio.length}/500
                </p>
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <Button type="submit" fullWidth isLoading={isSaving}>
            Save Changes
          </Button>
        </form>
      </main>
    </div>
  );
}
