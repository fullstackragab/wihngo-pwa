"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingScreen } from "@/components/ui/loading";
import {
  User,
  Settings,
  Heart,
  Bird,
  BookOpen,
  LogOut,
  ChevronRight,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const menuItems = [
    { href: "/profile/loved-birds", icon: Heart, label: "Loved Birds", color: "text-heart-red" },
    { href: "/profile/my-birds", icon: Bird, label: "My Birds", color: "text-secondary" },
    { href: "/profile/my-stories", icon: BookOpen, label: "My Stories", color: "text-primary" },
    { href: "/profile/wallet", icon: Wallet, label: "Wallet & Payments", color: "text-support-green" },
    { href: "/settings", icon: Settings, label: "Settings", color: "text-gray-600" },
  ];

  return (
    <div className="min-h-screen-safe bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white px-4 py-6 pt-safe">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100">
              {user.profileImageUrl ? (
                <Image
                  src={user.profileImageUrl}
                  alt={user.name || "User"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary">
                  <User className="w-10 h-10 text-white" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-500">{user.email}</p>
            </div>
          </div>
          {user.bio && (
            <p className="mt-4 text-gray-600">{user.bio}</p>
          )}
          <Link href="/profile/edit">
            <Button variant="outline" size="sm" className="mt-4">
              Edit Profile
            </Button>
          </Link>
        </div>
      </header>

      {/* Menu */}
      <main className="max-w-lg mx-auto px-4 py-6">
        <Card padding="none">
          {menuItems.map((item, index) => (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center justify-between px-4 py-3.5 ${
                  index !== menuItems.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <span className="font-medium text-gray-900">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Link>
          ))}
        </Card>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full mt-6 flex items-center justify-center gap-2 py-3 text-red-500 font-medium"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </main>

      <BottomNav />
    </div>
  );
}
