import { TrackRow } from "@/components/spotify/ItemRow";
import { PlayHistoryItem } from "@/models/samples/spotify.models";
import { formatDistanceToNowStrict } from "date-fns";

/**
 * Timestamps render as relative distances, not wall-clock times, on purpose.
 * This component renders on the server, so an absolute time prints in the
 * server's timezone. The page also revalidates every few minutes. "2 hours
 * ago" absorbs the staleness that "14:23" exposes.
 */
export default function RecentlyPlayed({
  items,
}: {
  items: PlayHistoryItem[];
}) {
  if (!items.length) {
    return (
      <p className="text-theme-on-surface py-8 text-center text-sm opacity-70">
        No plays to show right now.
      </p>
    );
  }

  return (
    <ol className="-mx-2">
      {items.map(({ played_at, track }, index) => (
        <TrackRow
          // A track can legitimately appear twice, so the play timestamp is the
          // only stable key here.
          key={`${played_at}-${track.id}`}
          rank={index + 1}
          track={track}
          trailing={
            <time dateTime={played_at} title={played_at}>
              {formatDistanceToNowStrict(new Date(played_at), {
                addSuffix: true,
              })}
            </time>
          }
        />
      ))}
    </ol>
  );
}
