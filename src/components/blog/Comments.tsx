"use client";

import { useThemeValue } from "@/store/theme";
import type { BooleanString, InputPosition, Mapping } from "@giscus/react";
import GiscusComponent from "@giscus/react";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import LoaderLines from "@/components/common/loader/LoaderLines";

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

  const { mode } = useThemeValue();
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

                      if (iframe.contentDocument?.readyState === "complete") {
                        // Already loaded (possibly from cache)
                        setIsIframeLoaded(true);
                      } else {
                        // Listen for load if not already loaded
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
      observerRef.current?.disconnect();
      shadowObserverRef.current?.disconnect();
      iframeRef.current?.removeEventListener("load", hasLoaded);
    };
  }, [mode]);

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
        theme={`${process.env.NEXT_PUBLIC_BASE_URL}/assets/styles/external/giscus-transparent-${mode}.css`}
        lang={lang}
        loading="lazy"
        host="https://giscus.app"
        key={mode}
      />
    </div>
  );
}
