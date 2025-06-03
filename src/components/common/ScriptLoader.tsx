"use client";

import { useEffect, useRef } from "react";

const ScriptLoader = ({ content }: { content: string }) => {
  const scriptRoot = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scriptRoot.current) {
      return;
    }

    // Creates a document range (grouping of nodes in the document is my understanding)
    // In this case we instantiate it as empty, on purpose
    const range = document.createRange();
    // Creates a mini-document (light weight version), in our range with our script in it
    const documentFragment = range.createContextualFragment(`${content}`);
    // Appends it to our script root - so it renders in the correct location
    scriptRoot.current.append(documentFragment);
  }, [content]);

  return <div ref={scriptRoot} />;
};

export default ScriptLoader;
