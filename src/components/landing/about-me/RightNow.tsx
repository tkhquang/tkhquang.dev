import LocalTime from "@/components/landing/about-me/LocalTime";
import SpotifyNowPlaying from "@/components/spotify/NowPlaying";
import { Portfolio } from "@/constants/meta";
import classNames from "classnames";

/*
 * Every first line in the plate is a 24px line box (the Spotify cover is
 * 24px tall), so labels and values sit on the same line regardless of the
 * row's content.
 */
const ROW_LABEL_CLASS =
  "font-mono text-[0.7rem] leading-6 font-semibold tracking-wide uppercase opacity-65";

const ROW_VALUE_CLASS = "m-0 min-w-0 leading-6";

/**
 * The "Right now" status plate: the page's alive detail. The listening row is
 * live Spotify data; the rest is configured in Portfolio.RIGHT_NOW.
 */
const RightNow = ({ className }: { className?: string }) => {
  const { basedIn, modding } = Portfolio.RIGHT_NOW;

  return (
    <div
      className={classNames(
        "bg-theme-raised border-theme-hairline-soft rounded-xl border p-5 shadow-sm",
        className
      )}
    >
      <span className="kicker text-theme-primary block">
        Right now <span aria-hidden="true">⚡</span>
      </span>
      <dl className="mt-4 grid grid-cols-[5rem_minmax(0,1fr)] items-start gap-x-3 gap-y-3 text-xs">
        <dt className={ROW_LABEL_CLASS}>Listening</dt>
        <dd
          className={classNames(
            ROW_VALUE_CLASS,
            "[--artist-color:var(--on-surface)] [--song-color:var(--on-surface)]"
          )}
        >
          <SpotifyNowPlaying showCover songEffect="underline" />
        </dd>
        <dt className={ROW_LABEL_CLASS}>Modding</dt>
        <dd className={ROW_VALUE_CLASS}>{modding}</dd>
        <dt className={ROW_LABEL_CLASS}>Based in</dt>
        <dd className={ROW_VALUE_CLASS}>
          <LocalTime
            city={basedIn.city}
            gmtLabel={basedIn.gmtLabel}
            timeZone={basedIn.timeZone}
          />
        </dd>
      </dl>
    </div>
  );
};

export default RightNow;
