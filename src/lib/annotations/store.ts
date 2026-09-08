import type { AnnotationRecord } from "./types";
import { Redis } from "@upstash/redis";
import crypto from "crypto";

/* Bumping this abandons every stored record without touching the ones a
   build already holds on disk. Only for a change in what is stored; a
   change in how a destination is read belongs in the record's own
   reading version. */
const NAMESPACE = "annotations:v1";

const keyFor = (url: string) =>
  `${NAMESPACE}:${crypto.createHash("sha1").update(url).digest("hex")}`;

/**
 * Lazy, so a build with no credentials falls back to its own cache
 * rather than throwing at import.
 *
 * `no-store` is load-bearing. The build tool keeps its own cache of
 * every request a build makes, and it keeps it between builds, so a
 * read that missed once because the store was empty is answered from
 * that cache forever after: the store fills, and no build ever sees it.
 * Measured, and it is silent, because a stale miss looks exactly like
 * an empty store. The Spotify token reads with the cache left on for
 * the opposite reason, to keep its own route from turning dynamic; the
 * routes reached from here are forced static and prerendered from a
 * fixed list, and stay that way with the cache off.
 */
let client: Redis | null | undefined;
const store = () => {
  if (client !== undefined) return client;
  const configured =
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
  client = configured ? Redis.fromEnv({ cache: "no-store" }) : null;
  return client;
};

/**
 * The record as the shared store holds it, or null when the store has
 * nothing, is not configured, or cannot be reached.
 *
 * This is the copy that outlives a build. A build's own cache is fast
 * and local and is thrown away by any machine that did not make it, so
 * on its own it would mean every fresh checkout, every new host and
 * every evicted cache reading all the destinations again, which is slow
 * while they answer and worthless once they do not. Being unreachable
 * is never fatal here: the caller falls back to reading the
 * destination, exactly as it would for a link it had never met.
 */
export async function readShared(
  url: string
): Promise<AnnotationRecord | null> {
  const redis = store();
  if (!redis) return null;
  try {
    const record = await redis.get<AnnotationRecord>(keyFor(url));
    return record?.url === url ? record : null;
  } catch (error) {
    console.warn(
      `Annotation store unreadable for ${url}: ${error instanceof Error ? error.message : error}`
    );
    return null;
  }
}

/** Keeps the record for every later build, on this machine or another */
export async function writeShared(record: AnnotationRecord): Promise<void> {
  const redis = store();
  if (!redis) return;
  try {
    await redis.set(keyFor(record.url), record);
  } catch (error) {
    console.warn(
      `Annotation store unwritable for ${record.url}: ${error instanceof Error ? error.message : error}`
    );
  }
}
