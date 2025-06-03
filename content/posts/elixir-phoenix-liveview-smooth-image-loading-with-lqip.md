---
title: "[Elixir/Phoenix] LiveView - Smooth Image Loading with LQIP"
created_at: 2024-03-10T00:00:00.000Z
updated_at: ""
published: true
category_slug: technical
tags:
  - Elixir/Phoenix
  - LiveView
  - JavaScript
  - CSS
  - LQIP
cover_image: /uploads/images/phoenix_lqip_blur.webp
description: "A step-by-step guide to implementing Low-Quality Image Placeholders (LQIP) in your Phoenix LiveView application for a better user experience and perceived performance."
---

We've all experienced it: landing on a webpage and watching as images pop into existence, causing the layout to jump around, or staring at blank spaces while high-resolution images slowly load. It's not the best user experience. One popular technique to combat this and improve perceived performance is using **Low-Quality Image Placeholders (LQIP)**. The idea is simple: show a very small, heavily blurred version of an image instantly, then smoothly transition to the high-quality version once it's loaded.

In this post, I'll walk through how to implement a robust LQIP effect in a Phoenix LiveView application. We'll cover the CSS for the visual effect, the client-side JavaScript Hook to manage loading states, and how to integrate it all seamlessly into your LiveView templates.

For this guide, I'm working with these approximate Phoenix stack versions:
*   `phoenix: ~> 1.7.11`
*   `phoenix_live_view: ~> 0.20.2`
*   `phoenix_html: ~> 4.0`

Let's assume you already have a way to generate your low-quality placeholder images (e.g., server-side processing to create tiny, blurred JPEGs/WebPs, or using an image CDN that can do this on the fly). Our focus here is on using them on the client-side with LiveView.

## What is Phoenix LiveView (Briefly)?

For those new to it, [Phoenix LiveView](https://hexdocs.pm/phoenix_live_view/Phoenix.LiveView.html) is a library for the Elixir Phoenix web framework that allows developers to build rich, real-time user experiences with server-rendered HTML. Instead of writing complex JavaScript, you manage state on the server in Elixir, and LiveView efficiently updates the browser DOM when that state changes. It uses WebSockets for a persistent connection, making UIs feel incredibly responsive. For client-side interactions that don't need server state, or to manage browser-specific APIs, LiveView provides a mechanism called "Hooks."

## Step 1: The CSS Foundation - Blur and Transitions

The visual magic of LQIP relies on CSS filters and transitions. We'll have two main image elements: the placeholder (LQIP) and the full-resolution main image.

```css
/* Add this to your app.css or a relevant CSS file */
@layer utilities {
  :root {
    /* Adjust blur intensity */
    --img-blur: 20px;
    /* Slight zoom for placeholder for better coverage */
    --img-scale: 1.05;
    /* Duration of the fade/unblur */
    --img-transition-duration: 0.8s;
  }

  /* Styles for the full-resolution image */
  .lqip-image {
    /* Initially blurred until loaded */
    filter: blur(var(--img-blur));
    transition: var(--img-transition-duration) ease-out;
    transition-property: filter;
    will-change: filter;
    opacity: 0;
  }

  /* When the image is loaded (signaled by data attribute from JS) */
  .lqip-image[data-js-loading='false'] {
    filter: blur(0);
    opacity: 1;
  }

  /* Styles for the low-quality image placeholder */
  .lqip-placeholder {
    /* Crucial for overlaying */
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    /* Ensure it covers the area like the main image */
    object-fit: cover;

    /* Start blurred */
    filter: blur(var(--img-blur));
    /* Slightly zoomed to cover edges if aspect ratios differ slightly */
    transform: scale(var(--img-scale));
    /* Visible initially */
    opacity: 1;

    transition: var(--img-transition-duration) ease-out;
    transition-property: filter, opacity, transform;
    will-change: filter, opacity, transform;
  }

  /* When the main image is loaded, fade out and unblur the placeholder */
  /* This assumes .lqip-placeholder is a sibling immediately following .lqip-image
     or within a parent that has lqip-image with data-js-loading='false' */
  .lqip-image[data-js-loading='false'] + .lqip-placeholder,
  .has-lqip-loaded .lqip-placeholder {
    filter: blur(0);
    transform: scale(1);
    opacity: 0;
    /* So it doesn't block interaction with the main image */
    pointer-events: none;
  }

  /* Optional: Skeleton loader styles */
  .lqip-skeleton {
    position: absolute;
    inset: 0;
    /* Or your theme's skeleton color */
    background-color: #e0e0e0;
    /* Add your pulse/animation styles here if desired */
    /* Or your theme's skeleton color */
    z-index: -1;
  }

  /* Hide skeleton when placeholder image itself has loaded OR main image has loaded */
  .lqip-placeholder[data-js-image-loading='false'] ~ .lqip-skeleton,
  .lqip-image[data-js-loading='false'] ~ .lqip-skeleton {
      display: none;
  }

  /* Error state styling */
  .lqip-error-indicator {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      /* Semi-transparent background */
      background-color: rgba(200, 200, 200, 0.8);
      /* Add your error icon/text styles here */
  }
}
```

**Key CSS Properties Explained:**
*   `filter: blur(var(--img-blur))`: Applies a blur effect. The main image starts blurred and transitions to `blur(0)`. The placeholder also starts blurred.
*   `transform: scale(var(--img-scale))`: The placeholder is slightly scaled up to ensure it fully covers the area, especially if its aspect ratio differs subtly from the main image due to extreme compression.
*   `opacity`: Used to fade the main image in and the placeholder out.
*   `transition`: Defines the smooth animation for changes in `filter`, `opacity`, and `transform`.
*   `will-change`: Hints to the browser that these properties will be animated, allowing for potential performance optimizations.
*   `position: absolute` on `.lqip-placeholder`: This is crucial. It allows the placeholder to sit directly on top of (or behind, depending on z-index strategy) where the main image will be, ensuring a smooth visual handover.
*   **Data Attribute Targeting:** Notice `[data-js-loading='false']`. Our JavaScript hook will set this attribute on the main image once it's loaded. The CSS then uses this attribute selector to apply the "loaded" styles (removing blur, making it opaque).
*   **Skeleton Hiding:** The skeleton is hidden once the placeholder image loads (providing a very quick visual feedback) or when the main image itself loads.
*   **Sibling Selector (`+`) / Parent Class:** The rule `.lqip-image[data-js-loading='false'] + .lqip-placeholder` assumes your placeholder `<img>` tag is an *immediate sibling* right after your main `<img>` tag. If not, you might need a parent container and toggle a class like `.has-lqip-loaded` on the parent, then adjust the CSS selector accordingly (e.g., `.has-lqip-loaded .lqip-placeholder`).

## Step 2: The Client-Side Brain - The `ImageLoadingState` JS Hook

Phoenix LiveView Hooks allow us to run JavaScript on the client in response to lifecycle events of an element on the page. We'll create a hook that monitors our main image.

```javascript title="assets/js/hooks/imageLoadingState.js"
// assets/js/hooks/imageLoadingState.js
/**
 * JS Hook for setting data attributes for image loading states
 */
const ImageLoadingState = {
  mounted() {
    // The main <img> element this hook is attached to
    const image = this.el;
    const id = image.getAttribute("id");
    if (!id) {
      console.error("ImageLoadingState hook requires the <img> element to have an ID.");
      return;
    }

    // Prefixes for related elements
    const SKELETON_PREFIX = `skeleton-`;
    const PLACEHOLDER_PREFIX = `placeholder-`;
    const ERROR_PREFIX = `error-`;

    const skeleton = document.getElementById(`${SKELETON_PREFIX}${id}`);
    const placeholder = document.getElementById(`${PLACEHOLDER_PREFIX}${id}`);
    // Error element finding will be in setImageErrorState as it might not exist initially

    // Initial state: assume loading unless the image is already complete (e.g., cached)
    this.setImageLoadingState(!image.complete, id, skeleton, placeholder);

    image.addEventListener("load", () => {
      this.setImageLoadingState(false, id, skeleton, placeholder);
    });

    image.addEventListener("error", () => {
      this.setImageErrorState(id, skeleton, placeholder);
    });

    // If there's a placeholder, we also want to know when *it* loads,
    // primarily to hide the skeleton sooner.
    if (placeholder) {
      placeholder.addEventListener("load", () => {
        if (skeleton) {
          skeleton.setAttribute("data-js-image-loading", "false");
        }
      });
      placeholder.addEventListener("error", () => {
        // Optionally handle placeholder load errors, e.g., hide skeleton
        if (skeleton) {
          skeleton.setAttribute("data-js-image-loading", "false"); // Hide skeleton anyway
        }
        console.warn(`LQIP placeholder for ${id} failed to load.`);
      });
    }
  },

  setImageLoadingState(isLoading, imageId, skeletonEl, placeholderEl) {
    const image = this.el; // Main image this hook is on
    const errorEl = document.getElementById(`error-${imageId}`);

    const loadingValue = isLoading.toString(); // "true" or "false"

    image.setAttribute("data-js-loading", loadingValue);
    if (skeletonEl) skeletonEl.setAttribute("data-js-image-loading", loadingValue);
    if (placeholderEl) placeholderEl.setAttribute("data-js-image-loading", loadingValue);
    // Error element should typically hide when (re)loading starts
    if (errorEl) errorEl.setAttribute("data-js-image-loading", loadingValue);


    // Clear any previous error state when we start/finish loading successfully
    if (image.getAttribute("data-js-error") === "true") {
        image.removeAttribute("data-js-error");
    }
    if (skeletonEl && skeletonEl.getAttribute("data-js-image-error") === "true") {
        skeletonEl.removeAttribute("data-js-image-error");
    }
    if (placeholderEl && placeholderEl.getAttribute("data-js-image-error") === "true") {
        placeholderEl.removeAttribute("data-js-image-error");
    }
    if (errorEl && errorEl.getAttribute("data-js-image-error") === "true") {
        errorEl.removeAttribute("data-js-image-error");
    }


    if (!isLoading) {
      // Optional: Push an event to the server when the main image is loaded
      this.pushEvent("image_fully_loaded", { id: imageId });
      // If using a parent class strategy for placeholder CSS:
      // image.parentElement.classList.add("has-lqip-loaded");
    }
  },

  setImageErrorState(imageId, skeletonEl, placeholderEl) {
    const image = this.el;
    const errorEl = document.getElementById(`error-${imageId}`);

    const errorValue = "true";
    image.setAttribute("data-js-error", errorValue);
    if (skeletonEl) skeletonEl.setAttribute("data-js-image-error", errorValue);
    if (placeholderEl) placeholderEl.setAttribute("data-js-image-error", errorValue);
    if (errorEl) errorEl.setAttribute("data-js-image-error", errorValue); // Make error visible

    // Ensure loading indicators are turned off on error
    const loadingValue = "false";
    image.setAttribute("data-js-loading", loadingValue);
    if (skeletonEl) skeletonEl.setAttribute("data-js-image-loading", loadingValue);
    if (placeholderEl) placeholderEl.setAttribute("data-js-image-loading", loadingValue);
    if (errorEl) errorEl.setAttribute("data-js-image-loading", loadingValue); // For consistency

    // Optional: Push an event to the server when the main image fails to load
    this.pushEvent("image_load_error", { id: imageId });
  }
};

export default ImageLoadingState;
```

**Key Aspects of the `ImageLoadingState` Hook:**
*   **`mounted()`**: When the main `<img>` element (with `phx-hook="ImageLoadingState"`) is added to the DOM:
    *   It finds related elements (skeleton, placeholder, error indicator) by convention (e.g., `skeleton-THE_IMAGE_ID`). **This requires your `<img>` tags to have unique IDs.**
    *   It immediately calls `setImageLoadingState` based on `this.el.complete`. If an image is already in the browser cache, `complete` might be true, and we can skip showing the placeholder.
    *   It attaches `load` and `error` event listeners to the main image.
    *   It also attaches `load`/`error` listeners to the *placeholder image*. This is a nice touch because the tiny placeholder should load very quickly. When it does, we can hide the (often uglier) skeleton loader immediately, giving a very fast initial visual improvement.
*   **`setImageLoadingState(isLoading, ...)`**:
    *   This function is the core state manager. It takes a boolean `isLoading`.
    *   It sets a `data-js-loading` attribute on the main image.
    *   It also sets a `data-js-image-loading` attribute on the skeleton, placeholder, and error display. I've used a slightly different attribute name here just to make it explicit in the CSS selectors that these states relate *to the image's loading process*, but you could use the same `data-js-loading` attribute for all if preferred. The key is that the CSS targets these.
    *   Crucially, it also *clears* any `data-js-error` attributes. This handles cases where an image might have previously errored, and then a retry (e.g., due to LiveView update) is attempted.
    *   If `isLoading` is `false` (meaning the main image has loaded), it optionally pushes an event `image_fully_loaded` to the LiveView on the server. This is useful for analytics or server-side logic if needed, but not essential for the client-side visual effect.
*   **`setImageErrorState(...)`**:
    *   Sets `data-js-error="true"` on all relevant elements.
    *   Ensures `data-js-loading` and `data-js-image-loading` are set to `"false"` to hide loading indicators and show the error state.
    *   Pushes an `image_load_error` event.

## Step 3: Wiring it Up in `app.js`

Your `assets/js/app.js` needs to know about this hook and, importantly, ensure that LiveView doesn't discard our `data-js-*` attributes during DOM patching.

```javascript title="assets/js/app.js"
// assets/js/app.js (relevant parts)
import "phoenix_html";
import { Socket } from "phoenix";
import { LiveSocket } from "phoenix_live_view";
import topbar from "../vendor/topbar";

// Import our new hook
import ImageLoadingState from "./hooks/imageLoadingState";

let Hooks = {
  // Add it to your Hooks object
  ImageLoadingState,
  // ... any other hooks
};

let csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content");
let liveSocket = new LiveSocket("/live", Socket, {
  params: { _csrf_token: csrfToken /* ... other params */ },
  hooks: Hooks,
  dom: {
    onBeforeElUpdated(from, to) {
      // Preserve any attributes starting with "data-js-" set by our hooks
      for (const attr of from.attributes) {
        if (attr.name.startsWith("data-js-")) {
          to.setAttribute(attr.name, attr.value);
        }
      }
      // If you use libraries like Alpine.js, you might preserve "x-" attributes too
      // if (from.hasAttribute("x-ignore") && from.getAttribute("x-ignore") === "self") {
      //   to.setAttribute("x-ignore", "self");
      // }
    }
  }
});

// ... rest of your app.js (topbar, connect, etc.) ...
topbar.config({ barColors: { 0: "#29d" }, shadowColor: "rgba(0, 0, 0, .3)" });
window.addEventListener("phx:page-loading-start", _info => topbar.show(300));
window.addEventListener("phx:page-loading-stop", _info => topbar.hide());

liveSocket.connect();
window.liveSocket = liveSocket;
```
**Key changes in `app.js`:**
*   Import `ImageLoadingState`.
*   Add `ImageLoadingState` to the `Hooks` object passed to `LiveSocket`.
*   **`dom: { onBeforeElUpdated(...) }`**: This is a critical part for hooks that manipulate attributes. When LiveView patches the DOM, it might discard attributes it doesn't know about. This callback ensures that any attribute on an element starting with `data-js-` (which we use in our hook) is preserved from the old DOM element (`from`) to the new one (`to`).

## Step 4: Rendering Images in LiveView HEEx for LQIP

Now, let's look at how you'd structure your HEEx template (e.g., inside a LiveComponent like your `FlipCardImage.ex`) to use this system.

```html
<.live_component module={DailyTarotWeb.TarotCard.FlipCardImage} id={"card-image-" <> @unique_id} image_url={@full_res_url} placeholder_url={@lqip_url} alt_text={"Card Image"} />
```

And the `FlipCardImage.ex` component (simplified):
```elixir title="daily_tarot_web/tarot_card/flip_card_image.ex"
# daily_tarot_web/tarot_card/flip_card_image.ex
defmodule DailyTarotWeb.TarotCard.FlipCardImage do
  use DailyTarotWeb, :live_component

  # Props for this component:
  # - id: (string, required) Unique ID for the image and its related elements.
  # - image_url: (string, required) URL for the full-resolution image.
  # - placeholder_url: (string, required) URL for the low-quality placeholder image.
  # - alt_text: (string, required) Alternative text for the main image.

  def render(assigns) do
    ~H"""
    <div class="image-container relative">
      {!-- Skeleton Loader: Shown while everything (including placeholder) might be loading. --}
      {!-- Its visibility is controlled by CSS targeting data attributes set by the JS hook. --}
      <div
        id={"skeleton-" <> @id}
        role="status"
        class="lqip-skeleton [&[data-js-image-loading='false']]:hidden"
        aria-busy="true"
        aria-live="polite"
      >
        <svg class="w-full h-full text-gray-200" fill="currentColor" viewBox="0 0 20 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z"/>
        </svg>
      </div>

      {!-- Main High-Resolution Image: Starts transparent and blurred, hooked by JS --}
      <img
        id={@id}
        class="lqip-image w-full h-auto"
        src={@image_url}
        alt={@alt_text}
        phx-hook="ImageLoadingState"
        data-js-loading="true"
        loading="lazy"
      />

      {!-- Low-Quality Image Placeholder: Displayed immediately, blurred. --}
      {!-- The JS hook will also monitor its load state to hide the skeleton faster. --}
      <img
        id={"placeholder-" <> @id}
        class="lqip-placeholder"
        src={@placeholder_url}
        alt=""
        aria-hidden="true"
        data-js-image-loading="true"
      />

      {!-- Optional: Error Indicator: Shown if the main image fails to load. --}
      <div
        id={"error-" <> @id}
        class="lqip-error-indicator [&:not([data-js-image-error='true'])]:hidden"
        aria-live="assertive"
      >
        <span>⚠</span> Image failed to load.
      </div>
    </div>
    """
  end
end
```

**Key points in the HEEx template:**
*   **Unique IDs:** The main image *must* have a unique `id`. Related elements (skeleton, placeholder, error) derive their IDs from the main image's ID with a prefix (e.g., `id={"skeleton-" <> @id}`). This is how the JS hook finds them.
*   **Container:** A parent `div.image-container` with `position: relative;` is helpful so the `position: absolute;` placeholder and skeleton are positioned correctly relative to it.
*   **CSS Classes:** Apply `.lqip-image` to the main image and `.lqip-placeholder` to the placeholder. Apply `.lqip-skeleton` to your skeleton.
*   **`phx-hook="ImageLoadingState"`:** This attaches our JavaScript hook to the main `<img>` tag.
*   **Initial `data-js-loading="true"`:** We can set this on the server to ensure the CSS immediately styles the image as "loading" before the JS hook even mounts. The hook will then verify with `image.complete`.
*   **`loading="lazy"`:** This is a native browser feature for lazy loading images. It's a good practice to include and works well with LQIP. The browser will only start loading the `src` when the image is close to the viewport. Our LQIP will show in the meantime.
*   **Placeholder `alt=""`:** Since the placeholder is purely decorative and the main image has proper alt text, the placeholder can have an empty alt attribute.
*   **Skeleton Visibility:** The `[&[data-js-image-loading='false']]:hidden` (or similar) class on the skeleton uses the data attribute that the placeholder image's `load` event can set, or the main image's load.

## Putting It All Together: The Flow

Now that we have the CSS, the JavaScript Hook, and the HEEx structure in place, let's visualize how these pieces interact from the initial page load to the final display of the high-resolution image. We can break this down into two main phases: the initial display with the placeholder, and then the loading of the main image.

**Phase 1: Initial Display & Placeholder Load**

This first sequence shows what happens from the moment the browser requests the page until the low-quality placeholder image is visible and the initial skeleton loader (if used) is hidden.

<pre class="mermaid flex justify-center">
sequenceDiagram
    title LQIP Flow: Initial Display & Placeholder Load
    autonumber

    participant B as Browser
    participant S as Server (LiveView)
    participant H as JS Hook (ImageLoadingState)
    participant C as CSS Engine

    B->>S: 1. Page Request
    S->>B: 2. Sends HEEx HTML (img data-js-loading="true", skeleton, placeholder img)
    B->>B: 3. Renders Initial HTML<br />(Skeleton may be visible via CSS default)

    Note over B,H: Placeholder & Main images start loading concurrently (browser behavior)

    B->>H: 4. Placeholder `<img>` fires `load` event (placeholder image data received)
    H->>B: 5. JS Hook updates Placeholder `data-js-image-loading="false"`
    H->>B: 6. JS Hook (potentially) updates Skeleton `data-js-image-loading="false"`
    B->>C: 7. CSS Engine applies rules: Skeleton hides (if placeholder loaded first)
    Note over B: User now sees blurred LQIP smoothly
</pre>

**Breakdown of Phase 1:**
1.  The browser requests the page from the Phoenix server.
2.  LiveView renders the HEEx template, sending HTML that includes our main `<img>` (with `data-js-loading="true"`), the placeholder `<img>`, and the skeleton `<div>`.
3.  The browser renders this initial structure. The CSS might initially show the skeleton, or the placeholder if it loads very fast.
4.  The browser starts fetching both the placeholder and the main image. Since the placeholder is very small, its `load` event fires quickly.
5.  Our `ImageLoadingState` JS hook, which is listening to the placeholder's `load` event, updates the placeholder's `data-js-image-loading` attribute.
6.  It might also update the skeleton's `data-js-image-loading` attribute (depending on your hook logic, or if skeleton is only tied to main image).
7.  CSS rules targeting these attributes (e.g., `.lqip-skeleton[data-js-image-loading='false'] { display: none; }`) hide the skeleton. The user sees the blurred LQIP covering the image area.

**Phase 2: Main Image Loading and Final Transition**

Next, the main high-resolution image continues to load. This sequence details what happens when it successfully loads or encounters an error.

<pre class="mermaid flex justify-center">
sequenceDiagram
    title LQIP Flow: Main Image Load & Transition
    autonumber

    participant B as Browser
    participant S as Server (LiveView)
    participant H as JS Hook (ImageLoadingState)
    participant C as CSS Engine

    Note over B,H: Main image (`id`) continues loading (hook is already mounted)...
    H->>H: Hook may have already checked `image.complete` on mount

    opt Main Image Load SUCCESS
        B->>H: Main `<img>` `load` event fires
        H->>H: Calls `setImageLoadingState(false)`
        H->>B: Sets `data-js-loading="false"` on main img & related elements
        H-->>S: Pushes `image_fully_loaded` event (optional)
        B->>C: CSS Engine applies rules: main image transitions to visible/unblurred
        B->>C: CSS Engine applies rules: placeholder transitions to hidden/transparent
        Note over B: User sees sharp, high-resolution image
    end

    opt Main Image Load ERROR
        B->>H: Main `<img>` `error` event fires
        H->>H: Calls `setImageErrorState()`
        H->>B: Sets `data-js-error="true"` & `data-js-loading="false"` on relevant elements
        H-->>S: Pushes `image_load_error` event (optional)
        B->>C: CSS Engine applies rules: error indicator is shown, loading states hidden
    end
</pre>

**Breakdown of Phase 2:**
1.  The `ImageLoadingState` hook, attached to the main image, is already active. It might have set an initial loading state during its `mounted` callback.
2.  **Success Path:**
    *   When the main image fully loads, its `load` event fires.
    *   The hook's handler calls `setImageLoadingState(false, ...)`.
    *   This crucial step sets `data-js-loading="false"` on the main image.
    *   (Optional) An event is pushed to the LiveView server.
    *   The CSS engine detects the attribute change. The `.lqip-image` CSS rules transition it from blurred and transparent to sharp and opaque.
    *   Simultaneously, CSS rules for `.lqip-placeholder` (e.g., `.lqip-image[data-js-loading='false'] + .lqip-placeholder`) make the placeholder transition to transparent, effectively disappearing.
3.  **Error Path:**
    *   If the main image fails to load, its `error` event fires.
    *   The hook calls `setImageErrorState(...)`.
    *   This sets `data-js-error="true"` and ensures `data-js-loading="false"`.
    *   (Optional) An error event is pushed to the LiveView server.
    *   CSS rules tied to `data-js-error="true"` will show your error indicator, and rules for `data-js-loading="false"` will ensure loading animations stop.

This two-phase flow, orchestrated by a client-side JavaScript Hook reacting to image load events and setting data attributes that CSS then uses for visual transitions, provides a robust and smooth LQIP experience for your LiveView users. It enhances the user's perception of load times and makes for a much more polished feel, especially on slower connections or when dealing with many large images.

![The Output](/uploads/images/lqip-example.gif)

---

The complete working example with these techniques can be found in my Daily Tarot project. I hope this guide helps you implement a similar effect in your own Phoenix LiveView applications!

You can find the source code for the Daily Tarot project on GitHub:
[tkhquang/daily-tarot](https://github.com/tkhquang/daily-tarot)
