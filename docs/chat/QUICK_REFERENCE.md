# Chat Implementation - Quick Reference

## Environment Setup

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Database Tables

### Messages Table
```sql
messages (
  id UUID PRIMARY KEY,
  content TEXT NOT NULL,
  username TEXT NOT NULL,
  user_id TEXT NOT NULL,
  room TEXT DEFAULT 'content-dump',
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### Profiles Table
```sql
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

## RLS Policies

### Messages
- **SELECT**: Anyone can read (public)
- **INSERT**: Authenticated users only
- **UPDATE**: Owner only (`auth.uid()::text = user_id`)
- **DELETE**: Owner only (`auth.uid()::text = user_id`)

### Profiles
- **SELECT**: Anyone can read (public)
- **INSERT**: Authenticated users (own profile)
- **UPDATE**: Owner only (`auth.uid() = id`)

## Key Files

```
app/(default)/chat/page.tsx              # Main page
src/components/realtime-chat.tsx         # Chat UI
src/hooks/use-realtime-chat.tsx          # WebSocket logic
src/lib/supabase/store-messages.ts       # DB persistence
```

## Common Operations

### Fetch Messages
```typescript
const { data } = await supabase
  .from("messages")
  .select("*")
  .eq("room", "content-dump")
  .order("created_at", { ascending: true })
  .limit(100);
```

### Subscribe to Realtime
```typescript
const channel = supabase.channel('room-name')
  .on('broadcast', { event: 'message' }, (payload) => {
    // Handle message
  })
  .subscribe();
```

### Send Message
```typescript
await channel.send({
  type: 'broadcast',
  event: 'message',
  payload: { id, content, user, createdAt }
});
```

### Store Message
```typescript
await supabase.from("messages").upsert({
  id,
  content,
  username,
  user_id,
  room,
  created_at
});
```

## Troubleshooting

### RLS Error
If you see "new row violates row-level security policy":
- Ensure INSERT policies use `WITH CHECK`, not `USING`
- Check user is authenticated
- Verify `user_id` matches `auth.uid()`

### Messages Not Saving
- Check `onMessage` only receives new messages (not initial DB load)
- Verify RLS policies allow INSERT
- Check console for errors

### Realtime Not Working
- Enable Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE messages;`
- Check WebSocket connection in Network tab
- Verify channel subscription status

## Production Checklist

- [ ] Enable email verification
- [ ] Add rate limiting
- [ ] Implement content moderation
- [ ] Set up monitoring
- [ ] Add error tracking
- [ ] Configure CORS properly
- [ ] Set up backup strategy
- [ ] Review RLS policies
- [ ] Test with multiple users
- [ ] Load testing

## Useful SQL Queries

### Check Policies
```sql
SELECT * FROM pg_policies WHERE tablename = 'messages';
```

### View Recent Messages
```sql
SELECT * FROM messages
ORDER BY created_at DESC
LIMIT 10;
```

### Count Messages by Room
```sql
SELECT room, COUNT(*)
FROM messages
GROUP BY room;
```

### Delete Old Messages
```sql
DELETE FROM messages
WHERE created_at < NOW() - INTERVAL '30 days';
```
