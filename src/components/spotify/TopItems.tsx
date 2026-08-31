"use client";

import { ArtistRow, TrackRow } from "@/components/spotify/ItemRow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TOP_ITEMS_TIME_RANGES } from "@/constants/spotify";
import {
  SpotifyArtist,
  SpotifyTrack,
  TopItemsTimeRange,
} from "@/models/samples/spotify.models";
import { formatTrackDuration } from "@/utils/date";

export type TopItemsByRange = {
  artists: Record<TopItemsTimeRange, SpotifyArtist[]>;
  tracks: Record<TopItemsTimeRange, SpotifyTrack[]>;
};

const Column = ({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) => (
  <div className="min-w-0">
    <h3 className="text-theme-on-surface mb-2 px-2 text-xs font-bold tracking-wider uppercase opacity-60">
      {title}
    </h3>
    {children}
  </div>
);

const Empty = () => (
  <p className="text-theme-on-surface px-2 py-8 text-sm opacity-70">
    Nothing here yet.
  </p>
);

export default function TopItems({ artists, tracks }: TopItemsByRange) {
  return (
    <Tabs defaultValue="short_term">
      <TabsList className="mb-4">
        {TOP_ITEMS_TIME_RANGES.map(({ label, value }) => (
          <TabsTrigger key={value} value={value}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      {TOP_ITEMS_TIME_RANGES.map(({ value }) => (
        <TabsContent key={value} value={value}>
          <div className="grid gap-6 md:grid-cols-2">
            <Column title="Top tracks">
              {tracks[value]?.length ? (
                <ol className="-mx-2">
                  {tracks[value].map((track, index) => (
                    <TrackRow
                      key={track.id}
                      rank={index + 1}
                      track={track}
                      trailing={formatTrackDuration(track.duration_ms)}
                    />
                  ))}
                </ol>
              ) : (
                <Empty />
              )}
            </Column>

            <Column title="Top artists">
              {artists[value]?.length ? (
                <ol className="-mx-2">
                  {artists[value].map((artist, index) => (
                    <ArtistRow
                      key={artist.id}
                      rank={index + 1}
                      artist={artist}
                    />
                  ))}
                </ol>
              ) : (
                <Empty />
              )}
            </Column>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
