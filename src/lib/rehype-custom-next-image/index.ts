import fs from "fs";
import { imageSize } from "image-size";
import path from "path";
import { Transformer } from "unified";
import { visit } from "unist-util-visit";
import { promisify } from "util";
import { ImageProps } from "@/components/common/NextImage";
import { getRemoteImage } from "@/utils/image";
import { getPlaceholderImage } from "@/utils/next-mage";
import { Element, Root } from "hast";

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
    cache = true,
    publicFolder = "./public",
    targetPath = "./public",
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

        const isRemoteImage = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(originalSrc);

        try {
          if (isRemoteImage) {
            // Handle remote images
            const localPath = await getRemoteImage(originalSrc, {
              cache,
              targetPath,
            });

            const relativePath = path.relative(
              path.resolve("./public"),
              localPath
            );
            finalSrc = `/${relativePath.replace(/\\+/g, "/")}`;
          } else {
            // Handle local images
            const localImagePath = path.join(publicFolder, originalSrc);

            finalSrc = `/${path
              .relative(path.resolve("./public"), localImagePath)
              .replace(/\\+/g, "/")}`;
          }

          let result;
          const filePath = path.join(process.cwd(), "public", finalSrc);

          try {
            result = await getPlaceholderImage(originalSrc);
          } catch (error) {
            console.error(error);
          }

          if (fs.existsSync(filePath)) {
            const dimensions = await sizeOf(filePath);
            if (dimensions) {
              width = width ?? dimensions.width;
              height = height ?? dimensions.height;
            }
          }

          // Update the <img> node to <next-image>
          node.tagName = "next-image";
          node.properties = {
            alt: originalAlt as string,
            blurDataURL: result?.placeholder,
            height: height ?? 720,
            placeholder: "blur",
            src: filePath.includes(targetPath.replace(/^\.\//, ""))
              ? `${process.env.NEXT_PUBLIC_BASE_URL}/${finalSrc}`
              : finalSrc,
            width: width ?? 1280,
          } satisfies ImageProps;
        } catch (err) {
          console.error(`Failed to process image ${originalSrc}:`, err);
        }
      })
    );

    return tree;
  };
}
