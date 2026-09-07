"use client";

import { setPreviewsEnabled, usePreviewsEnabled } from "./previews";
import { prefetchSlipCard, useSlipCard } from "./useSlipCard";
import { SerialInstalment, SerialStar } from "@/components/blog/SeriesPlate";
import type { AnnotationCard, SlipCard } from "@/lib/slips/card";
import { useEffect, useState } from "react";

/* The asterism's dot-and-ring star at glyph size: the mark every link
   with a slip wears */
export const SlipStar = () => (
  <svg viewBox="0 0 12 12" width="9" height="9" aria-hidden>
    <circle cx="6" cy="6" r="1.4" fill="currentColor" />
    <circle
      cx="6"
      cy="6"
      r="4.2"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.9"
    />
  </svg>
);

const Dot = () => <span aria-hidden>·</span>;

/* A commit hash reads as its first seven characters, as GitHub prints it */
const shortRef = (ref: string) =>
  /^[0-9a-f]{40}$/.test(ref) ? ref.slice(0, 7) : ref;

const stateLabel = { open: "Open", closed: "Closed", merged: "Merged" };

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

/* The switch unmounts the button that was pressed, so focus is handed
   to the card around it first, or it would fall to the body and a
   screen reader would hear nothing of what changed */
export const switchPreviews = (
  event: React.MouseEvent<HTMLButtonElement>,
  on: boolean
) => {
  const dialog = event.currentTarget.closest<HTMLElement>("[data-dialog]");
  dialog?.focus();
  setPreviewsEnabled(on);
};

/* Markup the build already made safe: the site's own sections, and
   third-party bodies reduced to GitHub's allowance on the way in */
const Prose = ({ html }: { html: string }) => (
  <div className="slip__prose" dangerouslySetInnerHTML={{ __html: html }} />
);

/* Wide cards hold a page, a document or a section; the rest hold a
   note's worth */
export const slipWidthFor = (card: SlipCard | null): string => {
  if (!card) return "";
  if (card.kind === "post") return "slip--wide";
  const { annotation } = card;
  switch (annotation.kind) {
    case "page":
      return annotation.framable || annotation.snapshot ? "slip--wide" : "";
    case "youtube":
    case "github-blob":
    case "github-repo":
    case "github-issue":
    case "github-comment":
      return "slip--wide";
    default:
      return "";
  }
};

interface FootProps {
  anchor: React.ComponentProps<"a">;
  href: string;
  open: string;
  archive?: { url: string; timestamp: string };
  children?: React.ReactNode;
}

/* The archive.org timestamp is fourteen digits; the day is the first eight */
const archiveDate = (timestamp: string) =>
  `${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}-${timestamp.slice(6, 8)}`;

/* The reader's switch over hover: the mark keeps opening the card on a
   click either way, so the switch only says what a pointer resting on a
   link does */
const HoverSwitch = () => {
  const hoverEnabled = usePreviewsEnabled();
  return (
    <button
      type="button"
      className="slip__pref"
      onClick={(event) => switchPreviews(event, !hoverEnabled)}
    >
      {hoverEnabled ? "Turn hover previews off" : "Turn hover previews on"}
    </button>
  );
};

/* The card's own links open the way the link they preview opens: the
   posts send their cross-references to a new tab to keep the reader's
   place, and a card that navigated in this one would throw that place
   away. The card carries the article's scope classes, so these anchors
   take the article's link dress and its leaving-the-page glyph. */
const Foot = ({ anchor, archive, children, href, open }: FootProps) => (
  <div className="slip__foot kicker">
    {children && <span>{children}</span>}
    <span className="slip__actions">
      <a href={href} target={anchor.target} rel={anchor.rel}>
        {open}
      </a>
      {archive && (
        <>
          <Dot />
          <a
            href={archive.url}
            target="_blank"
            rel="nofollow noopener noreferrer"
            title={`archive.org copy of ${archiveDate(archive.timestamp)}`}
          >
            Archived copy
          </a>
        </>
      )}
      <Dot />
      <HoverSwitch />
    </span>
  </div>
);

const PostCard = ({
  anchor,
  card,
}: {
  anchor: React.ComponentProps<"a">;
  card: Extract<SlipCard, { kind: "post" }>;
}) => {
  const { html, preview, scope } = card;
  const section = scope === "section" ? preview.section : undefined;
  return (
    <>
      <div className="slip__head kicker">
        {section ? (
          <span className="slip__context">{preview.title}</span>
        ) : (
          <>
            <span className="slip__shelf"># {preview.categoryTitle}</span>
            <Dot />
            <span>{preview.date}</span>
            {preview.seriesPart && preview.seriesTotal ? (
              <>
                <Dot />
                <span className="slip__instalment">
                  <SerialStar />
                  <SerialInstalment
                    part={preview.seriesPart}
                    total={preview.seriesTotal}
                  />
                </span>
              </>
            ) : null}
          </>
        )}
      </div>
      <p className="slip__title">{section ? section.title : preview.title}</p>
      {!section && preview.lede && <p className="slip__lede">{preview.lede}</p>}
      <Prose html={html} />
      <Foot
        anchor={anchor}
        href={preview.href}
        open={section ? "Open the section" : "Open the entry"}
      >
        {preview.minutes} min read
      </Foot>
    </>
  );
};

/* The page live, over its own snapshot: the still shows the moment the
   card opens and the frame fades in over it once the page has loaded,
   so a slow destination never leaves the card blank */
const LiveFrame = ({
  annotation,
}: {
  annotation: Extract<AnnotationCard, { kind: "page" }>;
}) => {
  const [loaded, setLoaded] = useState(false);
  const { snapshot } = annotation;
  return (
    <div className="slip__live" data-loaded={loaded || undefined}>
      {snapshot && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          className="slip__live-still"
          src={snapshot.src}
          width={snapshot.width}
          height={snapshot.height}
          alt=""
          loading="lazy"
          decoding="async"
        />
      )}
      <iframe
        className="slip__frame"
        src={annotation.url}
        title={annotation.title}
        loading="lazy"
        referrerPolicy="no-referrer"
        /* The page keeps its scripts and its own origin; it may not
           steer this one */
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
};

const PageBody = ({
  annotation,
}: {
  annotation: Extract<AnnotationCard, { kind: "page" }>;
}) => {
  if (annotation.framable) {
    return <LiveFrame annotation={annotation} />;
  }
  if (annotation.snapshot) {
    const { snapshot } = annotation;
    return (
      <div className="slip__snapshot">
        {/* A plain img: the copy is the site's own file, sized as taken,
            and next/image would only add a second pipeline for it */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={snapshot.src}
          width={snapshot.width}
          height={snapshot.height}
          alt={`${annotation.title}, as it stood on ${snapshot.taken.slice(0, 10)}`}
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }
  if (annotation.image) {
    return (
      <div className="slip__picture">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={annotation.image}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }
  return null;
};

const AnnotationBody = ({
  anchor,
  annotation,
}: {
  anchor: React.ComponentProps<"a">;
  annotation: AnnotationCard;
}) => {
  const { archive } = annotation;
  switch (annotation.kind) {
    case "page":
      return (
        <>
          <div className="slip__head kicker">
            <span className="slip__context">{annotation.site}</span>
            {annotation.snapshot && !annotation.framable && (
              <>
                <Dot />
                <span>
                  Snapshot of {annotation.snapshot.taken.slice(0, 10)}
                </span>
              </>
            )}
          </div>
          <p className="slip__title">{annotation.title}</p>
          {annotation.description && (
            <p className="slip__excerpt">{annotation.description}</p>
          )}
          <PageBody annotation={annotation} />
          <Foot
            anchor={anchor}
            href={annotation.url}
            open="Open the page"
            archive={archive}
          >
            {annotation.framable ? "Live" : annotation.site}
          </Foot>
        </>
      );
    case "wikipedia":
      return (
        <>
          <div className="slip__head kicker">
            <span>Wikipedia</span>
            {annotation.description && (
              <>
                <Dot />
                <span className="slip__context">{annotation.description}</span>
              </>
            )}
          </div>
          <p className="slip__title">{annotation.title}</p>
          {/* One block for the picture and the lead, so the picture can
              float beside the words as the encyclopaedia sets it; the
              card's column would otherwise stack it as a row of its own */}
          <div className="slip__lead">
            {annotation.thumbnail && (
              <div className="slip__thumbnail">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={annotation.thumbnail.src}
                  width={annotation.thumbnail.width}
                  height={annotation.thumbnail.height}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <Prose html={annotation.extractHtml} />
          </div>
          <Foot
            anchor={anchor}
            href={annotation.url}
            open="Open the article"
            archive={archive}
          >
            Wikipedia
          </Foot>
        </>
      );
    case "youtube":
      return (
        <>
          <div className="slip__head kicker">
            <span>YouTube</span>
            <Dot />
            <span className="slip__context">{annotation.author}</span>
          </div>
          <p className="slip__title">{annotation.title}</p>
          <iframe
            className="slip__video"
            src={`https://www.youtube-nocookie.com/embed/${annotation.id}`}
            title={annotation.title}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          <Foot
            anchor={anchor}
            href={annotation.url}
            open="Open the video"
            archive={archive}
          >
            YouTube
          </Foot>
        </>
      );
    case "github-repo":
      return (
        <>
          <div className="slip__head kicker">
            <span>GitHub</span>
            {annotation.language && (
              <>
                <Dot />
                <span>{annotation.language}</span>
              </>
            )}
            <Dot />
            <span>{plural(annotation.stars, "star", "stars")}</span>
          </div>
          <p className="slip__title">
            {annotation.owner}/{annotation.repo}
          </p>
          {annotation.description && (
            <p className="slip__excerpt">{annotation.description}</p>
          )}
          {annotation.readmeHtml && <Prose html={annotation.readmeHtml} />}
          <Foot
            anchor={anchor}
            href={annotation.url}
            open="Open the repository"
            archive={archive}
          >
            {annotation.readmeHtml ? "Readme" : "GitHub"}
          </Foot>
        </>
      );
    case "github-issue":
      return (
        <>
          <div className="slip__head kicker">
            <span>
              {annotation.owner}/{annotation.repo}
            </span>
            <Dot />
            <span>#{annotation.number}</span>
            <Dot />
            <span>{stateLabel[annotation.state]}</span>
            {annotation.when && (
              <>
                <Dot />
                <span>{annotation.when}</span>
              </>
            )}
          </div>
          <p className="slip__title">{annotation.title}</p>
          {annotation.bodyHtml && <Prose html={annotation.bodyHtml} />}
          <Foot
            anchor={anchor}
            href={annotation.url}
            open={
              annotation.isPull ? "Open the pull request" : "Open the issue"
            }
            archive={archive}
          >
            By {annotation.author}
            {annotation.comments > 0 && (
              <>
                {" "}
                <Dot /> {plural(annotation.comments, "comment", "comments")}
              </>
            )}
          </Foot>
        </>
      );
    case "github-comment":
      return (
        <>
          <div className="slip__head kicker">
            <span>
              {annotation.owner}/{annotation.repo}
            </span>
            <Dot />
            <span>#{annotation.number}</span>
            <Dot />
            <span>{annotation.author}</span>
            {annotation.when && (
              <>
                <Dot />
                <span>{annotation.when}</span>
              </>
            )}
          </div>
          <p className="slip__title">{annotation.title}</p>
          <Prose html={annotation.bodyHtml} />
          <Foot
            anchor={anchor}
            href={annotation.url}
            open="Open the comment"
            archive={archive}
          >
            {annotation.author} wrote
          </Foot>
        </>
      );
    case "github-commit":
      return (
        <>
          <div className="slip__head kicker">
            <span>
              {annotation.owner}/{annotation.repo}
            </span>
            <Dot />
            <span>{shortRef(annotation.sha)}</span>
            <Dot />
            <span>{annotation.author}</span>
            {annotation.when && (
              <>
                <Dot />
                <span>{annotation.when}</span>
              </>
            )}
          </div>
          <p className="slip__title">{annotation.title}</p>
          {annotation.message && (
            <pre className="slip__message">{annotation.message}</pre>
          )}
          {annotation.files.length > 0 && (
            <ul className="slip__files">
              {annotation.files.map((file) => (
                <li key={file}>{file}</li>
              ))}
            </ul>
          )}
          <Foot
            anchor={anchor}
            href={annotation.url}
            open="Open the commit"
            archive={archive}
          >
            +{annotation.additions} -{annotation.deletions} in{" "}
            {plural(annotation.files.length, "file", "files")}
          </Foot>
        </>
      );
    case "github-blob":
      return (
        <>
          <div className="slip__head kicker">
            <span>
              {annotation.owner}/{annotation.repo}
            </span>
            <Dot />
            <span>{shortRef(annotation.ref)}</span>
          </div>
          <p className="slip__title slip__title--path">{annotation.path}</p>
          {annotation.bodyHtml ? (
            <Prose html={annotation.bodyHtml} />
          ) : annotation.codeHtml ? (
            <div
              className="slip__code"
              dangerouslySetInnerHTML={{ __html: annotation.codeHtml }}
            />
          ) : null}
          <Foot
            anchor={anchor}
            href={annotation.url}
            open="Open the file"
            archive={archive}
          >
            {annotation.bodyHtml
              ? "Rendered"
              : `Lines ${annotation.startLine} to ${annotation.endLine} of ${annotation.totalLines}`}
          </Foot>
        </>
      );
    case "github-tree":
      return (
        <>
          <div className="slip__head kicker">
            <span>
              {annotation.owner}/{annotation.repo}
            </span>
            <Dot />
            <span>{shortRef(annotation.ref)}</span>
          </div>
          <p className="slip__title slip__title--path">
            {annotation.path || annotation.repo}
          </p>
          {annotation.description && (
            <p className="slip__excerpt">{annotation.description}</p>
          )}
          {annotation.entries.length > 0 && (
            <ul className="slip__files">
              {annotation.entries.map((entry) => (
                <li key={entry.name} data-type={entry.type}>
                  {entry.name}
                  {entry.type === "dir" ? "/" : ""}
                </li>
              ))}
            </ul>
          )}
          <Foot
            anchor={anchor}
            href={annotation.url}
            open="Open the directory"
            archive={archive}
          >
            {plural(annotation.entries.length, "entry", "entries")}
          </Foot>
        </>
      );
  }
};

/* The name a card is announced by */
export const cardTitle = (card: SlipCard): string => {
  if (card.kind === "post") {
    return card.scope === "section" && card.preview.section
      ? card.preview.section.title
      : card.preview.title;
  }
  const { annotation } = card;
  switch (annotation.kind) {
    case "github-repo":
      return `${annotation.owner}/${annotation.repo}`;
    case "github-blob":
      return annotation.path;
    case "github-tree":
      return annotation.path || annotation.repo;
    default:
      return annotation.title;
  }
};

export const SlipCardView = ({
  anchor,
  card,
}: {
  anchor: React.ComponentProps<"a">;
  card: SlipCard;
}) =>
  card.kind === "post" ? (
    <PostCard anchor={anchor} card={card} />
  ) : (
    <AnnotationBody anchor={anchor} annotation={card.annotation} />
  );

/* The card by key: asked for on the first render that needs it and
   printed as soon as it arrives, or a line saying there is none */
export const FetchedSlip = ({
  anchor,
  href,
  slip,
}: {
  anchor: React.ComponentProps<"a">;
  href: string;
  slip: string;
}) => {
  const state = useSlipCard(slip);

  useEffect(() => {
    prefetchSlipCard(slip);
  }, [slip]);

  if (state.status === "ready") {
    return <SlipCardView anchor={anchor} card={state.card} />;
  }
  if (state.status === "missing" || state.status === "failed") {
    return (
      <>
        <span className="kicker slip__kicker">
          {state.status === "failed"
            ? "The card did not arrive"
            : "No card for this link"}
        </span>
        <p className="slip__excerpt">
          <a href={href} target={anchor.target} rel={anchor.rel}>
            Open it
          </a>
        </p>
      </>
    );
  }
  return <span className="kicker slip__kicker">Fetching the card&hellip;</span>;
};
