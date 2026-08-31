"use client";

// Subpath, not the barrel: the barrel drags the whole widget library
// into every route that renders this provider.
import { PortalContext } from "@ariakit/react/portal";
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
