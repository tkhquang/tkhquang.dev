---
title: "Wiring the Spotify Web API Into This Blog"
created_at: 2024-12-11T00:00:00.000Z
updated_at: 2026-08-30T00:00:00.000Z
published: true
category_slug: technical
tags:
  - Next.js
  - Spotify
  - OAuth
  - Web Development
cover_image: /uploads/images/blog/spotify-web-api-cover.webp
description: "Everything I had to work out to put my Spotify account on this blog: the auth flow, the four endpoints, and the caching."
---

I wanted one line in the footer of this blog: the song I am playing right now, linked to Spotify.

Small enough that I did not expect to learn anything from it, and the working version really did take an afternoon. Register an app, approve a consent screen once, cache a token for an hour, wrap four endpoints, render a component.

This is that afternoon in order, including the two or three places I went the wrong way. The Spotify Web API is small and the documentation is good. Almost everything that cost me time was something the docs are perfectly clear about and no tutorial bothers to repeat.

**All the code here is Next.js 16 with the App Router**, purely because that is what this site runs on. Nothing about the Spotify half needs it. Replace the route handler with whatever your framework calls one and everything else survives the move.

## You Are Not Building a Login

The first thing to get straight, because it decides the shape of everything after it, is that a "now playing" widget is not an authenticated feature.

There is exactly one user: you. Nobody signing in, no sessions, no per-visitor tokens. You authorize your own account once, keep the credential that falls out of it, and from then on your server reads your own listening data on behalf of every anonymous visitor who loads the page.

That is the Authorization Code flow used in a slightly unusual way. The flow is designed for "let this app read *your* account", run once per user. You are running it once, total, for yourself, and treating the result as a server secret.

Which means the integration splits cleanly in two, and the split is the whole point of this post:

<pre class="mermaid flex justify-center">
sequenceDiagram
    title One approval, then a loop that never needs you
    autonumber

    participant Y as You
    participant A as Spotify Accounts
    participant S as Your server
    participant W as Spotify API

    Y->>A: GET /authorize
    A-->>Y: Consent screen
    Y->>A: Approve the scopes
    A-->>Y: Redirect with ?code=
    Note over Y,A: By hand. Once per account, not once per visitor.
    Y->>A: POST /api/token
    A-->>Y: refresh_token, scope
    Y->>S: Into the environment

    loop Forever, with nobody watching
        S->>A: POST /api/token
        A-->>S: access_token, 1 hour
        S->>W: GET currently-playing
        W-->>S: The song
    end
</pre>

Steps 1 to 7 are a person in a browser clicking a button, once, ever. The loop underneath runs forever without you, and it is the only half most writeups describe, because it is the only half that looks like code.

Almost everything that surprised me later came from forgetting which half I was in.

## The Authorization You Do Once, By Hand

Register an app in the [developer dashboard](https://developer.spotify.com/dashboard). You get a client ID and a client secret.

Then add a redirect URI, and this is the first place a 2020 tutorial will waste your evening. It has to be a loopback IP:

```text
http://127.0.0.1:3000/callback
```

Not `localhost`. Spotify rejects the hostname as insecure, because resolving a name is one more thing that can be pointed somewhere you did not mean. The dashboard has an irritating habit of displaying your saved value back to you as `localhost` after a refresh, which makes you think it did not take. Navigate away and back and you will see what is actually stored.

Nothing needs to be listening on that port. The redirect is a place for the browser to land so you can read a query parameter out of the address bar.

Now visit the authorize URL with the scopes you want. Space separated, URL encoded:

```text title="one long line, in a browser"
https://accounts.spotify.com/authorize
  ?client_id=YOUR_CLIENT_ID
  &response_type=code
  &redirect_uri=http%3A%2F%2F127.0.0.1%3A3000%2Fcallback
  &scope=user-read-currently-playing%20user-read-recently-played%20user-top-read
  &show_dialog=true
```

`show_dialog=true` forces the consent screen even if you have approved this app before. You want that, because it is the only place you can actually see the list of permissions you are granting, and later in this post that list becomes load bearing.

Approve. The browser lands on a dead `127.0.0.1` page. Copy the `code` parameter out of the address bar and exchange it, immediately, because it is single use and expires in about a minute:

```bash title="exchange.sh"
CLIENT_ID=...
CLIENT_SECRET=...
CODE=...

curl -s -X POST https://accounts.spotify.com/api/token \
  -H "Authorization: Basic $(printf '%s:%s' "$CLIENT_ID" "$CLIENT_SECRET" | base64 -w0)" \
  -d grant_type=authorization_code \
  -d code="$CODE" \
  -d redirect_uri=http://127.0.0.1:3000/callback
```

The `redirect_uri` here is not where anything gets redirected. It is an equality check against the one you just used, and it has to match byte for byte, trailing slash included.

```json title="response, trimmed"
{
  "access_token": "BQC...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "AQD...",
  "scope": "user-read-currently-playing user-read-recently-played user-top-read"
}
```

Read the `scope` field before you do anything else. It is the only confirmation that you got what you asked for rather than what you already had, and checking it here is a great deal cheaper than working out why an endpoint returns 403 three weeks later.

The `refresh_token` is the thing you keep. Three environment variables and you are done:

```bash title=".env"
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REFRESH_TOKEN=
```

## The Only Module That Talks to Spotify

One module, marked so it can never reach a client bundle. `import "server-only"` throws at build time if it does, which matters more than it sounds like it does when the module holds a client secret.

The access token lives an hour, so cache it in module scope and refresh a minute early. On a serverless platform that cache lives as long as the instance does, which is not long, and that is fine. The worst case is one extra token request.

```ts title="src/services/spotify/index.ts"
import "server-only";

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

const basicAuth = Buffer.from(
  `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
).toString("base64");

let cachedAccessToken: string | null = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedAccessToken && Date.now() < tokenExpiry) {
    return cachedAccessToken;
  }

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
    }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error_description || "Spotify token refresh failed");
  }

  cachedAccessToken = json.access_token;
  tokenExpiry = Date.now() + (json.expires_in - 60) * 1000;

  return cachedAccessToken;
}
```

Everything else is a thin wrapper over that. The one decision worth making deliberately is what a failure does, and the answer is: not throw.

A page like this renders several independent sections from several independent endpoints. If one of them is unhappy, that section should be empty and the rest of the page should be fine. Throwing takes down the route, and on a statically generated page it takes down the build:

```ts title="src/services/spotify/index.ts"
async function fetchFromSpotify<T>(
  endpoint: string,
  revalidate: number
): Promise<T | null> {
  try {
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${await getAccessToken()}` },
      next: { revalidate },
    });

    if (!response.ok) {
      console.error(
        `Spotify ${endpoint} responded ${response.status}: ${await response.text()}`
      );
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`fetchFromSpotify(${endpoint}): `, error);
    return null;
  }
}
```

Log the status *and* the body. Spotify's error bodies are short and say exactly what is wrong, and the difference between a 403 that means "wrong scope" and a 400 that means "your credential is dead" is the difference between two very different afternoons.

Per fetch `revalidate` rather than `cache: "no-store"` is what keeps the route statically renderable. A `no-store` fetch opts the whole page into dynamic rendering, and then every visitor costs you a round trip to Spotify.

## What the Four Endpoints Actually Give You

Worth knowing before you design a page around them, because one of these is much smaller than its name suggests.

| Endpoint | Scope | What you get |
| --- | --- | --- |
| `me/player/currently-playing` | `user-read-currently-playing` | Player state right now |
| `me/player/recently-played` | `user-read-recently-played` | The last 50 plays. Not 51. |
| `me/top/tracks` | `user-top-read` | About 4 weeks, 6 months, 1 year |
| `me/top/artists` | `user-top-read` | The same three windows |

Three things surprised me here.

**There is no listening history endpoint.** [`recently-played`](https://developer.spotify.com/documentation/web-api/reference/get-recently-played) caps at the last 50 plays, and the `before` and `after` cursors only paginate *inside* that window. Hand it a `before` timestamp older than your fiftieth most recent play and you get an empty array. Fifty tracks is about three hours of listening. If you want an actual archive you have to poll this endpoint on a schedule and store the rows yourself, deduplicating on `played_at`, and backfill the past from the extended streaming history export under your account's privacy settings. The API will not give you last year.

**A paused track is not "nothing playing".** `currently-playing` answers `200` with `is_playing: false` and a full track object when something is loaded but paused. `204` with an empty body is reserved for a player with nothing in it at all. Treat `200` as "there is a track" and read `is_playing` separately, or your widget will insist you are listening to something you paused yesterday.

**A track only enters the history once it has been played.** The paused track above is not in `recently-played` at all, so `recentlyPlayed[0]` is the previous song, not the current one. They converge the moment the current one finishes. They are never the same question.

There is also a fourth thing, which is what you cannot build. Since [27 November 2024](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api), Audio Features, Audio Analysis, Recommendations, Related Artists and 30 second preview URLs are closed to apps registered after that date, and to existing apps still in development mode. Every "visualize your listening taste" post older than that is describing endpoints you cannot call. There is no danceability radar chart in your future.

## Getting It Onto the Page

Two of those endpoints are perfectly happy cached and two are not, and that difference decides the whole component layout.

Recently played and top items change slowly. A server component can call the service directly, and the page can be statically rendered with `revalidate`, so visitors pay nothing and Spotify sees one request every few minutes rather than one per visitor:

```tsx title="app/music/page.tsx"
export const revalidate = 300;

export default async function MusicPage() {
  const [recentlyPlayed, topTracks] = await Promise.all([
    getRecentlyPlayed(50),
    getTopTracks("short_term"),
  ]);

  return <TrackList items={recentlyPlayed} top={topTracks} />;
}
```

What is playing right now is the opposite. Cached for five minutes it is wrong for five minutes, and "now playing" is the one thing on the page that has to be true. That part needs a route handler and a client fetch:

```ts title="app/api/spotify/current-playing/route.ts"
export async function GET() {
  const data = await getNowPlaying();

  return NextResponse.json(data);
}
```

The client component polls it on mount, advances the progress bar locally with an interval rather than re-polling every second, and schedules its next fetch for just after the current track should end. One request per song instead of one per second.

That split is worth getting right before you write any markup, because the alternative is a dynamic page where every visitor triggers four calls to Spotify.

One trap on the way out, which I walked straight into. Since the server already has the recently played list, it is tempting to render `recentlyPlayed[0]` as the now playing card while the live fetch is in flight. Do not. Those are different questions: a track only enters the play history once it has finished, so while something is actually playing, `recentlyPlayed[0]` is the *previous* song. The server has no way to know which case it is in, so it confidently renders the wrong track, and a second later the client swaps it out from under whoever is reading. Render a skeleton and wait. Brief and empty beats fast and wrong.

## The Scopes Freeze When You Approve

I authorized with one scope, `user-read-currently-playing`, because a footer line was all I wanted and that was all it needed. An hour later I wanted a page of listening history as well, added the two endpoints that serve it, and got a wall of 403s.

My instinct was that the token needed refreshing. It did not. Look at what a refresh request actually contains:

```text
grant_type=refresh_token
refresh_token=...
```

There is no scope parameter, and there is nowhere to put one. A refresh exchanges a refresh token for an access token carrying **the scopes that were granted at authorization time**, and nothing else. The scope set is baked into the refresh token the moment you click approve, and the only way to change it is to send yourself back through the consent screen and mint a new one.

This is obvious in hindsight and completely invisible while it is happening, because the failure looks like an auth problem and the fix looks like an auth fix. I refreshed a perfectly healthy token several times before I read the request body properly.

## The Token Expires After Six Months

The last thing to sort out before shipping is what this does when it breaks, which is where I found something none of the guides I had been following could have mentioned, because it did not exist when they were written.

Spotify [announced refresh token expiration on 18 June 2026](https://developer.spotify.com/blog/2026-06-18-refresh-token-expiration). Refresh tokens issued on behalf of a user expire **six months after authorization**. New apps were subject to it immediately. Existing apps followed on **20 July 2026**, which means credentials minted in 2025 and working every day since simply stopped one Monday in July.

When it happens, the token endpoint answers `400` with this:

```json title="POST /api/token, grant_type=refresh_token"
{ "error": "invalid_grant", "error_description": "Refresh token revoked" }
```

Revoked, for a token nobody revoked. That is what an expiry looks like from the outside, and read without the announcement in hand it looks a lot like somebody got into your dashboard.

Three details decide how you have to build around it.

**The clock starts at authorization, not at last use.** Refreshing does not extend anything. A widget that refreshes an access token forty times a day for six months is exactly as expired on day 183 as one that never ran. The only thing that resets the six months is a human approving the consent screen again.

**It applies to the user flows only.** Authorization Code and Authorization Code with PKCE. Client Credentials is unaffected, because there is no user in it and no refresh token to expire. If your integration only needs public catalog data, none of this touches you.

**The signal is `invalid_grant`, and it is terminal.** Spotify's instruction is unambiguous: do not retry, discard the stored token, and send the user back through sign in. Retrying an `invalid_grant` in a loop is the one thing guaranteed not to work.

<pre class="mermaid flex justify-center">
graph TD
    A["You approve<br/>the six months start here"] --> B["Refresh token"];
    B --> C["Refresh, refresh, refresh<br/>as often as you like"];
    C -->|"does not extend anything"| B;
    B --> D["Month 6"];
    D --> E["invalid_grant<br/>on every refresh, forever"];
    E -->|"only a human can fix this"| A;

    classDef default fill:#282a36,stroke:#f8f8f2,stroke-width:2px,color:#f8f8f2;
    classDef good fill:#282a36,stroke:#50fa7b,stroke-width:2px,color:#50fa7b;
    classDef bad fill:#282a36,stroke:#ff5555,stroke-width:2px,color:#ff5555;
    class B,C,D default;
    class A good;
    class E bad;
</pre>

For a real app with real users this is a mild annoyance: you already have a sign in button, and this makes people press it twice a year. For the single user personal integration in this post it is worse, because the "user" is you, the sign in flow does not exist, and the failure mode is a widget that renders nothing while your logs fill with an error you are not reading.

So the honest summary is: **you cannot automate this away.** Somebody has to approve a consent screen every six months. What you can do is make that take fifteen seconds instead of an evening.

## Renewing It Without a Redeploy

The manual renewal is the same dance as the first time. Authorize URL, copy the code, curl the exchange, paste the new `refresh_token` into your environment, redeploy.

That works. It also means every six months you are digging a `base64 -w0` incantation out of a README, and if you did what I did and put the token in an environment variable, you cannot fix production from your phone.

The better shape moves two things. The token moves out of the environment and into somewhere writable, and the authorization moves into your own app as two small routes.

Start with the store. The environment variable becomes a seed rather than the source of truth:

```ts title="src/services/spotify/token.ts"
import "server-only";

import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const STORE_KEY = "spotify:refresh_token";

type StoredToken = { token: string; authorized_at: number };

export class SpotifyReauthRequired extends Error {}

/**
 * The env var seeds a fresh deployment. Once the callback has written to the
 * store, the store wins, so renewing never needs a redeploy.
 */
async function readStoredToken(): Promise<StoredToken | null> {
  const stored = await redis.get<StoredToken>(STORE_KEY);

  if (stored?.token) {
    return stored;
  }

  const seed = process.env.SPOTIFY_REFRESH_TOKEN;

  return seed ? { authorized_at: 0, token: seed } : null;
}

export async function storeToken(token: string) {
  // Spotify never tells you when a refresh token dies, so the authorization
  // time is only knowable if you write it down yourself.
  await redis.set(STORE_KEY, { authorized_at: Date.now(), token });
}
```

Then the refresh grows two branches it did not have before:

```ts title="src/services/spotify/token.ts"
export async function getAccessToken() {
  const stored = await readStoredToken();

  if (!stored) {
    throw new SpotifyReauthRequired("No refresh token stored");
  }

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: stored.token,
    }),
  });

  const json = await response.json();

  if (!response.ok) {
    // Terminal. Retrying this is the one thing that cannot help.
    if (json.error === "invalid_grant") {
      throw new SpotifyReauthRequired(json.error_description || json.error);
    }

    throw new Error(json.error_description || "Spotify token refresh failed");
  }

  // The response may carry a replacement. Persist it, or you keep presenting
  // a superseded token until the day it stops being accepted.
  if (json.refresh_token && json.refresh_token !== stored.token) {
    await redis.set(STORE_KEY, {
      authorized_at: stored.authorized_at,
      token: json.refresh_token,
    });
  }

  return json.access_token as string;
}
```

`SpotifyReauthRequired` being its own class is the point of the exercise. It is the difference between a log line that says "go and click the button" and one that says `400`.

Now the two routes. First, the one that sends you to Spotify:

```ts title="app/api/spotify/auth/route.ts"
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("key") !== process.env.SPOTIFY_AUTH_KEY) {
    return new NextResponse("Not found", { status: 404 });
  }

  const state = crypto.randomUUID();
  await redis.set(`spotify:state:${state}`, true, { ex: 600 });

  const url = new URL("https://accounts.spotify.com/authorize");
  url.searchParams.set("client_id", process.env.SPOTIFY_CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("scope", SCOPES.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("show_dialog", "true");

  return NextResponse.redirect(url);
}
```

And the callback that catches the code. This one needs two checks, and the second is easy to leave out:

```ts title="app/api/spotify/callback/route.ts"
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return new NextResponse("Missing code or state", { status: 400 });
  }

  // Single use, and it proves the round trip started at the guarded route.
  const known = await redis.getdel(`spotify:state:${state}`);

  if (!known) {
    return new NextResponse("Unknown state", { status: 400 });
  }

  const token = await exchangeAuthorizationCode(code);

  // The state check proves where the request started. It does not prove who
  // approved it. Without this, anybody who reaches the consent screen can
  // repoint the site at their own listening history.
  const profile = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  }).then((response) => response.json());

  if (profile.id !== process.env.SPOTIFY_USER_ID) {
    return new NextResponse("Wrong account", { status: 403 });
  }

  await storeToken(token.refresh_token);

  return new NextResponse("Reauthorized. Good for another six months.");
}
```

That account check is the part I would most expect to see missing in somebody else's version, because everything works without it. `state` is a CSRF defence. It says this browser started the flow here. It says nothing at all about whose Spotify account got approved at the other end, and the callback happily writes whatever refresh token comes back into the store your public site reads from.

Register `https://yoursite.dev/api/spotify/callback` as a second redirect URI alongside the loopback one and renewal becomes: open one guarded URL, approve, done. No terminal, no redeploy, no `base64 -w0`.

Since `authorized_at` is now recorded, you can also make the thing tell you before it dies rather than after. Spotify does not expose the expiry, so this is your own arithmetic against your own timestamp, but six months is six months:

```ts
const daysLeft = differenceInDays(
  addMonths(stored.authorized_at, 6),
  new Date()
);
```

Log it when it drops under thirty. A line in your build output beats an empty widget you notice in November.

## Caveats

**The human step is not removable.** Everything above shrinks the renewal from an evening to fifteen seconds. It does not delete it. Somebody approves a consent screen every six months, and if you want the thing to keep working while you are away from a keyboard for a year, the answer is that it will not.

**A store is not free.** Moving the token to Redis means every cold start now does a network read before it can do a network write, and it means one more service that can be down. For a footer widget that is a real cost against a real benefit, and the environment variable remains a perfectly reasonable answer if you would rather redeploy twice a year.

**Rate limits are unpublished.** Spotify's limit is [a rolling 30 second window](https://developer.spotify.com/documentation/web-api/concepts/rate-limits) and they do not publish the number, which varies with whether your app is in development mode or has extended quota. A 429 comes with a `Retry-After` in seconds. Nothing in this post comes close to it, but "nothing in this post" is not a design principle you can rely on once you start polling.

**Failing soft hides the failure.** Returning `null` from every endpoint is what keeps one bad scope from taking down a build, and it is also exactly what turns a dead credential into a blank space nobody investigates for six weeks. If you swallow the error, put something in the logs that a future you will actually recognise, because in six months a future you is precisely who is reading them.

---

None of this is hard. Register an app, approve a consent screen, cache a token, wrap four endpoints, render a component. An afternoon, as advertised.

What the afternoon does not tell you is the shape of the thing you have built. A widget reading one person's account is not a login, so the OAuth reflexes are all slightly wrong. The data is smaller than the endpoint names suggest, so the page you sketched may not be a page you can build. And the credential is closer to a session than a secret, so the integration has an expiry date whether or not you write one down.

The code is the short part. Working out which of those three you are looking at is the rest of it.

## TL;DR

- A personal Spotify widget is not a login. Authorize your own account once, keep the refresh token as a server secret, read your own data for every anonymous visitor.
- Redirect URIs must use `127.0.0.1`, not `localhost`. Nothing needs to listen on the port. The `redirect_uri` in the token exchange is an equality check, not a destination.
- Cache what changes slowly in a static page with `revalidate`, and put only "now playing" behind a route handler and a client fetch. Do not server render the last played track as a stand in for the current one: they are different questions, and you will render the wrong song.
- Scopes freeze at authorization. A refresh request has no scope parameter. Adding an endpoint later means going back through the consent screen and minting a new refresh token.
- Refresh tokens now expire six months after authorization, for new apps since 18 June 2026 and for existing apps since 20 July 2026. Refreshing does not extend the clock. Only re-approval does.
- The signal is `400` with `invalid_grant`. Do not retry it. Discard the token and re-authorize.
- There is no listening history API. `recently-played` is capped at the last 50 plays and the cursors do not page past it. An archive means polling and storing rows yourself.
- To renew without a redeploy: keep the refresh token in a writable store seeded by the env var, and add a guarded `/auth` route plus a `/callback` that verifies both `state` and that `me.id` is actually you.
- Log the response body, not just the status. `invalid_grant` and a 403 for a missing scope look identical from the outside and mean completely different things.
