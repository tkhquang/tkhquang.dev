"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon } from "lucide-react";
import { useState } from "react";

interface UserMenuProps {
  user: {
    email?: string;
    user_metadata?: {
      username?: string;
      full_name?: string;
    };
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    window.location.reload();
  };

  const displayName =
    user.user_metadata?.username ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "User";

  return (
    <div className="flex items-center gap-2 border-b p-4">
      <div className="flex flex-1 items-center gap-2">
        <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full">
          <UserIcon className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{displayName}</span>
          <span className="text-muted-foreground text-xs">{user.email}</span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        disabled={isLoading}
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
