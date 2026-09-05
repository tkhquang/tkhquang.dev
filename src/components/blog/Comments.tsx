"use client";

import LoaderLines from "@/components/common/loader/LoaderLines";
import { themeStore, useThemeValue, type ThemeMode } from "@/store/theme";
import type { BooleanString, InputPosition, Mapping } from "@giscus/react";
import GiscusComponent from "@giscus/react";
import clsx from "clsx";
import { useStore } from "jotai";
import { useEffect, useRef, useState } from "react";

interface GiscusConfigs {
  themeURL: string;
  theme: string;
  darkTheme: string;
  mapping: Mapping;
  repo: `${string}/${string}`;
  repositoryId: string;
  category: string;
  categoryId: string;
  reactions: BooleanString;
  metadata: BooleanString;
  inputPosition: InputPosition;
  lang: string;
}

interface CommentsProps {
  configs?: Partial<GiscusConfigs>;
  className?: string;
}

const meta = {
  comments: {
    giscusConfigs: {
      category: process.env.NEXT_PUBLIC_GISCUS_CATEGORY || "",
      categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || "",
      lang: "en",
      mapping: "pathname",
      metadata: "0",
      reactions: "1",
      repo: process.env.NEXT_PUBLIC_GISCUS_REPO || "",
      repositoryId: process.env.NEXT_PUBLIC_GISCUS_REPOSITORY_ID || "",
      theme: "light",
      themeURL: "",
    },
  },
};

const GISCUS_HOST = "https://giscus.app";

/* The thread loads this stylesheet inside its iframe, so the values in it
   are baked hex; the file itself is picked by the page's theme mode */
const themeUrlFor = (mode: ThemeMode) =>
  `${process.env.NEXT_PUBLIC_BASE_URL}/assets/styles/external/giscus-transparent-${mode}.css`;

export default function Comments({ className, configs }: CommentsProps) {
  const defaultConfigs = meta.comments.giscusConfigs as GiscusConfigs;
  const {
    category,
    categoryId,
    inputPosition,
    lang,
    mapping,
    metadata,
    reactions,
    repo,
    repositoryId,
  } = { ...defaultConfigs, ...configs };

  const { mode, ready } = useThemeValue();
  const store = useStore();
  const observerRef = useRef<MutationObserver | null>(null);
  const shadowObserverRef = useRef<MutationObserver | null>(null);
  const commentSectionRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);

  useEffect(() => {
    const commentSection = commentSectionRef.current;

    if (!commentSection) {
      return;
    }

    // Modern browsers will set readyState to 'complete' if loaded from cache
    const hasLoaded = () => {
      setIsIframeLoaded(true);
    };

    /* The thread's first resizeHeight message is the earliest proof that
       the giscus app inside the iframe is hydrated and listening. The
       widget's own setConfig, sent on the iframe's load event, can reach the
       frame a few milliseconds before that listener exists (measured on
       Firefox after a reload with the thread in view), and giscus never asks
       again. So the current theme is posted once more, straight to the
       frame, the moment the thread is known to be live. */
    let threadGreeted = false;
    const greetThread = (event: MessageEvent) => {
      const frame = iframeRef.current;
      if (
        threadGreeted ||
        event.origin !== GISCUS_HOST ||
        !frame?.contentWindow ||
        event.source !== frame.contentWindow
      ) {
        return;
      }
      const payload = event.data?.giscus;
      if (typeof payload !== "object" || payload === null) {
        return;
      }
      if (!("resizeHeight" in payload)) {
        return;
      }
      threadGreeted = true;
      frame.contentWindow.postMessage(
        {
          giscus: {
            setConfig: { theme: themeUrlFor(store.get(themeStore).mode) },
          },
        },
        GISCUS_HOST
      );
    };
    window.addEventListener("message", greetThread);

    observerRef.current = new MutationObserver((mutations) => {
      // Only process mutations that involve the iframe
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          const shadowHost = commentSection.querySelector(
            "#comments-container"
          );

          if (shadowHost?.shadowRoot) {
            observerRef.current?.disconnect(); // Stop observing for shadow host

            // Now observe the shadow root for iframe
            shadowObserverRef.current = new MutationObserver(
              (shadowMutations) => {
                for (const shadowMutation of shadowMutations) {
                  if (shadowMutation.type === "childList") {
                    const iframe = shadowHost.shadowRoot!.querySelector(
                      "iframe[title='Comments']"
                    ) as HTMLIFrameElement | null;
                    if (iframe) {
                      shadowObserverRef.current?.disconnect(); // Stop observing once found

                      iframeRef.current = iframe;

                      // Not `contentDocument.readyState`: a fresh iframe still
                      // holds the same-origin about:blank document, so it reads
                      // "complete" long before giscus navigates. Giscus itself
                      // drops the `loading` class on its iframe's load event.
                      if (!iframe.classList.contains("loading")) {
                        setIsIframeLoaded(true);
                      } else {
                        iframe.addEventListener("load", hasLoaded);
                      }
                      break;
                    }
                  }
                }
              }
            );

            shadowObserverRef.current.observe(shadowHost.shadowRoot, {
              childList: true,
              subtree: true,
            });

            break;
          }
        }
      }
    });

    // Observe only the comment section, not the entire body
    observerRef.current.observe(commentSection, {
      childList: true,
      subtree: true,
    });

    return () => {
      setIsIframeLoaded(false);
      window.removeEventListener("message", greetThread);
      observerRef.current?.disconnect();
      shadowObserverRef.current?.disconnect();
      iframeRef.current?.removeEventListener("load", hasLoaded);
    };
    /* Once per mount: the iframe loads once and theme changes restyle it in
       place via the theme prop below, so re-arming per mode would only
       flash the loader over a live thread. The store handle is stable. */
  }, [store]);

  return (
    <div
      id="comment"
      className={clsx("relative min-h-[150px]", className)}
      ref={commentSectionRef}
    >
      <div
        className={clsx(
          isIframeLoaded && "opacity-0 transition-opacity duration-1000"
        )}
      >
        <LoaderLines />
      </div>
      {/* Held back until the initializer has copied the reader's theme into
          the store. This boundary hydrates ahead of the initializer's own
          (the portal layer flips its context after mount and React hydrates
          every boundary below it at once), so an earlier render would bake
          the server default into the iframe URL, and the iframe keeps the
          theme it was born with whenever the corrective setConfig lands
          before the thread listens. No key on purpose: a theme change
          restyles the thread in place through the theme prop, a remount
          would wipe half-typed drafts and refetch the whole thread. */}
      {ready && (
        <GiscusComponent
          id="comments-container"
          repo={repo}
          repoId={repositoryId}
          category={category}
          categoryId={categoryId}
          mapping={mapping}
          reactionsEnabled={reactions}
          emitMetadata={metadata}
          inputPosition={inputPosition}
          theme={themeUrlFor(mode)}
          lang={lang}
          loading="lazy"
          host={GISCUS_HOST}
        />
      )}
    </div>
  );
}
