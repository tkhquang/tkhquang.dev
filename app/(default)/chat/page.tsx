"use client";

import { ChatJoin, User } from "@/components/chat-join";
import { createClient } from "@/lib/supabase/client";
import { Activity, useEffect, useState } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { UserMenu } from "@/components/auth/user-menu";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { RealtimeChat } from "@/components/realtime-chat";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

interface MessageType {
  id: string;
  content: string;
  username: string;
  created_at: string;
}

const ROOM_NAME = "content-dump";

export const GeneralChat = () => {
  const supabase = createClient();
  const [messages, setMessages] = useState<MessageType[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setAuthUser(user);
      setAuthLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("room", ROOM_NAME)
          .order("created_at", { ascending: true })
          .limit(100);

        if (error) {
          console.error("Error fetching messages:", error);
        } else {
          setMessages(data);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMessages();
  }, [supabase]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="mt-header-height flex flex-1 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Convert Supabase user to our User type
  const user: User | null = authUser
    ? {
        id: authUser.id,
        username:
          authUser.user_metadata?.username ||
          authUser.email?.split("@")[0] ||
          "User",
        full_name: authUser.user_metadata?.full_name || "",
        profile_url: authUser.user_metadata?.profile_url || "",
      }
    : null;

  return (
    <div className="mt-header-height mb-2 flex flex-1 flex-col">
      <Activity mode={isLoading ? "visible" : "hidden"}>
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-muted-foreground">Loading chat...</div>
        </div>
      </Activity>
      <Activity mode={!isLoading ? "visible" : "hidden"}>
        {authUser && user ? (
          <>
            <div className="mx-auto w-full md:w-200">
              <UserMenu user={authUser} />
            </div>
            <div className="mx-auto flex w-full flex-1 flex-col items-center justify-center md:w-200">
              <ChatJoin
                user={user}
                roomId={ROOM_NAME}
                messages={messages?.map((message) => ({
                  id: message.id,
                  content: message.content,
                  user: { name: message.username },
                  createdAt: message.created_at,
                }))}
              />
            </div>
          </>
        ) : (
          <>
            {/* Show read-only chat for non-authenticated users */}
            <div className="bg-muted/30 border-b p-4">
              <div className="mx-auto max-w-4xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-lg font-semibold">
                      #{ROOM_NAME} - Public Chat
                    </h1>
                    <p className="text-muted-foreground text-sm">
                      Sign in to participate in the conversation
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowAuthDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Button>
                </div>
              </div>
            </div>
            <div className="mx-auto flex w-full flex-1 flex-col items-center justify-center md:w-200">
              <RealtimeChat
                roomName={ROOM_NAME}
                username="Anonymous"
                messages={messages?.map((message) => ({
                  id: message.id,
                  content: message.content,
                  user: { name: message.username },
                  createdAt: message.created_at,
                }))}
                readOnly={true}
              />
            </div>

            {/* Auth Dialog */}
            <Dialog
              open={showAuthDialog}
              onOpenChange={setShowAuthDialog}
              title="Welcome to the Chat"
              description="Sign in or create an account to start chatting"
            >
              <AuthForm onSuccess={() => setShowAuthDialog(false)} />
            </Dialog>
          </>
        )}
      </Activity>
    </div>
  );
};

export default GeneralChat;
