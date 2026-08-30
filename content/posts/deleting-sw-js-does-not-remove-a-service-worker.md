---
title: Deleting sw.js Does Not Remove a Service Worker
created_at: 2021-12-19T00:00:00.000Z
updated_at: ""
published: true
category_slug: technical
tags:
  - Web Development
  - JavaScript
  - Ljóss
cover_image: /uploads/images/blog/sw-destroyer-cover.webp
description: "Today I learned: Only another service worker at the same URL can retire the old one."
---

Last week I deleted five characters from `gridsome.config.js`. The site's `siteUrl` had been building itself as `` `${process.env.GRIDSOME_SITE_URL}/blog` `` since March 2020, and it stopped being true in August 2020.

Sixteen months is a long time for a fossil to sit in a config file.

It is a leftover from an arrangement I had stopped thinking about. For the first five months of its life this blog was not a site. It was a subdirectory of a different site, proxied in. Deleting the fossil sent me back to the commits from the night that arrangement ended, and there are three of them, two with the same one-line message, and a fix I did not understand at the time.

**All of this is Gridsome, Gatsby and Netlify**, purely because that is what I was running in 2020. The part worth keeping is not the stack.

## The blog lived inside another site's scope

`tkhquang.dev` used to serve a Gatsby site out of a different repo. One line of its config mattered more than anything else I wrote that year:

```js title="gatsby-config.js, the old site"
  'gatsby-plugin-offline',
```

That is a PWA. Workbox precaches an offline shell, and Gatsby registers the worker for every visitor over HTTPS.

Every visitor. Not every visitor who installed it.

I had been telling myself this only hit people who added the site to a home screen, and that is my memory being generous to me. `gatsby-plugin-manifest` is why the site *could* be installed. It has nothing to do with who received the worker.

The same commit that added the offline plugin also created the old site's redirects:

```text title="static/_redirects, the old site, trimmed"
/blog/*     https://tkhquang-blog.netlify.app/blog/:splat     200!
```

A `200!` in Netlify is a forced rewrite, not a redirect. This blog was served through the old site's origin, which put it inside that worker's scope three days before I started writing it.

In August I pointed the domain here and stopped deploying the Gatsby site. Devices that had been to the old site kept showing me the old site.

## Deleting the file does nothing

You would think removing the file is enough. No more `sw.js`, no more service worker.

It isn't, and it never has been.

A failed update is treated as *the update failed*, not as *the worker is gone*. The Update algorithm drops the registration only "if newestWorker is null", and mine was not null. It was the thing causing the problem.

The specification does not name 404 in those steps. A missing script is a non-ok response: the job rejects with a TypeError and the existing worker stays. The working group was asked to treat 404 and 410 as unregister, in an issue titled "Update algorithm should unregister SW on 404 and 410 errors", and closed it `wontfix`. Chromium has done the same since service workers shipped in Chrome 40.

<pre class="mermaid flex justify-center">
graph TD
    subgraph ASSUMED["What I assumed deleting it did"]
        D1["Stop shipping sw.js"] --> R1["/sw.js returns 404"];
        R1 --> G1["Registration removed,<br/>everyone gets the new site"];
    end
    subgraph REAL["What actually happens"]
        D2["Stop shipping sw.js"] --> R2["/sw.js returns 404"];
        R2 --> F2["Update fails with a TypeError"];
        F2 --> K2["newestWorker is not null,<br/>so the registration stays"];
        K2 --> S2["Old worker keeps answering<br/>out of its own cache"];
    end

    classDef default fill:#282a36,stroke:#f8f8f2,stroke-width:2px,color:#f8f8f2;
    classDef good fill:#282a36,stroke:#50fa7b,stroke-width:2px,color:#50fa7b;
    classDef bad fill:#282a36,stroke:#ff5555,stroke-width:2px,color:#ff5555;
    class D1,R1,D2,R2 default;
    class G1 good;
    class F2,K2,S2 bad;
</pre>

I could have deleted that file and waited forever.

## Right code, wrong place

The first attempt, at 00:35, put the unregistration in the Vue layout:

```js title="e9c1a8d, src/layouts/Default.vue"
if (window.navigator && navigator.serviceWorker) {
  window.navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      if (registrations.length > 0) {
        Promise.all(registrations.map((r) => r.unregister())).then(() =>
          window.location.reload()
        );
      }
    });
}
```

That code is correct. It is also in the one place it cannot help.

It sits in `created()` behind `if (process.isClient)`, so it needs the new page and the new bundle to boot, which is precisely what the old worker was preventing. The people who needed rescuing were the people who could not receive the rescuer.

I think that is why it failed. I can prove the shape of the trap. I cannot prove nobody was rescued by it, and it would have worked fine for any device whose `/` had already fallen out of cache.

## Right place, wrong code

Fifty-three minutes later I commented that block out and created `static/sw.js`. Same commit message as the last one, merged through a pull request that was open for seven seconds.

I had worked out *where* the fix had to go. Then I pasted the page code into it:

```js title="538d4f9, static/sw.js"
if (window.navigator && navigator.serviceWorker) {
  window.navigator.serviceWorker.getRegistrations().then((registrations) => {
    if (registrations.length > 0) {
      Promise.all(registrations.map((r) => r.unregister())).then(() =>
        window.location.reload()
      );
    }
  });
}
```

A service worker runs in `ServiceWorkerGlobalScope`, where `window` does not exist. It is the first identifier in the file, so the script throws `ReferenceError` on evaluation and never installs.

The file is impossible in more ways than that. `navigator` does exist in a worker, but it is a `WorkerNavigator`. In 2020 that object had no `serviceWorker` property in the browsers that mattered here. Some engines expose it now; it still would not have saved this file. `location.reload` does not exist there either.

Three of the five lines could not work. Only the bare `window` got the chance to say so.

For what it is worth, this changed nothing rather than breaking something. Before it, `/sw.js` returned a 404. After it, `/sw.js` threw. Same branch of the same algorithm, same outcome.

## The one URL the cache never answered

Just under twenty-one hours later, `static/sw.js` became this:

```js title="9cf501b, static/sw.js"
self.addEventListener("install", function (e) {
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  self.registration
    .unregister()
    .then(function () {
      return self.clients.matchAll();
    })
    .then(function (clients) {
      clients.forEach((client) => client.navigate(client.url));
    });
});
```

The reason this works is the thing I actually came away with, and it is not about the code.

A cache-first worker owns every URL on the origin except one. The browser fetches the worker's own script with `service-workers` mode set to `"none"`, so the update check bypasses the worker's `fetch` handler and goes to the server. That check runs on an in-scope navigation, including one the worker is about to answer from its own cache, and on stale functional events. It does not run on every subresource.

So while a device sat there being served a site I had stopped deploying, it was also asking Netlify for `/sw.js` on every visit and being told 404.

The channel was open the whole time. It was carrying nothing.

<pre class="mermaid flex justify-center">
sequenceDiagram
    title The recovery, once something is at that URL
    autonumber

    participant B as Browser
    participant W as Old Gatsby worker
    participant N as Netlify

    B->>W: Navigation for /
    W-->>B: Precached shell, no network involved
    B->>N: GET /sw.js (Service-Worker: script)
    N-->>B: 200, and the bytes differ
    Note over B: A byte-different script is a new worker
    B->>B: install: skipWaiting()
    B->>B: activate: registration.unregister()
    B->>B: clients.navigate(client.url)
    B->>N: GET /
    N-->>B: The site that actually exists
</pre>

`skipWaiting()` is load-bearing, not decoration. Without it the new worker installs and parks in `waiting` behind the old one, which is still controlling the page, and nothing happens. A refresh is often not enough: the old client overlaps the new navigation.

The other half of why it works is a coincidence I did not choose. `gatsby-plugin-offline` defaults its `swDest` to `public/sw.js`, and the old site passed no options to say otherwise, so the old registration's script URL was `/sw.js`. The automatic update check always refetches that URL. A registration can only be replaced that way by a script at the same URL, and the URL I guessed is the URL the plugin happened to use.

A loaded page, DevTools, or Clear site data could still have unregistered it. None of that is available to a client the old worker will not let reach the new site.

Had the old site put its worker anywhere else, that file would have been inert and I would have gone to bed thinking I had fixed something.

The fix was right. My reason for it was not.

## Known gaps

**Cache Storage survives.** The old `gatsby-plugin-offline` cache is still sitting in the origin's storage on any device that had it. Nothing reads it once no worker has a `fetch` handler, so it is wasted disk until quota eviction rather than a staleness bug, but it is not cleaned up and I did not think about it.

**The activate handler never calls `event.waitUntil()`.** The browser is formally allowed to kill the worker mid-chain and lose the reload while the unregistration still lands. `clients.matchAll()` without `{ type: "window" }` can also return clients that have no `navigate()`. I have not seen either happen. There is no network in that chain.

**I have no evidence any of this worked**, beyond the fact that I stopped touching it. No issue, no error text, no analytics, no build log. Four one-line commit messages, four empty pull requests, and the code. Everything between the code and the symptom is me reconstructing it a year later.

---

A service worker is not a file you deploy. It is a registration the browser holds on your behalf, and your repository has no authority over it.

You cannot delete it, you cannot 404 it, and you cannot reach it from a page it will not let load.

The day you register one, you hand a stranger's browser a key you can only ever ask nicely to have back.
