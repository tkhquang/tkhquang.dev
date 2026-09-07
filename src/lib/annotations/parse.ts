/* Which reader a link that leaves the site is handed to. A destination
   the site can ask something specific of (GitHub's API, Wikipedia's
   summary, YouTube's oEmbed) gets its own reader; everything else is a
   page, read from its own head. */
export type LinkTarget =
  | { kind: "page"; url: string }
  | { kind: "wikipedia"; url: string; title: string }
  | { kind: "youtube"; url: string; id: string }
  | { kind: "github-repo"; url: string; owner: string; repo: string }
  | {
      kind: "github-issue";
      url: string;
      owner: string;
      repo: string;
      number: number;
    }
  | {
      kind: "github-comment";
      url: string;
      owner: string;
      repo: string;
      number: number;
      commentId: number;
    }
  | {
      kind: "github-commit";
      url: string;
      owner: string;
      repo: string;
      sha: string;
    }
  | {
      kind: "github-blob";
      url: string;
      owner: string;
      repo: string;
      ref: string;
      path: string;
      startLine?: number;
      endLine?: number;
    }
  | {
      kind: "github-tree";
      url: string;
      owner: string;
      repo: string;
      ref: string;
      path: string;
    };

const OWN_HOSTS = new Set(["tkhquang.dev", "www.tkhquang.dev"]);

/* A host that is not a public name: the posts show local addresses as
   examples, and a reader for those would only knock on the author's own
   dev server, or on whatever else answers on the build machine's
   network. Loopback, link-local and the private ranges are all left
   alone, by name and by number. */
const PRIVATE_ADDRESS =
  /^(127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0$|172\.(1[6-9]|2\d|3[01])\.|\[?(::1|fc|fd|fe80))/i;

export const isLocalHost = (host: string) =>
  !host.includes(".") ||
  host.endsWith(".local") ||
  host.endsWith(".internal") ||
  PRIVATE_ADDRESS.test(host);

function classifyGithub(url: URL): LinkTarget {
  const [owner, repo, ...rest] = url.pathname.split("/").filter(Boolean);
  const href = url.href;
  if (!owner || !repo) return { kind: "page", url: href };
  const name = repo.replace(/\.git$/, "");
  const base = { url: href, owner, repo: name };

  if (rest.length === 0) return { kind: "github-repo", ...base };

  const [area, second, ...tail] = rest;
  const number = Number(second);

  if ((area === "issues" || area === "pull") && Number.isInteger(number)) {
    const comment = /^#issuecomment-(\d+)$/.exec(url.hash);
    if (comment) {
      return {
        kind: "github-comment",
        ...base,
        number,
        commentId: Number(comment[1]),
      };
    }
    /* A commit listed under a pull request is still that commit */
    if (tail[0] === "commits" && tail[1]) {
      return { kind: "github-commit", ...base, sha: tail[1] };
    }
    return { kind: "github-issue", ...base, number };
  }

  if (area === "commit" && second) {
    return { kind: "github-commit", ...base, sha: second };
  }

  if (area === "blob" && second && tail.length > 0) {
    const lines = /^#L(\d+)(?:-L(\d+))?$/.exec(url.hash);
    return {
      kind: "github-blob",
      ...base,
      ref: second,
      path: tail.join("/"),
      ...(lines
        ? {
            startLine: Number(lines[1]),
            endLine: Number(lines[2] ?? lines[1]),
          }
        : {}),
    };
  }

  if (area === "tree" && second) {
    return { kind: "github-tree", ...base, ref: second, path: tail.join("/") };
  }

  /* Discussions, releases, wiki pages and the rest read as pages */
  return { kind: "page", url: href };
}

/**
 * Reads what kind of destination a link points at, or returns null for a
 * link the slip leaves alone: anything that is not http(s), a local
 * address, or this site's own absolute address.
 */
export function classifyLink(href: string): LinkTarget | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase();
  if (isLocalHost(host) || OWN_HOSTS.has(host)) return null;

  if (host === "github.com" || host === "www.github.com") {
    return classifyGithub(url);
  }

  if (/^[a-z]+\.wikipedia\.org$/.test(host)) {
    const match = /^\/wiki\/([^/]+)$/.exec(url.pathname);
    if (match) {
      return {
        kind: "wikipedia",
        url: url.href,
        title: decodeURIComponent(match[1]),
      };
    }
  }

  if (host === "www.youtube.com" || host === "youtube.com") {
    const id = url.searchParams.get("v");
    if (url.pathname === "/watch" && id) {
      return { kind: "youtube", url: url.href, id };
    }
  }
  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    if (id) return { kind: "youtube", url: url.href, id };
  }

  return { kind: "page", url: url.href };
}
