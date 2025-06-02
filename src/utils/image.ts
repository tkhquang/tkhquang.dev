import crypto from "crypto";
import fs from "fs";
import path from "path";
import sanitize from "sanitize-filename";

interface GetRemoteImageOptions {
  targetPath: string;
  cache?: boolean;
}

export async function getRemoteImage(
  url: string,
  options: GetRemoteImageOptions
): Promise<string> {
  try {
    const hash = crypto.createHash("md5").update(url).digest("hex");
    let filePath = path.resolve(options.targetPath, sanitize(hash));

    // Cache check
    if (options.cache && fs.existsSync(filePath)) {
      return filePath;
    }

    const response = await fetch(url, {
      method: "GET",
      next: {
        revalidate: options.cache ? false : 0,
        tags: ["remote-image"],
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`Request Failed. Status Code: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const body = Buffer.from(buffer);

    // Ensure the target directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write the file
    await fs.promises.writeFile(filePath, body);
    console.log(`Remote image downloaded at: ${filePath}`);

    return filePath;
  } catch (error: any) {
    console.error(`Error fetching image: ${url}\n`, error.message || error);
    throw new Error(`Request Failed. Error: ${error.message || error}`);
  }
}
