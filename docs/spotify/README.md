# Spotify integration

Powers the now-playing strip in the blog footer and the `/music` page.

## What the Web API actually exposes

There is no listening-history endpoint. Three things are available, and the
`/music` page uses all three:

| Source                        | Scope                         | Window                                   |
| ----------------------------- | ----------------------------- | ---------------------------------------- |
| `me/player/currently-playing` | `user-read-currently-playing` | Right now                                |
| `me/player/recently-played`   | `user-read-recently-played`   | **The last 50 plays, and nothing older** |
| `me/top/{tracks,artists}`     | `user-top-read`               | ~4 weeks, ~6 months, ~1 year             |

The 50-play cap on `recently-played` is the important one. The `before` and
`after` cursors only paginate _inside_ that window: pass a `before` timestamp
older than the 50th-most-recent play and the response comes back empty. Fifty
tracks is roughly three hours of listening, so the page is showing a rolling
window, not an archive.

Going deeper than that means storing plays yourself (poll `recently-played` on a
schedule, dedupe on `played_at`) and backfilling from the GDPR
_extended streaming history_ export under Spotify's account privacy settings.
None of that exists here yet.

Since 2024-11-27, **Audio Features, Audio Analysis, Recommendations, Related
Artists and 30-second previews are unavailable** to apps registered after that
date and to existing apps still in development mode. Anything built on track
audio attributes needs extended quota access.

## Environment

```bash
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REFRESH_TOKEN=
SPOTIFY_AUTH_KEY=
```

The refresh token is a single long-lived token for one account (mine) — this is
a read-only public display, not per-visitor OAuth. The live token lives in
Upstash Redis under `spotify:refresh_token`. `SPOTIFY_REFRESH_TOKEN` only seeds
an empty store. `src/services/spotify/token.ts` holds the in-memory access
token cache and persists any replacement refresh token that Spotify sends back.
`SPOTIFY_AUTH_KEY` guards the re-authorization route below.

## Renewing without a redeploy

Refresh tokens expire six months after authorization, and only the consent
screen resets the clock. The fast path:

1. Register `https://tkhquang.dev/api/spotify/callback` as a redirect URI in
   the dashboard, once, next to the loopback one.
2. Open `https://tkhquang.dev/api/spotify/auth?key=<SPOTIFY_AUTH_KEY>`.
3. Approve. The callback checks the `state` value, confirms that the approving
   account is mine, and writes the new token to Redis.

No redeploy. The token service warns in the logs when fewer than 30 days
remain. The manual flow below still works and is the fallback when the store
and the seed are both empty.

## Minting a refresh token with the right scopes

A refresh token carries the scopes it was granted. The token that predates the
`/music` page only has `user-read-currently-playing`, so **`recently-played` and
`me/top` will return 403 until it is reissued.** The service logs the status and
body of any non-OK response and renders that section empty rather than failing
the route, so a 403 shows up as blank sections, not an error page.

1. In the [developer dashboard](https://developer.spotify.com/dashboard), add a
   redirect URI of `http://127.0.0.1:3000/callback`. Use the loopback IP —
   Spotify rejects `localhost` as insecure. (The dashboard sometimes displays
   it back as `localhost` after a refresh. Navigate away and return to see the
   saved value.)

2. Open this in a browser, substituting the client ID:

   ```text
   https://accounts.spotify.com/authorize?client_id=CLIENT_ID&response_type=code&redirect_uri=http%3A%2F%2F127.0.0.1%3A3000%2Fcallback&scope=user-read-currently-playing%20user-read-recently-played%20user-top-read
   ```

3. Approve. The browser lands on a dead `127.0.0.1` URL — nothing needs to be
   listening there. Copy the `code` query parameter out of the address bar.

4. Exchange it (bash, so Git Bash rather than PowerShell):

   ```bash
   CLIENT_ID=...
   CLIENT_SECRET=...
   CODE=...

   curl -X POST https://accounts.spotify.com/api/token \
     -H "Authorization: Basic $(printf '%s:%s' "$CLIENT_ID" "$CLIENT_SECRET" | base64 -w0)" \
     -d grant_type=authorization_code \
     -d code="$CODE" \
     -d redirect_uri=http://127.0.0.1:3000/callback
   ```

5. Put the `refresh_token` from the response into `SPOTIFY_REFRESH_TOKEN`,
   locally and in the Vercel project settings.

The authorization code is single-use and expires in about a minute, so step 4
follows step 3 immediately.

## Caching

`/music` is an ISR route that revalidates every 5 minutes. Within that, the two
top-item endpoints carry `next: { revalidate: 86400 }`, so a revalidation
usually only re-reads `recently-played`. In practice a cached entry dies with
the access token (~hourly), because Next keys the fetch cache on the
`Authorization` header. The now-playing hero is client-side against
`/api/spotify/current-playing`. It advances the progress bar locally, refetches
just after the expected end of the current track, and polls once a minute while
idle.
