"use client";

import { useState } from "react";
import { TopBar } from "./top-bar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";

interface CreateBirdProfileProps {
  onBack: () => void;
  onCreate: (bird: {
    name: string;
    species: string;
    description: string;
    walletAddress: string;
  }) => void;
}

export function CreateBirdProfile({ onBack, onCreate }: CreateBirdProfileProps) {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [description, setDescription] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  const handleSubmit = () => {
    if (name && species && description && walletAddress) {
      onCreate({ name, species, description, walletAddress });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title="Add Bird" onBack={onBack} />

      <div className="max-w-lg mx-auto p-4 space-y-6">
        <div className="space-y-2">
          <h2 className="text-foreground text-xl font-medium">Create Bird Profile</h2>
          <p className="text-muted-foreground">
            Share your bird&apos;s story with the community
          </p>
        </div>

        <Card className="p-6 space-y-5">
          {/* Photo upload placeholder */}
          <div className="space-y-2">
            <label className="text-foreground font-medium">Photo</label>
            <div className="aspect-square rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center">
              <div className="text-center space-y-2 p-6">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🐦</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tap to upload photo
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="name" className="text-foreground font-medium">
              Name
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your bird's name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="species" className="text-foreground font-medium">
              Species
            </label>
            <Input
              id="species"
              type="text"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              placeholder="e.g. Parakeet, Canary, Cockatiel"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-foreground font-medium">
              About
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about your bird's personality, needs, or story..."
              className="resize-none"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="wallet" className="text-foreground font-medium">
              USDC Wallet Address
            </label>
            <Input
              id="wallet"
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Your Solana wallet address"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              This is where support payments will be sent. Make sure it&apos;s a valid Solana address that accepts USDC.
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!name || !species || !description || !walletAddress}
            className="w-full"
          >
            Create Profile
          </Button>
        </Card>
      </div>
    </div>
  );
}
