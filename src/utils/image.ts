import crypto from "crypto";
import fs from "fs";
import { imageSize } from "image-size";
import path from "path";
import sanitize from "sanitize-filename";
import sharp from "sharp";

export function checkIfRemoteResource(url: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(url);
}

export function bufferToBase64(buffer: Buffer): string {
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

async function getFileBufferLocal(filePath: string) {
  // filePath is file addess exactly how is used in Image component (/ = public/)
  const realFilepath = path.join(process.cwd(), "public", filePath);
  return fs.promises.readFile(realFilepath);
}

async function getFileBufferRemote(
  url: string,
  { cache }: Pick<GetProcessedImageOptions, "cache">
) {
  const arrayBuffer = await getRemoteImage(url, {
    shouldStore: false,
    cache,
  });
  return Buffer.from(arrayBuffer);
}

export function getFileBuffer(
  src: string,
  options: Pick<GetProcessedImageOptions, "cache"> = {}
) {
  const isRemote = checkIfRemoteResource(src);
  return isRemote ? getFileBufferRemote(src, options) : getFileBufferLocal(src);
}

interface GetRemoteImageOptionsBase {
  cache?: boolean;
}

interface GetRemoteImageOptionsWithoutStore extends GetRemoteImageOptionsBase {
  shouldStore: false;
}

interface GetRemoteImageOptionsWithStore extends GetRemoteImageOptionsBase {
  shouldStore: true;
  targetPath: string;
}

type GetRemoteImageOptions =
  | GetRemoteImageOptionsWithStore
  | GetRemoteImageOptionsWithoutStore;

// Function overloads
export async function getRemoteImage(
  url: string,
  options: GetRemoteImageOptionsWithStore
): Promise<string>;
export async function getRemoteImage(
  url: string,
  options: GetRemoteImageOptionsWithoutStore
): Promise<ArrayBuffer>;

// Implementation signature
export async function getRemoteImage(
  url: string,
  options: GetRemoteImageOptions = {
    shouldStore: true,
    targetPath: "./public",
  }
): Promise<string | ArrayBuffer> {
  try {
    let filePath: string | undefined;

    // If storing, resolve the target file path and check cache
    if (options.shouldStore) {
      const hash = crypto.createHash("md5").update(url).digest("hex");
      filePath = path.resolve(options.targetPath, sanitize(hash));

      if (options.cache && fs.existsSync(filePath)) {
        console.info("Remote image (cached) found at: ", filePath);
        return filePath;
      }
    }

    // Common fetch logic
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
      },
      next: {
        revalidate: options.cache ? false : 0,
        tags: ["remote-image"],
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`Request Failed. Status Code: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    // If storing, write file and return path
    if (options.shouldStore && filePath) {
      const body = Buffer.from(arrayBuffer);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      await fs.promises.writeFile(filePath, body);
      console.info(`Remote image stored at: ${filePath}`);
      return filePath;
    }

    // Otherwise, just return the arrayBuffer
    return arrayBuffer;
  } catch (error) {
    console.error(`Error fetching image: ${url}\n`, error);
    throw new Error(`Request Failed. Error: ${error}`);
  }
}

interface GetProcessedImageBaseOptions {
  cache?: boolean;
  source: string;
}

interface GetProcessedImageStoreOptions extends GetProcessedImageBaseOptions {
  shouldStore: true;
  targetPath: string;
}

interface GetProcessedImageNoStoreOptions extends GetProcessedImageBaseOptions {
  shouldStore: false;
}

type GetProcessedImageOptions =
  | GetProcessedImageStoreOptions
  | GetProcessedImageNoStoreOptions;

type GetProcessedImageReturn = Promise<{
  placeholder: string;
  output: string;
  source: string;
  width: number | undefined;
  height: number | undefined;
}>;

const DEFAULT_TARGET_PATH = "./public";
const DEFAULT_PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mOsa2yqBwAFCAICLICSyQAAAABJRU5ErkJggg==";

export async function getProcessedImage(
  options: GetProcessedImageOptions
): GetProcessedImageReturn {
  const { source, cache = true } = options;
  const isRemote = checkIfRemoteResource(source);

  let localFilePath = source;
  let height;
  let width;

  try {
    if (isRemote) {
      if (options.shouldStore) {
        const targetPath = options.targetPath || DEFAULT_TARGET_PATH;

        const absolutePath = await getRemoteImage(source, {
          cache,
          shouldStore: true,
          targetPath,
        });

        const relativePath = path.relative(
          path.resolve("./public"),
          absolutePath
        );
        localFilePath = relativePath;
      } else {
        // Process remote image directly

        const originalBuffer = await getFileBuffer(source, {
          cache,
        });
        const resizedBuffer = await sharp(originalBuffer).resize(20).toBuffer();

        const dimensions = imageSize(originalBuffer);
        if (dimensions) {
          width = dimensions.width;
          height = dimensions.height;
        }

        return {
          placeholder: bufferToBase64(resizedBuffer),
          output: localFilePath,
          source,
          width,
          height,
        };
      }
    } else {
      const localImagePath = path.join("./public", source);

      const normalizedLocalPath = path.relative(
        path.resolve("./public"),
        localImagePath
      );

      localFilePath = normalizedLocalPath;
    }

    const normalizedLocalPath = `/${localFilePath.replace(/\\+/g, "/")}`;

    const originalBuffer = await getFileBuffer(normalizedLocalPath);
    const resizedBuffer = await sharp(originalBuffer).resize(20).toBuffer();

    const dimensions = imageSize(originalBuffer);
    if (dimensions) {
      width = dimensions.width;
      height = dimensions.height;
    }

    return {
      placeholder: bufferToBase64(resizedBuffer),
      output: normalizedLocalPath,
      source,
      width,
      height,
    };
  } catch (error) {
    console.error("getProcessedImage: ", error);
    return {
      placeholder: DEFAULT_PLACEHOLDER,
      output: source,
      source,
      width,
      height,
    };
  }
}
