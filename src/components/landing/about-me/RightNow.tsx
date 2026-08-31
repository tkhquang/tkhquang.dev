import LocalTime from "@/components/landing/about-me/LocalTime";
import SpotifyNowPlaying from "@/components/spotify/NowPlaying";
import { Portfolio } from "@/constants/meta";
import classNames from "classnames";

const ROW_LABEL_CLASS =
  "font-mono text-[0.7rem] font-semibold tracking-wide uppercase opacity-65";

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
      <dl className="mt-4 grid grid-cols-[5rem_minmax(0,1fr)] items-baseline gap-x-3 gap-y-3.5 text-sm">
        <dt className={ROW_LABEL_CLASS}>Listening</dt>
        <dd className="m-0 min-w-0 [--artist-color:var(--on-surface)] [--song-color:var(--on-surface)]">
          <SpotifyNowPlaying showCover songEffect="underline" />
        </dd>
        <dt className={ROW_LABEL_CLASS}>Modding</dt>
        <dd className="m-0 min-w-0">{modding}</dd>
        <dt className={ROW_LABEL_CLASS}>Based in</dt>
        <dd className="m-0 min-w-0">
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
