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
