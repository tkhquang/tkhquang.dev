import { ImageProps } from "@/components/common/NextImage";
import { getProcessedImage } from "@/utils/image";
import { Element, Root } from "hast";
import { Transformer } from "unified";
import { visit } from "unist-util-visit";
interface Options {
  targetPath?: string;
  cache?: boolean;
}

const FALLBACK_DIMENSITION = {
  WIDTH: 1280,
  HEIGHT: 720,
};

export default function rehypeCustomNextImage(
  options: Options = {}
): Transformer<Root> {
  const { cache = true, targetPath = "./public" } = options;

  return async function transformer(tree: Root): Promise<Root> {
    const images: Element[] = [];

    // Collect all <img> nodes
    visit(tree, "element", (node: Element) => {
      if (node.tagName === "img") {
        images.push(node);
      }
    });

    // Process images concurrently
    await Promise.all(
      images.map(async (node) => {
        const properties = node.properties || {};
        const originalAlt = properties.alt || "";
        const originalSrc = properties.src as string;

        if (!originalSrc) {
          return;
        }

        try {
          const {
            placeholder,
            output,
            width = FALLBACK_DIMENSITION.WIDTH,
            height = FALLBACK_DIMENSITION.HEIGHT,
          } = await getProcessedImage({
            cache,
            targetPath,
            source: originalSrc,
            shouldStore: true,
          });

          // Keep the src relative: an absolute URL makes next/image treat it
          // as an upstream fetch, which Next 16 blocks in dev because
          // localhost resolves to a private IP
          const src = output.startsWith("/") ? output : `/${output}`;

          // Update the <img> node to <next-image>
          node.tagName = "next-image";
          node.properties = {
            alt: originalAlt as string,
            // No placeholder="blur": next/image wraps it in an SVG feGaussianBlur
            // filter, which tanks rendering perf on some browsers (Android
            // Firefox). NextImage paints blurDataURL as a CSS background instead
            blurDataURL: placeholder,
            height,
            sizes: "(max-width: 768px) 100vw, 768px",
            src,
            width,
            "data-ratio": width / height,
          } satisfies ImageProps & { "data-ratio": number };
        } catch (err) {
          console.error(`Failed to process image ${originalSrc}:`, err);
        }
      })
    );

    return tree;
  };
}
