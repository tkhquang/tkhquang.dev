import CatalogueHeadpiece from "@/components/blog/CatalogueHeadpiece";
import { Site } from "@/constants/meta";
import classNames from "classnames";
import { ArrowDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Metadata, ResolvingMetadata } from "next/types";

const DESCRIPTION =
  "The typefaces, the article pipeline, the lookup, and the services behind this site.";
const SOURCE_URL = `${Site.REPOSITORY.url}/blob/${Site.REPOSITORY.branch}`;

/**
 * Link to a file in the repository, given its path from the root.
 *
 * GitHub's blob viewer answers 404 to a literal square bracket in a path, so a
 * dynamic route segment has to arrive percent-encoded. `encodeURI` is the right
 * tool rather than `encodeURIComponent`: it escapes the brackets while leaving
 * the separators and the route groups' parentheses readable in the address bar.
 */
function sourceUrl(path: string) {
  return `${SOURCE_URL}${encodeURI(path)}`;
}

const ExternalLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {children}
    <span className="sr-only"> (opens in a new tab)</span>
  </a>
);

const TYPEFACES = [
  {
    name: "Fraunces",
    href: "https://fonts.google.com/specimen/Fraunces",
    role: "Wordmark and display titles",
    sample: "Ljóss",
    className: "font-display text-4xl font-semibold [font-optical-sizing:auto]",
  },
  {
    name: "Montserrat",
    href: "https://fonts.google.com/specimen/Montserrat",
    role: "Body text and interface",
    sample: "The details are where it starts.",
    className: "font-sans text-xl",
  },
  {
    name: "Merriweather",
    href: "https://fonts.google.com/specimen/Merriweather",
    role: "Ledes and quotations",
    sample: "A note in the margin.",
    className: "font-serif text-xl italic",
  },
  {
    name: "Source Code Pro",
    href: "https://fonts.google.com/specimen/Source+Code+Pro",
    role: "Code and small labels",
    sample: "const answer = 42;",
    className: "font-mono text-xl",
  },
];

const PUBLISHING_STEPS = [
  {
    stage: "Source",
    title: "Markdown",
    description:
      "Text, frontmatter, figures, and markers for interactive components.",
  },
  {
    stage: "Server",
    title: "Prepare",
    description:
      "remark and rehype process the article. Shiki colors code; Mermaid becomes SVG.",
  },
  {
    stage: "Browser",
    title: "Read & interact",
    description:
      "The article arrives as HTML. React connects the interactive controls.",
  },
];

export const dynamic = "force-static";

export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { alternates } = await parent;

  return {
    /* Setting a canonical replaces alternates, so retain the layout's feed. */
    alternates: {
      canonical: "/blog/colophon",
      types: alternates?.types ?? undefined,
    },
    description: DESCRIPTION,
    /* Same reason the (blog) layout carries one: a page that only set
       `description` would still unfurl with the segment's card copy */
    openGraph: {
      description: DESCRIPTION,
      images: [{ url: Site.METADATA.coverImageUrl }],
      title: "Colophon",
      type: "website",
      url: "/blog/colophon",
    },
    title: "Colophon",
  };
}

export default function ColophonPage() {
  return (
    <div className="relative mx-auto mb-12 max-w-(--breakpoint-md) px-4 sm:px-6 lg:px-8">
      <CatalogueHeadpiece
        room="The Imprint"
        title="Colophon"
        stat="Type and tools · how the pages work"
      />
      <article className="article">
        <div className="article__content wrap-break-word">
          <div className="typography">
            <p className="article__lede my-4 font-serif text-lg italic opacity-85">
              I built this site for my work and my writing. Here is what goes
              into it.
            </p>
            <p>
              The <Link href="/">homepage</Link> covers the engineering. Ljóss
              holds the investigations, the game devlogs, and the posts that are
              not about either. The{" "}
              <Link href="/blog/posts/the-foundation-of-ljoss">
                foundation post
              </Link>{" "}
              explains the name and why I started it. The code is on{" "}
              <ExternalLink href={Site.REPOSITORY.url}>GitHub</ExternalLink>.
            </p>
          </div>

          <section aria-labelledby="typefaces">
            <div className="typography">
              <h2 id="typefaces">Typefaces</h2>
              <p>
                Four faces, each with a job. These samples use the same font
                files as the rest of the site; the names link to their
                specimens.
              </p>
            </div>
            <dl className="border-theme-hairline-soft my-6 border-y">
              {TYPEFACES.map((typeface) => (
                <div
                  key={typeface.name}
                  className="border-theme-hairline-soft grid items-center gap-x-8 gap-y-3 border-b py-5 last:border-b-0 sm:grid-cols-[11rem_minmax(0,1fr)]"
                >
                  <dt className="typography text-sm">
                    <ExternalLink href={typeface.href}>
                      {typeface.name}
                    </ExternalLink>
                    <span className="mt-1 block text-xs opacity-75">
                      {typeface.role}
                    </span>
                  </dt>
                  <dd
                    className={classNames(
                      "m-0 min-w-0 leading-relaxed",
                      typeface.className
                    )}
                  >
                    {typeface.sample}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="typography">
              <p>
                <code>next/font</code> supplies the screen fonts. The resume
                uses static Inter and Source Code Pro files from Fontsource
                because Chromium was drawing the variable-font glyphs as paths
                in the PDF. The measurements and fix are in{" "}
                <Link href="/blog/posts/every-letter-in-this-pdf-is-a-drawing">
                  Every Letter in This PDF Is a Drawing
                </Link>
                .
              </p>
            </div>
          </section>

          <section aria-labelledby="from-file-to-page">
            <div className="typography">
              <h2 id="from-file-to-page">From File to Page</h2>
              <p>
                Next.js and React provide the pages. The{" "}
                <ExternalLink href={sourceUrl("/src/lib/MarkdownParser.ts")}>
                  article pipeline
                </ExternalLink>{" "}
                runs on the server:
              </p>
            </div>
            <figure
              className="border-theme-hairline-soft my-6 rounded-xs border"
              aria-labelledby="publishing-caption"
            >
              <ol className="m-0 grid list-none gap-8 p-5 sm:grid-cols-3">
                {PUBLISHING_STEPS.map((step, index) => (
                  <li key={step.stage} className="relative min-w-0">
                    <span className="kicker block">
                      {index + 1}. {step.stage}
                    </span>
                    <strong className="mt-2 block text-base">
                      {step.title}
                    </strong>
                    <p className="mt-2 mb-0 text-sm leading-relaxed opacity-85">
                      {step.description}
                    </p>
                    {index < PUBLISHING_STEPS.length - 1 && (
                      <>
                        <ArrowDown
                          className="text-theme-primary absolute top-[calc(100%+0.5rem)] left-0 size-4 sm:hidden"
                          aria-hidden
                        />
                        <ArrowRight
                          className="text-theme-primary absolute top-8 -right-6 hidden size-4 sm:block"
                          aria-hidden
                        />
                      </>
                    )}
                  </li>
                ))}
              </ol>
              <figcaption
                id="publishing-caption"
                className="border-theme-hairline-soft border-t px-5 py-3 font-serif text-sm italic"
              >
                Reading starts with HTML. Interaction adds browser code where an
                explanation needs it.
              </figcaption>
            </figure>
            <div className="typography">
              <ul>
                <li>
                  <strong>Figures and code:</strong> captions, heading links,
                  syntax highlighting, and diagrams are prepared with the text.
                </li>
                <li>
                  <strong>Interactive explanations:</strong> the{" "}
                  <Link href="/blog/posts/devlog-kingdom-come-deliverance-ii-building-a-proper-third-person-camera#a-simpler-rig">
                    camera simulation
                  </Link>{" "}
                  and{" "}
                  <Link href="/blog/posts/the-object-already-knows-its-own-name#the-same-failure-three-ways">
                    byte diff
                  </Link>{" "}
                  let you drive the thing the post is explaining.
                </li>
                <li>
                  <strong>Reading tools:</strong> image inspection, copy
                  buttons, and marginal notes run in the browser.
                </li>
              </ul>
            </div>
          </section>

          <section aria-labelledby="the-lookup">
            <div className="typography">
              <h2 id="the-lookup">The Lookup</h2>
              <p>
                The archive carries a field that reads every published entry. There is no search server behind it: the matching happens
                in the browser, and the words typed are never sent anywhere. The{" "}
                <ExternalLink href={sourceUrl("/search-engine/src/query.rs")}>
                  engine
                </ExternalLink>{" "}
                is Rust compiled to WebAssembly, and the same module writes the
                files at build time and reads them back in the tab, so one
                tokenizer decides what a word is on both sides.
              </p>
              <p>
                A build writes three files, and only one of them is fetched
                whole. It holds the dictionary, the entry rows and the offsets,
                and it starts downloading when the field takes focus rather than
                when the first key lands, so the wait sits in front of the first
                keystroke instead of after it. The other two are read a range at
                a time: the posting lists of the words actually typed, and one
                window of reading text for each result printed. Growing a word
                one letter at a time reads nothing it already holds.
              </p>
              <ul>
                <li>
                  <strong>Every word has to land.</strong> The last one is still
                  being typed, so it reaches every ending of itself; the rest
                  are taken as written.
                </li>
                <li>
                  <strong>Order comes from BM25,</strong> with a bonus for words
                  that stand next to each other in the entry. A line break parts
                  two words the reader never saw together, so a phrase is not
                  found across the seam between a caption and the paragraph
                  beside it.
                </li>
                <li>
                  <strong>A word the ledger does not hold</strong> is answered
                  by the nearest one it does, counting two characters the wrong
                  way round as a single slip. Both words are named under the
                  count, because a name typed deliberately should not be
                  quietly overruled.
                </li>
              </ul>
              <p>
                Two failures are worth stating. Without JavaScript the field is
                hidden and the archive list stands on its own. And the addresses
                of all three files carry a digest of the index, so a page left
                open across a deploy finds its next range missing and says the
                ledger has been reprinted, rather than quoting text whose
                offsets belong to another build.
              </p>
            </div>
          </section>

          <section className="typography" aria-labelledby="services">
            <h2 id="services">Services</h2>
            <ul>
              <li>
                <strong>Music:</strong> Spotify supplies the footer track and{" "}
                <Link href="/music">listening page</Link>. A failed first fetch
                leaves a link to that page; later failures can leave the
                previous track showing.{" "}
                <Link href="/blog/posts/wiring-the-spotify-web-api-into-this-blog">
                  How the integration works
                </Link>
                .
              </li>
              <li>
                <strong>Views:</strong> Upstash Redis stores article counts.
                Recording a view and reading the count are separate requests.
              </li>
              <li>
                <strong>Comments:</strong> Giscus loads a GitHub discussion
                below the article. The text remains readable if the thread fails
                to load.
              </li>
              <li>
                <strong>Subscriptions:</strong>{" "}
                <ExternalLink href="https://buttondown.com/ljoss">
                  Buttondown
                </ExternalLink>{" "}
                for email, or the <a href="/blog/feed.xml">Atom feed</a> for a
                reader.
              </li>
              <li>
                <strong>Analytics:</strong> Vercel Analytics and Speed Insights.
                Google Analytics loads when a measurement ID is configured.
              </li>
            </ul>
          </section>

          <section className="typography" aria-labelledby="cache-settings">
            <h2 id="cache-settings">Cache Settings</h2>
            <p>
              These are configured intervals; how much reuse they buy depends on
              the cache in front of them and on the deployment. I last read them
              off the{" "}
              <ExternalLink href={Site.REPOSITORY.url}>source</ExternalLink> on{" "}
              <time dateTime="2026-09-09">September 9, 2026</time>.
            </p>
            <ul>
              <li>
                <strong>
                  <ExternalLink
                    href={sourceUrl("/app/(blog)/blog/posts/[slug]/page.tsx")}
                  >
                    Articles
                  </ExternalLink>
                  :
                </strong>{" "}
                generated routes, with no timed revalidation. The{" "}
                <ExternalLink href={sourceUrl("/app/(default)/page.tsx")}>
                  homepage
                </ExternalLink>{" "}
                declares one day.
              </li>
              <li>
                <strong>
                  <ExternalLink
                    href={sourceUrl("/src/services/spotify/index.ts")}
                  >
                    Spotify
                  </ExternalLink>
                  :
                </strong>{" "}
                five minutes for recent plays; one day for top items.
              </li>
              <li>
                <strong>
                  <ExternalLink href={sourceUrl("/app/api/pageviews/route.ts")}>
                    View counts
                  </ExternalLink>
                  :
                </strong>{" "}
                60 seconds in a shared cache, with 300 seconds of
                stale-while-revalidate.
              </li>
              <li>
                <strong>
                  <ExternalLink href={sourceUrl("/app/api/pdf/route.ts")}>
                    PDF
                  </ExternalLink>
                  :
                </strong>{" "}
                temporary files reused for up to a week. This cache belongs to
                each instance and may disappear between deployments.
              </li>
            </ul>
          </section>
        </div>
      </article>
    </div>
  );
}
