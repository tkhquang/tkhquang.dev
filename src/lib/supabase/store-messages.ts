import { ChatMessage } from "@/hooks/use-realtime-chat";
import { createClient } from "@/lib/supabase/client";

// Keep track of which messages have been stored
const storedMessageIds = new Set<string>();

export const storeMessages = async (
  roomId: string,
  userId: string,
  messages: ChatMessage[]
) => {
  const supabase = createClient();

  if (!messages.length) {
    return;
  }

  // Filter out messages that have already been stored
  const newMessages = messages.filter(
    (message) => !storedMessageIds.has(message.id)
  );

  if (!newMessages.length) {
    return;
  }

  const { error } = await supabase.from("messages").upsert(
    newMessages.map((message) => ({
      id: message.id,
      content: message.content,
      username: message.user.name,
      created_at: message.createdAt,
      user_id: userId,
      room: roomId,
    })),
    { onConflict: "id" }
  );

  if (error) {
    console.error("Error storing messages:", error);
  } else {
    // Mark messages as stored
    newMessages.forEach((message) => storedMessageIds.add(message.id));
    console.log(`Stored ${newMessages.length} new message(s)`);
  }
};
