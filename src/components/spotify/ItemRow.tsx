"use client";

import Image from "@/components/common/NextImage";
import { GrowingUnderline } from "@/components/ui/growing-underline";
import { SpotifyArtist, SpotifyTrack } from "@/models/samples/spotify.models";
import { clsx } from "clsx";
import Link from "next/link";
import { Fragment } from "react";

type SpotifyImage = { height: number; url: string; width: number };

/**
 * Spotify hands back the same art at ~640/300/64px. Pick the smallest one that
 * still covers the rendered box. That keeps a 40px row off the 640px cover.
 */
export function pickImage(
  images: SpotifyImage[] | undefined,
  minWidth: number
): string | null {
  if (!images?.length) {
    return null;
  }

  const ascending = [...images].sort((a, b) => (a.width ?? 0) - (b.width ?? 0));
  const covering = ascending.find((image) => (image.width ?? 0) >= minWidth);

  return (covering ?? ascending[ascending.length - 1]).url;
}

export function getArtistNames(track: SpotifyTrack): string {
  return track.artists?.map((artist) => artist.name).join(", ") || "Unknown";
}

const Rank = ({ rank }: { rank: number }) => (
  <span className="text-theme-on-surface w-5 shrink-0 text-right font-mono text-xs tabular-nums opacity-40">
    {rank}
  </span>
);

/**
 * Makes the whole row clickable without an overlay element.
 *
 * The obvious approach, a stretched `::after` on the title link, cannot work
 * here. The overlay's geometry belongs to the row, but the artist links live
 * inside a flex item, and a flex item paints as one unit: measured in Chromium,
 * an overlay at `z-index: 1` covers a nested link at `z-index: 20`. So the
 * overlay either leaves a third of the row dead or swallows the artist links.
 * There is no z-index that does both.
 *
 * Instead, delegation keeps every anchor a real, ordinary anchor, and the dead
 * space forwards to the track. Clicks that land on a real link are left alone,
 * and so are clicks that finish a text selection.
 */
export function handleRowClick(
  href: string | undefined,
  event: React.MouseEvent<HTMLElement>
) {
  if (!href) {
    return;
  }

  // A real link is already handling this one.
  if ((event.target as HTMLElement).closest("a")) {
    return;
  }

  // Do not navigate out from under someone who was selecting the track name.
  if (window.getSelection()?.toString()) {
    return;
  }

  window.open(href, "_blank", "noopener,noreferrer");
}

export const nestedLinkClassName = "relative z-10 hover:underline";

export const underlineClassName = "group-hover:bg-size-[100%_50%]";

const rowClassName = clsx([
  // `group` drives the underline on row hover; `cursor-pointer` advertises that
  // the whole row is a click target even though only the title is an anchor.
  "group flex cursor-pointer items-center gap-3 rounded-md px-2 py-2",
  "hover:bg-theme-surface transition-colors duration-200",
]);

const titleClassName = "block max-w-full truncate font-medium";

/**
 * Local files carry no `external_urls`, so the fallback is plain text rather
 * than an anchor to "#" that opens a useless tab.
 */
export function SpotifyLink({
  children,
  className,
  href,
  title,
}: {
  children: React.ReactNode;
  href: string | undefined;
  className?: string;
  title?: string;
}) {
  if (!href) {
    return <span className={className}>{children}</span>;
  }

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      title={title}
    >
      {children}
    </Link>
  );
}

/**
 * Cover art, linked to the album when Spotify gives a URL for it. Local files
 * carry no `external_urls`, so a plain image is the fallback rather than a
 * dead link.
 */
export function CoverArt({
  alt,
  className,
  fallback,
  href,
  sizes,
  src,
}: {
  alt: string;
  sizes: string;
  src: string | null;
  className?: string;
  fallback?: React.ReactNode;
  href?: string | null;
}) {
  const content = src ? (
    <Image fill sizes={sizes} src={src} alt={alt} />
  ) : (
    (fallback ?? <div className="bg-theme-surface-dark size-full" />)
  );

  const boxClassName = clsx(["relative shrink-0 overflow-hidden", className]);

  if (!href) {
    return <div className={boxClassName}>{content}</div>;
  }

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={alt}
      className={clsx([boxClassName, "block"])}
    >
      {content}
    </Link>
  );
}

/**
 * Track artists as individual links. Rendered inline in a single line that
 * truncates, so the separators are plain text rather than list markup.
 */
export function ArtistLinks({ track }: { track: SpotifyTrack }) {
  if (!track.artists?.length) {
    return <>Unknown</>;
  }

  return (
    <>
      {track.artists.map((artist, index) => (
        <Fragment key={artist.id || artist.name}>
          {index > 0 && ", "}
          <SpotifyLink
            href={artist.external_urls?.spotify}
            className={nestedLinkClassName}
            title={artist.name}
          >
            {artist.name}
          </SpotifyLink>
        </Fragment>
      ))}
    </>
  );
}

export function AlbumLink({ track }: { track: SpotifyTrack }) {
  const name = track.album?.name;
  const href = track.album?.external_urls?.spotify;

  if (!name) {
    return null;
  }

  if (!href) {
    return <>{name}</>;
  }

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={nestedLinkClassName}
      title={name}
    >
      {name}
    </Link>
  );
}

export function TrackRow({
  rank,
  track,
  trailing,
}: {
  track: SpotifyTrack;
  rank?: number;
  trailing?: React.ReactNode;
}) {
  return (
    <li
      className={rowClassName}
      onClick={(event) => handleRowClick(track.external_urls?.spotify, event)}
    >
      {rank !== undefined && <Rank rank={rank} />}

      <CoverArt
        className="size-10 rounded-sm"
        sizes="40px"
        src={pickImage(track.album?.images, 64)}
        href={track.album?.external_urls?.spotify}
        alt={track.album?.name || track.name}
      />

      <div className="min-w-0 flex-1">
        <SpotifyLink
          href={track.external_urls?.spotify}
          className={titleClassName}
          title={`${track.name} - ${getArtistNames(track)}`}
        >
          <GrowingUnderline className={underlineClassName}>
            {track.name}
          </GrowingUnderline>
        </SpotifyLink>
        <p className="text-theme-on-surface max-w-full truncate text-sm opacity-70">
          <ArtistLinks track={track} />
        </p>
      </div>

      {trailing && (
        <div className="text-theme-on-surface shrink-0 text-xs tabular-nums opacity-60">
          {trailing}
        </div>
      )}
    </li>
  );
}

export function ArtistRow({
  artist,
  rank,
}: {
  artist: SpotifyArtist;
  rank?: number;
}) {
  // Genres are the only extra signal the endpoint gives, and two is all that
  // fits before the row starts wrapping on mobile.
  const genres = artist.genres?.slice(0, 2).join(", ");

  return (
    <li
      className={rowClassName}
      onClick={(event) => handleRowClick(artist.external_urls?.spotify, event)}
    >
      {rank !== undefined && <Rank rank={rank} />}

      {/* Deliberately not a link: the row click already goes here. */}
      <CoverArt
        className="size-10 rounded-full"
        sizes="40px"
        src={pickImage(artist.images, 64)}
        alt={artist.name}
      />

      <div className="min-w-0 flex-1">
        <SpotifyLink
          href={artist.external_urls?.spotify}
          className={titleClassName}
          title={artist.name}
        >
          <GrowingUnderline className={underlineClassName}>
            {artist.name}
          </GrowingUnderline>
        </SpotifyLink>
        {genres && (
          <p className="text-theme-on-surface max-w-full truncate text-sm capitalize opacity-70">
            {genres}
          </p>
        )}
      </div>
    </li>
  );
}
