import { visit } from "unist-util-visit";
import path from "path";
import { promisify } from "util";
import fs from "fs";
import { imageSize } from "image-size";
import { Element, Root } from "hast";
import { Transformer } from "unified";
import { getRemoteImage } from "@/utils/image";
import { ImageProps } from "next/image";

const sizeOf = promisify(imageSize);

interface Options {
  targetPath?: string;
  publicFolder?: string;
  cache?: boolean;
}
export default function rehypeCustomNextImage(
  options: Options = {}
): Transformer<Root> {
  const {
    targetPath = "./public",
    publicFolder = "./public",
    cache = true,
  } = options;

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
        let finalSrc = originalSrc;

        if (!originalSrc) {
          return;
        }

        let width = properties.width as number | undefined;
        let height = properties.height as number | undefined;

        try {
          if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(originalSrc)) {
            // Handle remote images
            const localPath = await getRemoteImage(originalSrc, {
              targetPath,
              cache,
            });

            // Retrieve dimensions if width and height are not defined
            if (!width || !height) {
              const dimensions = await sizeOf(localPath);
              if (dimensions) {
                width = dimensions.width;
                height = dimensions.height;
              }
            }

            const relativePath = path.relative(
              path.resolve("./public"),
              localPath
            );
            finalSrc = `/${relativePath.replace(/\\+/g, "/")}`;
          } else {
            // Handle local images
            const localImagePath = path.join(publicFolder, originalSrc);

            if (!width || !height) {
              if (fs.existsSync(localImagePath)) {
                const dimensions = await sizeOf(localImagePath);
                if (dimensions) {
                  width = dimensions.width;
                  height = dimensions.height;
                }
              }
            }

            finalSrc = `/${path
              .relative(path.resolve("./public"), localImagePath)
              .replace(/\\+/g, "/")}`;
          }

          // Update the <img> node to <next-image>
          node.tagName = "next-image";
          node.properties = {
            src: finalSrc,
            alt: originalAlt as string,
            width: width ?? 1280,
            height: height ?? 720,
          } satisfies ImageProps;
        } catch (err) {
          console.error(`Failed to process image ${originalSrc}:`, err);
        }
      })
    );

    return tree;
  };
}
