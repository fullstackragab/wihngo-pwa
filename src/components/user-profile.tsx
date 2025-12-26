"use client";

import { TopBar } from "./top-bar";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Bird, Heart, Settings, LogOut, Info } from "lucide-react";
import Image from "next/image";

interface UserProfileProps {
  onBack: () => void;
  onCreateBird: () => void;
  onViewBird: (birdId: string) => void;
  onViewPrinciples: () => void;
  onViewFees: () => void;
  onLogout: () => void;
  userBirds: Array<{
    id: string;
    name: string;
    species: string;
    imageUrl: string;
    totalSupport: number;
  }>;
  supportHistory: Array<{
    id: string;
    birdName: string;
    amount: number;
    createdAt: string;
  }>;
}

export function UserProfile({
  onBack,
  onCreateBird,
  onViewBird,
  onViewPrinciples,
  onViewFees,
  onLogout,
  userBirds,
  supportHistory,
}: UserProfileProps) {
  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title="Profile" onBack={onBack} />

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* My Birds */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-foreground font-medium">My Birds</h3>
            <Button
              onClick={onCreateBird}
              size="sm"
            >
              Add Bird
            </Button>
          </div>

          {userBirds.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <Bird className="w-12 h-12 mx-auto text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-foreground">No birds yet</p>
                <p className="text-sm text-muted-foreground">
                  Create a profile to share your bird&apos;s story
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {userBirds.map((bird) => (
                <button
                  key={bird.id}
                  onClick={() => onViewBird(bird.id)}
                  className="text-left"
                >
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-square bg-muted relative">
                      <Image
                        src={bird.imageUrl}
                        alt={bird.name || "Bird"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="p-3 space-y-1">
                      <p className="font-medium text-foreground truncate">
                        {bird.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ${bird.totalSupport} received
                      </p>
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Support History */}
        <section className="space-y-3">
          <h3 className="text-foreground font-medium">My Support</h3>

          {supportHistory.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <Heart className="w-12 h-12 mx-auto text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-foreground">No support sent yet</p>
                <p className="text-sm text-muted-foreground">
                  Start supporting birds in the community
                </p>
              </div>
            </Card>
          ) : (
            <Card className="divide-y divide-border">
              {supportHistory.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {transaction.birdName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-medium text-primary">
                    ${transaction.amount}
                  </p>
                </div>
              ))}
            </Card>
          )}
        </section>

        {/* Settings & Info */}
        <section className="space-y-2">
          <Button
            onClick={onViewPrinciples}
            variant="outline"
            className="w-full justify-start"
          >
            <Info className="w-4 h-4 mr-3" />
            Our Principles
          </Button>

          <Button
            onClick={onViewFees}
            variant="outline"
            className="w-full justify-start"
          >
            <Settings className="w-4 h-4 mr-3" />
            How Fees Work
          </Button>

          <Button
            onClick={onLogout}
            variant="outline"
            className="w-full justify-start"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Log Out
          </Button>
        </section>
      </div>
    </div>
  );
}
