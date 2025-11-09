"use client";

import { cn } from "@/utils/css";
import { ChatMessageItem } from "@/components/chat-message";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { type ChatMessage, useRealtimeChat } from "@/hooks/use-realtime-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface RealtimeChatProps {
  roomName: string;
  username: string;
  onMessage?: (messages: ChatMessage[]) => void;
  messages?: ChatMessage[];
  readOnly?: boolean;
}

/**
 * Realtime chat component
 * @param roomName - The name of the room to join. Each room is a unique chat.
 * @param username - The username of the user
 * @param onMessage - The callback function to handle the messages. Useful if you want to store the messages in a database.
 * @param messages - The messages to display in the chat. Useful if you want to display messages from a database.
 * @param readOnly - If true, the user cannot send messages (view-only mode)
 * @returns The chat component
 */
export const RealtimeChat = ({
  roomName,
  username,
  onMessage,
  messages: initialMessages = [],
  readOnly = false,
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll();

  const {
    messages: realtimeMessages,
    sendMessage,
    isConnected,
  } = useRealtimeChat({
    roomName,
    username,
  });
  const [newMessage, setNewMessage] = useState("");

  // Merge realtime messages with initial messages
  const allMessages = useMemo(() => {
    const mergedMessages = [...initialMessages, ...realtimeMessages];
    // Remove duplicates based on message id
    const uniqueMessages = mergedMessages.filter(
      (message, index, self) =>
        index === self.findIndex((m) => m.id === message.id)
    );
    // Sort by creation date
    const sortedMessages = uniqueMessages.sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );

    return sortedMessages;
  }, [initialMessages, realtimeMessages]);

  // Only store NEW realtime messages (not initial messages from DB)
  useEffect(() => {
    if (onMessage && realtimeMessages.length > 0) {
      onMessage(realtimeMessages);
    }
  }, [realtimeMessages, onMessage]);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    scrollToBottom();
  }, [allMessages, scrollToBottom]);

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !isConnected) return;

      sendMessage(newMessage);
      setNewMessage("");
    },
    [newMessage, isConnected, sendMessage]
  );

  return (
    <div className="bg-background text-foreground flex h-full w-full flex-1 flex-col justify-between antialiased">
      {/* Messages */}
      <div
        ref={containerRef}
        className="space-y-4 overflow-y-auto p-4 [scrollbar-gutter:stable]"
      >
        {allMessages.length === 0 ? (
          <div className="text-muted-foreground text-center text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : null}
        <div className="space-y-1">
          {allMessages.map((message, index) => {
            const prevMessage = index > 0 ? allMessages[index - 1] : null;
            const showHeader =
              !prevMessage || prevMessage.user.name !== message.user.name;

            return (
              <div
                key={message.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-300"
              >
                <ChatMessageItem
                  message={message}
                  isOwnMessage={message.user.name === username}
                  showHeader={showHeader}
                />
              </div>
            );
          })}
        </div>
      </div>

      {!readOnly && (
        <form
          onSubmit={handleSendMessage}
          className="border-border flex w-full gap-2 border-t p-4"
        >
          <Input
            className={cn(
              "bg-background rounded-full text-sm transition-all duration-300",
              isConnected && newMessage.trim()
                ? "w-[calc(100%-36px)]"
                : "w-full"
            )}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={!isConnected}
          />
          {isConnected && newMessage.trim() && (
            <Button
              className="animate-in fade-in slide-in-from-right-4 aspect-square rounded-full duration-300"
              type="submit"
              disabled={!isConnected}
            >
              <Send className="size-4" />
            </Button>
          )}
        </form>
      )}
    </div>
  );
};
