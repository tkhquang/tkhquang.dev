---
title: "Stop Fighting z-index: Stacked Layers with React Portals"
created_at: 2025-04-01T00:00:00.000Z
updated_at: ""
published: true
category_slug: technical
tags:
  - React
  - Next.js
  - CSS
  - React Portals
  - z-index
  - Web Development
cover_image: /uploads/images/blog/stacked-layers-cover.webp
description: "A layering trick we picked up from studying DoorDash's DOM while building a design system, and the version I eventually ported into this blog."
---

Back at a previous company, building the shared React component library, we hit the wall that every design system hits eventually. Modals over drawers over dropdowns over a sticky header, spread across several apps and a whole team of us, and no two people agreeing on what number was big enough.

So we did what you do: we went looking at how other people had solved it. [DoorDash](https://www.doordash.com/) was an obvious place to look, since they're in roughly the same problem space, just much larger. Open the Inspector on their site and there's this, sitting at the bottom of the DOM tree:

```html title="doordash.com, trimmed"
<div class="Variables-sc-1yfaj45-0 bBYmsR prism-theme" data-testid="ThemingWrapper">
  <div class="ChildrenContainer-sc-1igz12f-0 jslFaF">...</div>
  <div class="Layer-sc-1igz12f-1 iKXVNr" data-testid="LAYER-MANAGER-POPOVER_CONTENT">...</div>
  <div class="Layer-sc-1igz12f-1 iKXVNs" data-testid="LAYER-MANAGER-SHEET"></div>
  <div class="Layer-sc-1igz12f-1 iKXVNt" data-testid="LAYER-MANAGER-MODAL"></div>
  <div class="Layer-sc-1igz12f-1 iKXVNm" data-testid="LAYER-MANAGER-POPOVER_MODAL"></div>
  <div class="Layer-sc-1igz12f-1 iKXVNn" data-testid="LAYER-MANAGER-ROOT"></div>
</div>
```

One container for the actual page content, then five `div`s named after the things that float above it. Popovers, sheets, modals. Four are sitting empty and `POPOVER_CONTENT` has something in it, because something was open when I grabbed that. They aren't empty because nothing works, they're empty because nothing is in them yet.

That's the whole idea, visible from the outside. We never read their source, and I haven't for this post either. We read the shape of the rendered HTML, worked out what it had to be doing, and built our own.

**All the code here is Next.js**, purely because that's what this site runs on and it was the convenient thing to write the examples against. Nothing about the pattern is Next-specific; it needs a root layout and portals, and that's it.

## The problem, which you already know

`z-index` is a terrible collaborative tool. Everyone starts out disciplined. Then a dropdown renders under the sticky header, someone bumps it to `z-index: 100`, and a week later a tooltip inside the dropdown goes to `999`. Six months in, the codebase has a `9999`, a `99999`, and at least one `2147483647` written by someone who had had enough.

The deeper problem is that these numbers aren't even comparable. `z-index` is only meaningful between elements competing inside the same **stacking context**, and stacking contexts get created by an alarming number of things: a `transform`, an `opacity` below `1`, a `filter`, a `will-change` naming any property that would itself create one. So your `z-index: 9999` element loses to a `z-index: 1` element three levels up, and nothing about the CSS tells you why. If you want the long version of this, Smashing Magazine has [a good writeup on managing z-index in large projects](https://www.smashingmagazine.com/2021/02/css-z-index-large-projects/) that we passed around the team at the time.

React portals help, because a portal escapes the DOM subtree it was declared in and renders under a target of your choosing, out from under whatever stacking context its declaration site was buried in. But you have to choose that target. React's own `createPortal` demands an existing node and has no opinion about which one; component libraries paper over that by picking for you, and the pick is almost always `document.body`. Ariakit, which this blog uses, creates a `div` and appends it there.

Which means **every top-level portal lands in the same container as a sibling of the others**. Ordering falls back to whatever local `z-index` values the overlays happen to carry, and where those tie, to tree order, which for appended portals is the order they mounted. A modal that mounted first sits under a tooltip that mounted second. That's not a system, that's a race.

(Nested portals are a different case: Ariakit hands each portal's own host down as the context for portals inside it, so they nest rather than joining the pile at the body.)

## The idea: a finite set of named slots

The trick in that DoorDash markup is to stop treating the portal target as an implementation detail and start treating it as a declared, finite set of slots.

You render a fixed number of empty sibling `div`s, once, at the top level of the app. They never contain anything by default. Their only job is to exist in a known order. Then, instead of letting every portal dump itself at the end of `<body>`, you tell each portal *which slot* it belongs to.

The ordering comes from the explicit `z-index` on each slot, and the source order of the slots is written to match it. The tempting thing to say next is that the DOM order is a safety net if those numbers ever go missing. It isn't. Drop a `z-index: 9999` box into slot 1 and a `z-index: 1` box into slot 4, then ask the browser which one covers the middle of the screen:

```js
// slots keep z-1 .. z-4
document.elementFromPoint(640, 450).id; // -> "slot4-z1"

// slots stripped to z-index: auto
document.elementFromPoint(640, 450).id; // -> "slot1-z9999"
```

Without their own `z-index` the slots stop being stacking contexts, their children get promoted into the root one, and the `9999` wins from three slots down. [Tree order only breaks ties](https://www.w3.org/TR/CSS22/visuren.html#z-index) between things at the same stack level, and these are no longer at the same level. The numbers are the guarantee. Keeping the source order aligned with them just means nobody has to hold both facts in their head at once.

This is what we landed on, and it's what the README for our UI library ended up saying:

> For stacked layout (modal, popup, ...), we rely heavily on react portals. For instance, we divide the layout into 4 stacked layers, which will have dynamic content with the use of the exposed `PortalContext`.

Four layers was the number we settled on there, and four is the number I went with here too. It's arbitrary but it's *finite*, and that's the whole point. A finite set of names forces you to answer "is this a dropdown or a modal?" instead of "what number is big enough today?".

## The layers

The component itself is almost insultingly small. There's no logic in it at all.

```tsx title="src/components/layout/StackedLayers.tsx" showLineNumbers
export const STACKED_LAYER_1 = "stacked-layer-1";
export const STACKED_LAYER_2 = "stacked-layer-2";
export const STACKED_LAYER_3 = "stacked-layer-3";
export const STACKED_LAYER_4 = "stacked-layer-4";

const StackedLayers = () => {
  return (
    <>
      <div id={STACKED_LAYER_1} className="relative z-1"></div>
      <div id={STACKED_LAYER_2} className="relative z-2"></div>
      <div id={STACKED_LAYER_3} className="relative z-3"></div>
      <div id={STACKED_LAYER_4} className="relative z-4"></div>
    </>
  );
};

export default StackedLayers;
```

The `relative` is there because `z-index` is ignored on statically positioned elements, so the slots have to be positioned to stack at all. Flex and grid items are an exception to that rule, and these happen to be flex children of `<body>` today, but the component shouldn't stop working because someone wraps the app in a plain `<div>`.

The `z-1` through `z-4` utilities are Tailwind v4, where any integer works. On v3 you would write `z-[1]` or extend the scale.

The exported constants matter more than they look. They're the actual API. Nobody writes `"stacked-layer-2"` as a string; they import `STACKED_LAYER_2`, which makes the set of layers greppable and renaming one a find-references job rather than an archaeology problem. It's convention, not enforcement: the provider takes `id: string`, so a typo still compiles and quietly falls back to the body. Typing that prop as a union of the four constants would close the gap, and I haven't bothered.

Now the part that makes it work, in the root layout:

```tsx {3,6} title="app/layout.tsx" showLineNumbers
<body className="flex min-h-screen flex-col">
  {/* ... theme script ... */}
  <div id="_next" className="relative z-0 flex size-full flex-1 flex-col">
    {children}
  </div>
  <StackedLayers />
</body>
```

`#_next` is `relative z-0`. That single pair of properties creates a stacking context around the entire application, and it's the most important line in this whole post. **Every `z-index` written anywhere inside the app is now scoped to that context.** Someone can write `z-index: 999999` in a component and it will still paint below `stacked-layer-1`, because it isn't competing with the layers. It's competing with its siblings, inside a box that itself sits at `z-0`.

![Two scales, not one](/uploads/images/blog/stacked-layers-stacking-context.svg)

That's the difference between a convention and a guarantee. You're no longer asking people to use small numbers. You've made large numbers local.

## Routing portals into a layer

The layers are just holes in the DOM. Something has to point portals at them. This blog uses [Ariakit](https://ariakit.org/), whose `Portal` component reads its target from a `PortalContext`, so a provider is enough:

```tsx title="src/providers/StackedLayerProvider.tsx" showLineNumbers
"use client";

import { PortalContext } from "@ariakit/react";
import React, { useEffect, useState } from "react";

interface StackedLayerProviderProps {
  children: React.ReactNode;
  id: string;
}

/**
 * Registers the portals of the children to the corresponding layer matching id
 *
 * NOTE: Always make sure to have the Zlayers exist in the HTML tree
 */
function StackedLayerProvider({ children, id }: StackedLayerProviderProps) {
  /**
   * Stays null until mounted: there is no document on the server. A null
   * PortalContext already resolves to document.body in Ariakit, so a missing
   * layer degrades instead of breaking.
   */
  const [rootNode, setRootNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setRootNode(document.getElementById(id));
  }, [id]);

  return (
    <PortalContext.Provider value={rootNode}>{children}</PortalContext.Provider>
  );
}

export default StackedLayerProvider;
```

That's a lot shorter than what it replaced. Here is the version it grew out of, comments and all. The import says Ariakit because that got updated during the migration, but the shape of it dates from [Reakit](https://github.com/ariakit/ariakit/tree/reakit), which is what Ariakit was called before the rename:

```tsx title="src/providers/StackedLayerProvider.tsx, before"
import { PortalContext } from "@ariakit/react";
import React, { useEffect, useState } from "react";

interface StackedLayerProviderProps {
  children: React.ReactNode;
  id: string;
}

/**
 * Waits for Element to appears in DOM and returns it
 * @param id {string}
 * @returns Element
 */
const getElementByIdAsync = (id: string): Promise<HTMLElement> =>
  new Promise((resolve) => {
    const getElement = () => {
      const element = document.getElementById(id);
      if (element) {
        resolve(element);
      } else {
        requestAnimationFrame(getElement);
      }
    };
    getElement();
  });

/**
 * Registers the portals of the children to the corresponding layer matching id
 */
function StackedLayerProvider({ children, id }: StackedLayerProviderProps) {
  // Set null to avoid rendering on SSR
  const [rootNode, setRootNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setRootNode(document.body);

    (async () => {
      /**
       * This ensures the portals will be put into the correct layers
       * after the layers are mounted as it will wait for the root node
       * to appear in the HTML tree.
       * NOTE: Always make sure to have the Zlayers exist in the HTML tree
       */
      const rootNode = await getElementByIdAsync(id);
      setRootNode(rootNode);
    })();
  }, [id]);

  return (
    <PortalContext.Provider value={rootNode}>{children}</PortalContext.Provider>
  );
}

export default StackedLayerProvider;
```

Two things in there look like overengineering now. Neither was.

**The body fallback was free.** Reakit created its portal host node once and moved it:

```tsx title="reakit/src/Portal/Portal.tsx"
const [hostNode] = React.useState(() => {
  if (canUseDOM) {
    const element = document.createElement("div");
    element.className = Portal.__className;
    return element;
  }
  return null;
});

useIsomorphicEffect(() => {
  if (!hostNode || !context) return undefined;
  context.appendChild(hostNode);
  return () => {
    context.removeChild(hostNode);
  };
}, [hostNode, context]);
```

`createPortal` targets `hostNode`, and `hostNode` never changes identity. Flipping the context from body to layer relocates one `div` and leaves React's tree untouched. Ariakit builds its portal element inside the effect instead, so with no `portalElement` prop it calls `createElement("div")` on every run, with `context` in the deps. A new container means `createPortal` gets a new target, so a portal mounted while the context flips gets unmounted and remounted. Same three lines of our code, different cost.

**The polling was necessary.** In the codebase this came from, the layers were mounted by a client-side container component, so the slot really might not exist yet when the provider looked for it. Here they're static markup in the root layout, visible before a line of client JavaScript runs:

```bash
$ curl -s localhost:3000/blog | grep -o 'id="stacked-layer-[0-9]"[^>]*'
id="stacked-layer-1" class="relative z-1"
id="stacked-layer-2" class="relative z-2"
id="stacked-layer-3" class="relative z-3"
id="stacked-layer-4" class="relative z-4"
```

That's what makes the lookup safe. Not "React commits everything before effects run", which streaming and selective hydration make untrue, but that these particular elements are in the server response before React is involved at all. One `getElementById` can't miss them.

So both lines went, for different reasons. The polling because its premise expired. The body fallback because it never bought anything under either library: Reakit's `PortalContext` defaulted to `getBodyElement()` and read as `useContext(PortalContext) || getBodyElement()`, Ariakit defaults to `null` and resolves it the same way. Setting the body yourself only repeats what a null context already does.

I did go looking for that remount before believing in it, with a `MutationObserver` on `<body>` installed before any page script, against `next build` output rather than the dev server. On the blog index, nothing:

```text title="portal mutations, /blog"
ADD DIV#id-fucnoo -> stacked-layer-1
```

The `div` is created inside the layer and never touches the body. That portal sits behind a `<Suspense>` boundary, so React hydrates it after the provider's effect has run, and it's never mounted while the context is still `null`.

Then the same trace on a post page, which renders a second portal outside any boundary:

```text title="portal mutations, /blog/posts/..."
ADD DIV#id-v2pi62 -> BODY
DEL DIV#id-v2pi62 <- BODY
ADD DIV#id-afbx9k -> stacked-layer-1
ADD DIV#id-jnuimh -> stacked-layer-1
```

There it is. That portal's layout effect runs in the same commit as hydration, before the provider's passive effect, so it really does take the body for a beat and then get relocated. The remount is real. It just happens once at hydration with nothing open, which is why nobody has ever noticed. Worth knowing that "the layers are quiet" was a claim about one page, not the app.

Which leaves the `NOTE` as the only thing between you and a missing layer:

> NOTE: Always make sure to have the Zlayers exist in the HTML tree

That's a hard requirement, not a hint. If the layers are gone, `getElementById` returns `null`, Ariakit falls back to the body, and you've earned the debugging session. Sixty frames of retry logic to be polite about someone deleting a `div` from the root layout isn't defence, it's more code to be wrong.

## Using it

At the call site, the whole system disappears. You wrap a subtree in a provider and every Ariakit portal inside it that hasn't been given an explicit target of its own, however deeply nested, lands in the right layer:

```tsx showLineNumbers
export default function SomethingThatFloats() {
  return (
    <StackedLayerProvider id={STACKED_LAYER_2}>
      {/* All of these end up inside #stacked-layer-2 */}
      <Portal>
        <Dropdown />
      </Portal>
      <div>
        <DeeplyNestedThingThatAlsoPortals />
      </div>
    </StackedLayerProvider>
  );
}
```

That's the property we actually wanted. A component three levels down doesn't need to know about layers, doesn't need to import a constant, doesn't need to have a `container` prop threaded down to it. It portals like normal, and context decides where "normal" points.

## Where it doesn't save you

I've seen this pattern oversold, so here is what it doesn't do.

**The isolation has exits.** The `z-0` on `#_next` only contains what stays inside `#_next`. A portal that targets anything else is, by definition, no longer in that subtree, which is precisely the mechanism the layers rely on but cuts both ways: a stray portal appended straight to `document.body` competes in the root stacking context rather than the app's, so a high enough `z-index` on it clears all four slots. Landing after them in the DOM only wins ties.

Above all of that sits the browser's [top layer](https://www.w3.org/TR/css-position-4/#document-top-layer), which no `z-index` reaches: a `<dialog>` opened with `showModal()`, a popover while it's shown, fullscreen elements. An active [view transition](https://drafts.csswg.org/css-view-transitions-1/#view-transition-stacking-layer) paints in its own layer too. Four slots is a way to organise the document's stacking order, not a claim to own the screen.

**It doesn't order things *within* a layer.** Two modals in `stacked-layer-3` are back to mount order and local `z-index`. The system gives you four coarse bands, not a total ordering. If you find yourself needing to sort things inside a band, that's usually a signal the thing belongs in a different band.

**The layers are flex children.** In this layout `<body>` is `flex min-h-screen flex-col`, so the four `div`s participate in that column. They stay invisible because everything portalled into them is `fixed`. Portal something with normal flow layout and it will appear as a strip at the bottom of the page, which is a genuinely confusing bug the first time you hit it. `absolute` isn't the escape hatch it looks like either: the slot is `relative` and zero-height, so it becomes the containing block and an `absolute inset-0` overlay collapses to nothing.

**Portals solve placement, not semantics.** A layer is a location, nothing more. React events still bubble along the React tree rather than the DOM tree, a bare `Portal` gives you no role, no focus trap and no escape handling, and Ariakit's standalone `Portal` leaves `preserveTabOrder` off by default, so tab order follows the new DOM position instead of where the component was written. If you're putting a modal in a layer, use a real `Dialog` and let the layer decide only *where* it lands.

## Worth it?

At that company it paid for itself almost immediately. The product was dense with floating UI, and once the layers existed the arguments stopped. Nobody had to negotiate a number, because the question changed shape: not "how high should this go" but "which of these four is it". That's a question a person can answer on their own in about two seconds, and be right.

The other half of the win was that it made the mess non-recurring. All the inherited `9999`s scattered across our apps got *contained* the moment the app root had its own stacking context. Contained, not neutralised: they still order things against their own siblings, which is fine and occasionally even deliberate. What they lost was the ability to escape and land on top of a modal. We didn't have to hunt them down, and we didn't have to schedule a cleanup sprint that would never have been approved anyway.

This blog has the same thing now, rebuilt from memory rather than copied over. A personal site has a handful of portals and I could have kept getting away with careful numbers. But the cost is close to zero: four empty `div`s, a thirty line provider, and one `relative z-0` on the app root. In exchange, "why is this rendering underneath that" stops being a debugging session and becomes a one line answer. It's in a lower layer.
