# Real-Time Chat Implementation Guide

Complete guide for the Supabase-powered real-time chat application with authentication.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Supabase Setup](#supabase-setup)
4. [Troubleshooting](#troubleshooting)
5. [Future Enhancements](#future-enhancements)

---

## Quick Start

### Prerequisites
- Supabase account
- Node.js and pnpm installed
- Next.js project running

### Setup Steps

1. **Create Supabase Project**
   - Go to [Supabase](https://supabase.com)
   - Create a new project
   - Save your project URL and anon key

2. **Set Environment Variables**
   ```bash
   # .env.local
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Run Database Setup**
   - Go to Supabase SQL Editor
   - Copy and run the SQL from [Database Schema](#database-schema) section below

4. **Test the Chat**
   ```bash
   pnpm dev
   ```
   - Navigate to `/chat`
   - Sign up for an account
   - Start chatting!

---

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Supabase (PostgreSQL + Realtime + Auth)
- **UI**: Tailwind CSS, Radix UI (shadcn/ui)
- **Real-time**: Supabase Realtime Broadcast (WebSocket)

### Key Components

```
app/(default)/chat/page.tsx          # Main chat page
src/components/
  ├── realtime-chat.tsx              # Chat UI component
  ├── chat-join.tsx                  # Database integration wrapper
  ├── chat-message.tsx               # Individual message component
  └── auth/
      ├── auth-form.tsx              # Sign up/Sign in form
      └── user-menu.tsx              # User menu with sign out
src/hooks/
  ├── use-realtime-chat.tsx          # Realtime chat hook (WebSocket)
  └── use-chat-scroll.tsx            # Auto-scroll hook
src/lib/supabase/
  ├── client.ts                      # Browser Supabase client
  ├── server.ts                      # Server Supabase client
  ├── middleware.ts                  # Middleware Supabase client
  └── store-messages.ts              # Message persistence logic
```

### Data Flow

1. **Page Load**:
   - Fetch latest messages from database
   - Check user authentication status
   - Connect to Supabase Realtime channel

2. **Send Message**:
   - Broadcast message via WebSocket
   - Store message in database
   - All connected clients receive update

3. **Receive Message**:
   - WebSocket receives broadcast
   - Update local state
   - Auto-scroll to latest message

---

## Supabase Setup

### Database Schema

Run this SQL in your Supabase SQL Editor:

```sql
-- ============================================
-- 1. MESSAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  username TEXT NOT NULL,
  user_id TEXT NOT NULL,
  room TEXT NOT NULL DEFAULT 'content-dump',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS messages_room_created_at_idx
  ON public.messages(room, created_at DESC);

CREATE INDEX IF NOT EXISTS messages_user_id_idx
  ON public.messages(user_id);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read messages"
  ON public.messages
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert messages"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own messages"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own messages"
  ON public.messages
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at_trigger ON public.profiles;
CREATE TRIGGER update_profiles_updated_at_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- ============================================
-- 3. ENABLE REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### Authentication Setup

Supabase Auth is enabled by default. The application uses:
- **Email/Password** authentication
- **Row Level Security (RLS)** for data access control
- **Automatic profile creation** via database trigger

---

## Troubleshooting

### Error: "new row violates row-level security policy"

**Cause**: RLS policy using `USING` clause instead of `WITH CHECK` for INSERT operations.

**Fix**: Run the SQL from [Database Schema](#database-schema) section. The key difference:

```sql
-- ❌ WRONG (uses USING for INSERT)
CREATE POLICY "..." FOR INSERT USING (auth.uid()::text = user_id);

-- ✅ CORRECT (uses WITH CHECK for INSERT)
CREATE POLICY "..." FOR INSERT TO authenticated WITH CHECK (true);
```

**Why**: `USING` checks existing rows (for SELECT/UPDATE/DELETE), but INSERT has no existing rows to check.

### Error: "public.profiles does not exist"

**Cause**: Missing profiles table required by Supabase Auth.

**Fix**: Run the profiles table creation SQL from [Database Schema](#database-schema) section.

### Messages not appearing

1. Check browser console for errors
2. Verify environment variables are set
3. Check Supabase logs in dashboard
4. Ensure Realtime is enabled for messages table

### Realtime not working

1. Verify WebSocket connection in browser network tab
2. Check if Realtime is enabled: `ALTER PUBLICATION supabase_realtime ADD TABLE messages;`
3. Ensure you're subscribed to correct channel

---

## Future Enhancements

### Multiple Chat Rooms

Currently hardcoded to "content-dump" room. To add multiple rooms:

1. **Update UI** to show room selector
2. **Update routing** to `/chat/[roomId]`
3. **Filter messages** by room in database query
4. **Subscribe** to room-specific channels

Example:
```tsx
const { data } = await supabase
  .from("messages")
  .select("*")
  .eq("room", roomId)  // Filter by room
  .order("created_at", { ascending: true });
```

### Message Features

- **Edit messages**: Add edit functionality with UPDATE policy
- **Delete messages**: Add delete button with DELETE policy
- **Message reactions**: Add reactions table with foreign key to messages
- **File uploads**: Integrate Supabase Storage for images/files
- **Typing indicators**: Use Realtime presence feature
- **Read receipts**: Track message read status per user

### User Features

- **User profiles**: Display avatar, bio, status
- **Online status**: Use Supabase Realtime presence
- **@mentions**: Parse and highlight username mentions
- **DMs**: Add private messaging with user-to-user rooms

### Performance

- **Pagination**: Load messages in batches (currently limited to 100)
- **Virtual scrolling**: For very long message lists
- **Message caching**: Store recent messages in localStorage
- **Optimistic updates**: Show message immediately, sync in background

---

## Security Considerations

✅ **Current Setup**:
- Row Level Security enabled on all tables
- Public read access (anyone can view messages)
- Authenticated write access (must be logged in to send)
- User ownership validation (can only edit/delete own messages)

⚠️ **Production Recommendations**:
1. Enable email verification
2. Add rate limiting for message sends
3. Implement content moderation
4. Add spam detection
5. Set up monitoring and alerts
6. Regular security audits

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Questions?** Check the [Supabase Discord](https://discord.supabase.com) or [GitHub Discussions](https://github.com/supabase/supabase/discussions).
