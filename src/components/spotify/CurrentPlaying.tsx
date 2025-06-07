"use client";

import { intervalToDuration } from "date-fns";
import { useEffect, useState } from "react";
import { SiSpotify } from "react-icons/si";
import { FormattedMessage } from "react-intl";
import LoaderLines from "@/components/common/loader/LoaderLines";
import Image from "@/components/common/NextImage";
import { CurrentPlayingResponse } from "@/models/samples/spotify.models";

const CurrentPlaying = () => {
  const [data, setData] = useState<CurrentPlayingResponse | null>(null);

  useEffect(() => {
    (async () => {
      const response = await fetch(`/api/spotify/current-playing`);
      const json = await response.json();

      setData(json);
    })();
  }, []);

  if (!data) {
    return (
      <div className="relative h-28">
        <LoaderLines />
      </div>
    );
  }

  const trackDuration = intervalToDuration({
    end: data.item?.duration_ms,
    start: 0,
  });

  const progressDuration = intervalToDuration({
    end: data.progress_ms,
    start: 0,
  });

  return (
    <a
      target="_blank"
      rel="noopener noreferer"
      href={
        data?.is_playing
          ? data.item.external_urls.spotify
          : "https://open.spotify.com/user/erence21?si=yTsrZT5JSHOp7tn3ist7Ig"
      }
      className="relative flex w-full flex-col items-center space-y-2 rounded-md border p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-center space-x-2">
        <div className="relative size-16">
          {data?.is_playing ? (
            <Image
              className="w-16 shadow-sm"
              src={data?.item.album.images?.[0]?.url}
              alt={data?.item.album.name}
              fill
              loader={({ src }) => src}
            />
          ) : (
            <SiSpotify size={64} color={"#1ED760"} />
          )}
        </div>
        <div className="flex-1">
          <p className="component font-bold">
            {data?.is_playing ? data.item.name : "Not Listening"}
          </p>
          <p className="font-dark text-xs">
            {data?.is_playing
              ? data.item.album.artists.map((artist) => artist.name).join(", ")
              : "Spotify"}
          </p>
        </div>

        <div className="absolute bottom-1.5 right-1.5">
          <SiSpotify size={20} color={"#1ED760"} />
        </div>
      </div>

      <div className="inline-flex w-full text-sm">
        <FormattedMessage
          id="duration"
          values={{
            minutes: progressDuration.minutes || 0,
            seconds: progressDuration.seconds || 0,
          }}
        />
        /
        <FormattedMessage
          id="duration"
          values={{
            minutes: trackDuration.minutes || 0,
            seconds: trackDuration.seconds || 0,
          }}
        />
      </div>
    </a>
  );
};

export default CurrentPlaying;
