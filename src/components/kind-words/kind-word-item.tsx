"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, UserX } from "lucide-react";
import type { KindWord } from "@/types/kind-word";

interface KindWordItemProps {
  kindWord: KindWord;
  canDelete: boolean;
  isOwner?: boolean;
  onDelete?: (id: string) => void;
  onBlockUser?: (userId: string) => void;
  isDeleting?: boolean;
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 604800)}w ago`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function KindWordItem({
  kindWord,
  canDelete,
  isOwner = false,
  onDelete,
  onBlockUser,
  isDeleting,
}: KindWordItemProps) {
  const showOwnerMenu = isOwner && (onDelete || onBlockUser);
  const showSimpleDelete = canDelete && !isOwner && onDelete;

  return (
    <div className="flex gap-3 py-3">
      <Avatar className="size-8 shrink-0">
        {kindWord.authorAvatarUrl && (
          <AvatarImage src={kindWord.authorAvatarUrl} alt={kindWord.authorName} />
        )}
        <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
          {getInitials(kindWord.authorName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {kindWord.authorName}
          </span>
          <span className="text-xs text-muted-foreground">
            {getRelativeTime(kindWord.createdAt)}
          </span>
        </div>
        <p className="text-sm text-foreground mt-0.5 break-words">
          {kindWord.text}
        </p>
      </div>

      {/* Owner dropdown menu with more actions */}
      {showOwnerMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground"
              disabled={isDeleting}
              aria-label="More actions"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(kindWord.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            )}
            {onDelete && onBlockUser && <DropdownMenuSeparator />}
            {onBlockUser && (
              <DropdownMenuItem
                onClick={() => onBlockUser(kindWord.authorUserId)}
              >
                <UserX className="size-4" />
                Block user
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Simple delete button for non-owners who can delete their own */}
      {showSimpleDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(kindWord.id)}
          disabled={isDeleting}
          aria-label="Delete kind word"
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </div>
  );
}
