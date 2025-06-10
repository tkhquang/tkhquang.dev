"use client";

import { useThemeValue } from "@/store/theme";
import type { BooleanString, InputPosition, Mapping } from "@giscus/react";
import GiscusComponent from "@giscus/react";
import clsx from "clsx";

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

  return (
    <div id="comment" className={clsx("min-h-[150px]", className)}>
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
