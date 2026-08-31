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
      {/* Full width with flex-1 triggers so the three ranges fit a 320px
          viewport; styled to match the homepage persona filter */}
      <TabsList className="border-theme-hairline-soft mb-4 h-auto w-full gap-1 rounded-lg border bg-transparent p-1 sm:w-auto">
        {TOP_ITEMS_TIME_RANGES.map(({ label, value }) => (
          <TabsTrigger
            key={value}
            value={value}
            className="data-[state=active]:bg-theme-primary data-[state=active]:text-theme-on-primary flex-1 rounded-md px-2 py-1.5 font-mono text-xs font-semibold sm:flex-initial sm:px-3.5"
          >
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
