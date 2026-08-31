import SpotifyNowPlaying from "@/components/spotify/NowPlaying";
import classNames from "classnames";

const CURRENTLY_MODDING = "KCD2 third person camera";
const BASED_IN = "Ho Chi Minh City · GMT+7";

const ROW_LABEL_CLASS =
  "font-mono text-xs font-semibold tracking-wider uppercase opacity-65 self-center";

/**
 * The "Right now" status plate: the page's alive detail. The listening row is
 * live Spotify data; the modding row is a hand-edited constant.
 */
const RightNow = ({ className }: { className?: string }) => {
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
      <dl className="mt-4 grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-3 text-sm">
        <dt className={ROW_LABEL_CLASS}>Listening</dt>
        <dd className="m-0 min-w-0 [--artist-color:var(--on-surface)] [--song-color:var(--on-surface)]">
          <SpotifyNowPlaying showCover songEffect="underline" />
        </dd>
        <dt className={ROW_LABEL_CLASS}>Modding</dt>
        <dd className="m-0 min-w-0">{CURRENTLY_MODDING}</dd>
        <dt className={ROW_LABEL_CLASS}>Based in</dt>
        <dd className="m-0 min-w-0">{BASED_IN}</dd>
      </dl>
    </div>
  );
};

export default RightNow;
