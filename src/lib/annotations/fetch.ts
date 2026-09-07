import { extractReadable } from "./extract";
import { parseHtmlMeta } from "./html";
import { isLocalHost, type LinkTarget } from "./parse";
import { sanitizeHtml } from "./sanitize";
import type {
  Annotation,
  GithubBlobAnnotation,
  GithubIssueAnnotation,
  PageAnnotation,
} from "./types";
import lamplightDark from "@/assets/shiki/lamplight-dark.json";
import lamplightLight from "@/assets/shiki/lamplight-light.json";
import {
  codeToHtml,
  type ShikiTransformer,
  type ThemeRegistrationRaw,
} from "shiki";

const REQUEST_TIMEOUT_MS = 8_000;

/* How much of a file a blob card prints: the linked range, capped, or
   the head of the file when the link names no lines */
const BLOB_RANGE_CAP = 200;
const BLOB_HEAD_LINES = 40;

/* The same browser string the remote image fetch sends: a head that is
   served to browsers and withheld from bots still has to answer */
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36";

async function request(url: string, headers: Record<string, string> = {}) {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, ...headers },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`.trim());
  }
  return response;
}

async function readJson<T>(
  url: string,
  headers: Record<string, string> = {}
): Promise<T> {
  const response = await request(url, {
    Accept: "application/json",
    ...headers,
  });
  return (await response.json()) as T;
}

/* The API answers without a token, sixty times an hour, which fills a
   fresh checkout's cache once; with the site's token it answers freely.
   The html media type hands back bodies GitHub has already rendered,
   which the card prints after its own sanitizing. */
const githubHeaders = (accept = "application/vnd.github+json") => ({
  Accept: accept,
  "X-GitHub-Api-Version": "2022-11-28",
  ...(process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    : {}),
});

const readGithub = <T>(route: string, accept?: string) =>
  readJson<T>(`https://api.github.com${route}`, githubHeaders(accept));

const readGithubHtml = async (route: string) => {
  const response = await request(
    `https://api.github.com${route}`,
    githubHeaders("application/vnd.github.html")
  );
  return response.text();
};

async function fetchPage(url: string): Promise<PageAnnotation> {
  const response = await request(url, { Accept: "text/html" });
  /* A public address may redirect to a private one; what answered is
     what counts */
  if (isLocalHost(new URL(response.url).hostname)) {
    throw new Error("the page redirected to a private address");
  }
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("text/html")) {
    throw new Error(`not a page: ${type || "no content type"}`);
  }
  /* Read once and used twice: the head for what the page calls itself,
     the body for what it actually says */
  const html = await response.text();
  const meta = parseHtmlMeta(html);
  if (!meta.title) throw new Error("the page names no title");
  const { hostname } = new URL(url);
  return {
    kind: "page",
    url,
    site: meta.siteName ?? hostname.replace(/^www\./, ""),
    title: meta.title,
    description: meta.description,
    image: meta.image,
    /* Resolved against where the page actually answered, not where it
       was asked, so a link in the extract survives a redirect */
    extractHtml: extractReadable(html, response.url) ?? undefined,
  };
}

interface WikipediaSummary {
  title: string;
  description?: string;
  extract_html?: string;
  thumbnail?: { source: string; width: number; height: number };
}

async function fetchWikipedia(url: string, title: string): Promise<Annotation> {
  const { hostname } = new URL(url);
  const summary = await readJson<WikipediaSummary>(
    `https://${hostname}/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  );
  if (!summary.extract_html) throw new Error("the summary has no extract");
  return {
    kind: "wikipedia",
    url,
    title: summary.title,
    description: summary.description,
    extractHtml: sanitizeHtml(summary.extract_html, url),
    thumbnail: summary.thumbnail
      ? {
          src: summary.thumbnail.source,
          width: summary.thumbnail.width,
          height: summary.thumbnail.height,
        }
      : undefined,
  };
}

interface YoutubeEmbed {
  title: string;
  author_name: string;
}

async function fetchYoutube(url: string, id: string): Promise<Annotation> {
  const embed = await readJson<YoutubeEmbed>(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
  );
  return {
    kind: "youtube",
    url,
    id,
    title: embed.title,
    author: embed.author_name,
  };
}

interface GithubRepo {
  description: string | null;
  language: string | null;
  stargazers_count: number;
}

interface GithubIssue {
  title: string;
  state: "open" | "closed";
  user: { login: string } | null;
  created_at: string;
  comments: number;
  body_html?: string | null;
  pull_request?: unknown;
}

interface GithubPull {
  merged: boolean;
}

interface GithubComment {
  user: { login: string } | null;
  created_at: string;
  body_html?: string | null;
}

interface GithubCommit {
  commit: {
    message: string;
    author: { name: string; date: string } | null;
  };
  stats?: { additions: number; deletions: number };
  files?: { filename: string }[];
}

interface GithubContent {
  name: string;
  type: string;
}

const HTML_JSON = "application/vnd.github.html+json";

async function fetchGithubIssue(
  target: Extract<LinkTarget, { kind: "github-issue" }>
): Promise<GithubIssueAnnotation> {
  const { owner, repo, number, url } = target;
  const issue = await readGithub<GithubIssue>(
    `/repos/${owner}/${repo}/issues/${number}`,
    HTML_JSON
  );
  const isPull = Boolean(issue.pull_request);
  /* A merged pull request closes as merged, which the issues route does
     not say; only the pulls route knows */
  const merged = isPull
    ? (await readGithub<GithubPull>(`/repos/${owner}/${repo}/pulls/${number}`))
        .merged
    : false;
  return {
    kind: "github-issue",
    url,
    owner,
    repo,
    number,
    title: issue.title,
    state: merged ? "merged" : issue.state,
    isPull,
    author: issue.user?.login ?? "ghost",
    createdAt: issue.created_at,
    comments: issue.comments,
    bodyHtml: issue.body_html ? sanitizeHtml(issue.body_html, url) : undefined,
  };
}

/* The lamplight pair, as the article's code printing sets it: both inks
   on every token, the theme attribute the article's rules key on, and
   the line marks and numbering the same rules expect */
async function highlight(
  code: string,
  path: string,
  startLine: number
): Promise<string> {
  const extension = path.split(".").pop()?.toLowerCase() ?? "";
  const digits = String(startLine + code.split("\n").length).length;
  const transformers: ShikiTransformer[] = [
    {
      pre(node) {
        node.properties["data-theme"] = "dark light";
        delete node.properties.style;
      },
      code(node) {
        node.properties["data-theme"] = "dark light";
        node.properties["data-line-numbers"] = "";
        node.properties["data-line-numbers-max-digits"] = String(digits);
        /* The counter that prints the numbers starts one short of the
             first line printed */
        node.properties.style = `counter-reset: line ${startLine - 1}`;
      },
      line(node) {
        node.properties["data-line"] = "";
      },
    },
  ];
  const options = {
    themes: {
      dark: lamplightDark as unknown as ThemeRegistrationRaw,
      light: lamplightLight as unknown as ThemeRegistrationRaw,
    },
    defaultColor: false as const,
    transformers,
  };
  return codeToHtml(code, { ...options, lang: extension }).catch(() =>
    /* A language shiki does not know prints as plain text in the same
       frame, numbered the same way */
    codeToHtml(code, { ...options, lang: "text" })
  );
}

async function fetchGithubBlob(
  target: Extract<LinkTarget, { kind: "github-blob" }>
): Promise<GithubBlobAnnotation> {
  const { owner, repo, ref, path, startLine, endLine, url } = target;
  const base = { kind: "github-blob" as const, url, owner, repo, ref, path };

  /* A markdown file is a document, printed rendered rather than as its
     source; the lines a link into it might name are ignored */
  if (/\.(md|markdown)$/i.test(path)) {
    const html = await readGithubHtml(
      `/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`
    );
    return {
      ...base,
      startLine: 1,
      endLine: 0,
      totalLines: 0,
      bodyHtml: sanitizeHtml(html, url),
    };
  }

  const response = await request(
    `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`
  );
  const all = (await response.text()).split(/\r?\n/);
  /* A trailing newline reads as an empty last line; it is not one */
  if (all[all.length - 1] === "") all.pop();
  const start = startLine ? Math.max(1, startLine) : 1;
  const end = startLine
    ? Math.min(endLine ?? startLine, start + BLOB_RANGE_CAP - 1, all.length)
    : Math.min(BLOB_HEAD_LINES, all.length);
  const lines = all.slice(start - 1, end);
  return {
    ...base,
    startLine: start,
    endLine: end,
    totalLines: all.length,
    codeHtml: await highlight(lines.join("\n"), path, start),
  };
}

/**
 * Asks the destination what it is, by whichever route the target names,
 * and throws with a plain reason when the destination gives nothing a
 * card could print.
 */
export async function fetchAnnotation(target: LinkTarget): Promise<Annotation> {
  switch (target.kind) {
    case "page":
      return fetchPage(target.url);
    case "wikipedia":
      return fetchWikipedia(target.url, target.title);
    case "youtube":
      return fetchYoutube(target.url, target.id);
    case "github-repo": {
      const { owner, repo, url } = target;
      const data = await readGithub<GithubRepo>(`/repos/${owner}/${repo}`);
      /* A repository without a readme is still a repository */
      const readme = await readGithubHtml(
        `/repos/${owner}/${repo}/readme`
      ).catch(() => undefined);
      return {
        kind: "github-repo",
        url,
        owner,
        repo,
        description: data.description ?? undefined,
        language: data.language ?? undefined,
        stars: data.stargazers_count,
        /* The readme's relative links are written against the tree it
           lives in, which is where GitHub resolves them too */
        readmeHtml: readme
          ? sanitizeHtml(
              readme,
              `https://github.com/${owner}/${repo}/blob/HEAD/`
            )
          : undefined,
      };
    }
    case "github-issue":
      return fetchGithubIssue(target);
    case "github-comment": {
      const { owner, repo, number, commentId, url } = target;
      const [comment, issue] = await Promise.all([
        readGithub<GithubComment>(
          `/repos/${owner}/${repo}/issues/comments/${commentId}`,
          HTML_JSON
        ),
        readGithub<GithubIssue>(`/repos/${owner}/${repo}/issues/${number}`),
      ]);
      if (!comment.body_html) throw new Error("the comment has no body");
      return {
        kind: "github-comment",
        url,
        owner,
        repo,
        number,
        title: issue.title,
        author: comment.user?.login ?? "ghost",
        createdAt: comment.created_at,
        bodyHtml: sanitizeHtml(comment.body_html, url),
      };
    }
    case "github-commit": {
      const { owner, repo, sha, url } = target;
      const data = await readGithub<GithubCommit>(
        `/repos/${owner}/${repo}/commits/${sha}`
      );
      const [title, ...rest] = data.commit.message.split(/\r?\n/);
      return {
        kind: "github-commit",
        url,
        owner,
        repo,
        sha,
        title,
        message: rest.join("\n").trim(),
        author: data.commit.author?.name ?? "unknown",
        date: data.commit.author?.date ?? "",
        additions: data.stats?.additions ?? 0,
        deletions: data.stats?.deletions ?? 0,
        files: (data.files ?? []).map((file) => file.filename),
      };
    }
    case "github-blob":
      return fetchGithubBlob(target);
    case "github-tree": {
      const { owner, repo, ref, path, url } = target;
      const [data, contents] = await Promise.all([
        readGithub<GithubRepo>(`/repos/${owner}/${repo}`),
        readGithub<GithubContent[]>(
          `/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`
        ),
      ]);
      return {
        kind: "github-tree",
        url,
        owner,
        repo,
        ref,
        path,
        description: data.description ?? undefined,
        entries: (Array.isArray(contents) ? contents : []).map((entry) => ({
          name: entry.name,
          type:
            entry.type === "dir" || entry.type === "file"
              ? entry.type
              : "other",
        })),
      };
    }
  }
}
