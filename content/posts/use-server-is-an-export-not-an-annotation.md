---
title: '"use server" Is an Export, Not an Annotation'
created_at: 2025-12-28T00:00:00.000Z
updated_at: ""
published: true
category_slug: technical
tags:
  - Next.js
  - React
  - Server Actions
  - RSC
  - Security
  - Web Development
cover_image: /uploads/images/blog/use-server-cover.webp
description: "It does not mean runs on the server. It means every export becomes an HTTP endpoint, and mine handed 31 private repos to a bare curl."
---

There's a line I had been writing at the top of data-access modules for a long time, on the understanding that it meant "this code runs on the server":

```ts
"use server";
```

It doesn't mean that. It means "compile every export in this file that the build reaches into an HTTP endpoint that anybody on the internet can call". The framework had been doing exactly that, faithfully, the entire time.

The module in question fetched a list of GitHub repositories, private ones included, and handed them to a server component that filtered the private ones out before rendering. No client component imported it. No form posted to it. As far as I was concerned it was a file that talked to an API, and the directive was a label saying so.

**All the code here is Next.js 16 with Turbopack**, purely because that's what this site runs on. The directive itself is a React feature, but the machinery that decides which functions become reachable, and from where, belongs to the framework, so the specifics below are Next's specifics.

## The Routing Table You Didn't Know You Were Writing

Every build writes a file called `server-reference-manifest.json`. It's not a debug artifact or a cache. It's the routing table: every function the framework is willing to invoke over HTTP, keyed by an opaque id.

```json title=".next/server/server-reference-manifest.json, trimmed"
{
  "node": {
    "7fb62550e78ca8a0590fa170e89580c2bd4b3b8f2b": {
      "workers": { "app/(default)/page": "...", "...": "..." }
    }
  },
  "encryptionKey": "..."
}
```

An id and a running server is the entire calling convention. There's no client library involved, no token to acquire, no handshake. You set a header and you post.

```bash
curl -X POST http://localhost:3999/ \
  -H 'Next-Action: 7fb62550e78ca8a0590fa170e89580c2bd4b3b8f2b' \
  -H 'Content-Type: text/plain;charset=UTF-8' --data '[]'
```

```text title="response"
status=200  bytes=35489  content-type=text/x-component
"isPrivate":true occurrences: 31
```

Thirty-one private repositories out of sixty-two, with names, descriptions and URLs, over a request carrying no cookie, no session and nothing resembling a check. Some of them belonged to organizations rather than to me, because the query asked for everything I had access to, which is how a small personal embarrassment becomes somebody else's incident.

I sat with that terminal output for a while.

The lesson generalizes past my particular file. If a module has that directive, its exports are public the moment the build reaches them from a page. Not "public if a client imports them". Public.

## How It Gets There

Nobody decides this. That's the part worth sitting with, because a decision can be reviewed and a habit cannot.

```bash
$ git log --format='%h %ad %s' --date=short \
    -S'"use server"' -- <the four files>

882be34 2025-06-16 feat: create resume page
b8fc26a 2025-06-10 perf: do not use nextjs blur placeholder
f84ed99 2025-06-08 feat(blog): add spotify status
```

Three unrelated features in eight days. The directive landed on the GitHub module in the commit that added *Spotify* status, and on a Puppeteer helper in the commit that added a *resume page*, which is to say it traveled the way a file header travels: by being at the top of a file somebody copied. The oldest of those modules had existed for six months without it and worked fine.

So the bug isn't a misunderstanding of server actions. I never thought about server actions at all. I thought I was labeling a file, and a label is the one thing this directive is not.

## Four Things I Assumed

Having found it, I wanted the shape of the problem before I touched it. Most of what I assumed was wrong, and the corrections turned out to be more useful than the bug.

### "It only matters if a client component imports the function"

This is the mental model the [documentation's examples](https://react.dev/reference/rsc/use-server) encourage, and it's why the mistake survives review. No client component imports the module, therefore nothing can call it.

The manifest doesn't care who imports what. It is written from what the *build* reached. A server component merely importing one of these functions is enough to put it in the table, at which point it is reachable by anybody who can produce its id. A client-side import is how you *use* an action ergonomically. It has never been what makes an action callable.

### "It is bound to the page that uses it"

Each manifest entry lists workers, and mine listed the two pages that actually call the function. That reads like a scope. Post the id at some unrelated route and surely it misses.

```text title="one id, three routes"
POST /        status=200 bytes=35489  private data: 31 rows
POST /blog    status=200 bytes=35489  private data: 31 rows
POST /resume  status=200 bytes=35489  private data: 31 rows
```

Byte for byte identical, including at routes that don't import the module and never will. The workers map tells the framework where to *forward* a request, not where to refuse one. Every route on the deployment is an equally good front door.

<pre class="mermaid flex justify-center">
graph TD
    R1["POST /"] --> M["Global manifest lookup<br/>one table per deployment"];
    R2["POST /blog"] --> M;
    R3["POST /resume<br/>never imports the module"] --> M;
    M -->|"forwards to a worker<br/>that imported it,<br/>never refuses"| FN["Your function"];
    FN --> OUT["Same 35489 bytes<br/>at every door"];

    classDef default fill:#282a36,stroke:#f8f8f2,stroke-width:2px,color:#f8f8f2;
    classDef bad fill:#282a36,stroke:#ff5555,stroke-width:2px,color:#ff5555;
    class R1,R2,R3,M default;
    class FN,OUT bad;
</pre>

### "The ids are unguessable because the salt is per build"

They are unguessable, which is a genuine barrier, but not for the reason I assumed. The salt isn't minted per build. It's written to disk and reused:

```js title="next/dist/server/app-render/encryption-utils-server.js"
const EXPIRATION = 1000 * 60 * 60 * 24 * 14 // 14 days
```

The key lives in `.next/cache`, it's byte-identical to the `encryptionKey` in the manifest, and it only rotates at build time once it has expired. A rebuild inside those 14 days produces the *same* ids. I confirmed it the boring way: rebuilt hours later, got the same ids back.

Two things follow. `.next/cache` is the directory every deployment platform tries hardest to preserve between builds, so "the ids change when I redeploy" isn't something to lean on. And if you have taken [the self-hosting advice](https://nextjs.org/docs/app/guides/self-hosting) and pinned the encryption key to an environment variable, you have deliberately made them stable forever, for good reasons that don't stop applying because of this.

The salt is a decent lock on a door that shouldn't exist. Worth knowing it's decent. Not worth calling it the fix.

### "Filtering the result before rendering was protecting it"

The private records were removed in the component, after the call, on the way to the screen. That is the correct place to filter for *rendering* and no place at all to filter for *access*, because a caller with the id never reaches the component. It calls the function and reads what the function returns.

<pre class="mermaid flex justify-center">
graph TD
    subgraph PAGE["The path I checked"]
        SC["Server component"] --> FN1["Your function"];
        FN1 -->|"62 repos, 31 private"| FIL["Render filter<br/>drops isPrivate"];
        FIL -->|"31 public rows"| PG["The page,<br/>which looks right"];
    end
    subgraph WIRE["The path that exists"]
        HC["Anybody with the id"] -->|"POST, Next-Action"| FN2["Your function"];
        FN2 -->|"62 repos, 31 private"| RESP["The response<br/>no component, no filter"];
    end

    classDef default fill:#282a36,stroke:#f8f8f2,stroke-width:2px,color:#f8f8f2;
    classDef bad fill:#282a36,stroke:#ff5555,stroke-width:2px,color:#ff5555;
    classDef good fill:#282a36,stroke:#50fa7b,stroke-width:2px,color:#50fa7b;
    class SC,FN1,FN2 default;
    class FIL,PG good;
    class HC,RESP bad;
</pre>

This is the assumption I would most expect to find in somebody else's codebase, because it doesn't look like an assumption. It looks like the feature working. Every private record is absent from the page, which is exactly what you set out to achieve, and the check you actually performed was "does the page look right".

## The Fix, Which Is One Line

There's a package whose entire job is to be the thing I thought the directive was.

```diff
-"use server";
+import "server-only";
```

[`server-only`](https://www.npmjs.com/package/server-only) throws at build time if the module ends up in a client bundle. It has no runtime, it registers nothing, and it makes no promises about HTTP because it has never heard of HTTP. It marks a boundary in the module graph, which is the only thing I ever wanted marked.

It wasn't in my `package.json`. I had been writing my own version of a guarantee I had never installed.

<pre class="mermaid flex justify-center">
graph TD
    subgraph BEFORE["With the directive"]
        S1["Server component"] --> A1["Your function"];
        C1["Any HTTP client"] -->|"POST, Next-Action id"| A1;
        A1 --> G1["Upstream API<br/>public and private data"];
    end
    G1 ~~~ S2
    subgraph AFTER["Directive removed, server-only in its place"]
        S2["Server component"] --> A2["Your function"];
        C2["Any HTTP client"] -.->|"404, no entry<br/>in the table"| A2;
        A2 --> G2["Upstream API<br/>public and private data"];
    end

    classDef default fill:#282a36,stroke:#f8f8f2,stroke-width:2px,color:#f8f8f2;
    classDef bad fill:#282a36,stroke:#ff5555,stroke-width:2px,color:#ff5555;
    classDef good fill:#282a36,stroke:#50fa7b,stroke-width:2px,color:#50fa7b;
    class S1,S2,G1,G2 default;
    class C1,A1 bad;
    class C2,A2 good;
</pre>

The same measurement, either side of the change:

```text title="before"
ids in server-reference-manifest.json:  3
POST / with the id:                     200, 35489 bytes, text/x-component
```

<br />

```text title="after"
ids in server-reference-manifest.json:  0
POST / with the id:                     404, 24 bytes, x-nextjs-action-not-found: 1
```

Every page still renders the same data. A server component calling a function it imported was never affected by whether the framework was also willing to expose that function over HTTP. It never had been. That was the whole problem.

## Three Things This Doesn't Fix

**It's not a framework bug.** The directive is documented and does what it documents. The gap is between what `"use server"` says out loud and what a tired person reads it as at the top of a data-access file. I would still rather it were called something else, and that's a complaint about naming, not about behavior.

**One boundary is one boundary.** `server-only` stops a module reaching the client bundle. It authorizes nothing and rate limits nothing, and it wouldn't have helped at all had I genuinely needed those functions callable from a form. The moment you want a real action, the authorization check belongs inside it, because the endpoint exists the instant the function does.

**The logs won't raise it for you.** When an id misses, the framework warns rather than errors, and the comment beside that path notes that a deployment without skew protection is expected to hit it occasionally. Somebody walking ids produces log noise indistinguishable from a user on a stale tab.

## The Check I Wasn't Doing

The fix took one line, repeated across four files, and a dependency. The interesting part was never the fix.

Every individual step here was reasonable. Marking a data-access module as server-side is a good instinct. Filtering private records before rendering them is correct. Reusing a header line across three files in a week is how anybody works under deadline. The exposure lived in the space between a directive's name and its behavior, and it survived a year of me reading that file, because reading it was precisely what confirmed the mistake: there it is, first line, on the server, good.

So the thing I'm taking from it isn't really about this directive. It is that "I checked, and it says what I expect" and "I checked, and it does what I expect" are different checks, and only the second one makes you go and look at what the build produced. The manifest had been sitting there the whole time with the answer in it.

```bash
jq '.node | keys' .next/server/server-reference-manifest.json
```

If that list is longer than the number of server actions you deliberately wrote, you have some reading to do.

## TL;DR

- `"use server"` is not a placement note. It compiles every export the build reaches into a publicly callable HTTP endpoint, listed in `server-reference-manifest.json`.
- Calling one takes a POST and a `Next-Action` header. No cookie, no session, no client import, and any route on the deployment will answer.
- Filtering in the component protects the page, not the data. A caller with the id never reaches the component.
- The ids are unguessable, but the salt is cached in `.next/cache` for 14 days at a time, so they survive rebuilds. A lock on a door that shouldn't exist.
- If you meant "this module is server-side", you meant `import "server-only"`. The directive is for functions you want callable, and those need their own authorization checks.
- The audit is one line: `jq '.node | keys'` against the manifest. The right number of entries is the number of actions you wrote on purpose.
