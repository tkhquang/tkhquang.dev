"use client";

import { RealtimeChat } from "./realtime-chat";
import { ChatMessage } from "@/hooks/use-realtime-chat";
import { storeMessages } from "@/lib/supabase/store-messages";

export interface User {
  id: string;
  full_name: string;
  username: string;
  profile_url: string;
}

export const ChatJoin = ({
  roomId,
  messages,
  user,
}: {
  roomId: string;
  messages?: ChatMessage[];
  user: User;
}) => {
  const handleOnMessage = async (messages: ChatMessage[]) => {
    await storeMessages(roomId, user.id, messages);
  };

  return (
    <RealtimeChat
      roomName={roomId}
      username={user.username}
      messages={messages}
      onMessage={handleOnMessage}
    />
  );
};
