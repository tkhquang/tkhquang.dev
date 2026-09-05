interface CatalogueHeadpieceProps {
  /* The library room the page belongs to: The Shelves, The Index, ... */
  room: string;
  title: string;
  /* Counts in the masthead's stat-line voice */
  stat: string;
  /* A shelf hue for category rooms: it colors the BAR and the stat
     swatch only, so the room kicker stays in neutral ink */
  hue?: string;
  /* Tag pages: the hash dims, the subject speaks */
  hashed?: boolean;
  /* Category stat lines close with an inline swatch and the hue's name */
  swatchLabel?: string;
}

import AuroraCanvas from "@/components/blog/AuroraCanvas";

/* One header device for every index page: the masthead's own grammar
   (kicker, Fraunces title, accent bar, stat kickers) restated at chapter
   scale over the masthead's own live sky */
const CatalogueHeadpiece = ({
  hashed,
  hue,
  room,
  stat,
  swatchLabel,
  title,
}: CatalogueHeadpieceProps) => (
  <header className="catalogue-headpiece">
    {/* The room sky: three full-bleed layers behind the text, sharing
        one box that reaches up under the transparent header (recipe in
        _03_components.css). The band flag with its grain, which is also
        what paints before the sky fades in and wherever WebGL is missing;
        the blend wrapper holding the live canvas, screen by night onto
        the dusk flag and normal over the Dawn Horizon, as on the
        masthead; and a dissolve to paper. Direct children of the header
        so the canvas's pointer host is the header itself, the way the
        masthead section hosts its sky: moves over the title reach the
        beam. */}
    <div className="catalogue-headpiece__band band band--day" aria-hidden />
    <div
      className="catalogue-headpiece__sky light:mix-blend-normal mix-blend-screen"
      aria-hidden
    >
      <AuroraCanvas />
    </div>
    <div className="catalogue-headpiece__dissolve" aria-hidden />
    <span className="kicker catalogue-headpiece__room">{room}</span>
    <h1 className="catalogue-headpiece__title">
      {hashed && (
        <span className="catalogue-headpiece__hash" aria-hidden>
          {"# "}
        </span>
      )}
      {title}
    </h1>
    <span
      className="catalogue-headpiece__bar"
      style={
        hue
          ? { background: `color-mix(in srgb, ${hue} 60%, transparent)` }
          : undefined
      }
      aria-hidden
    />
    <span className="kicker catalogue-headpiece__stat">
      {stat}
      {hue && swatchLabel && (
        <>
          {" · "}
          <span
            className="catalogue-headpiece__swatch"
            style={{ background: hue }}
            aria-hidden
          />
          {swatchLabel} shelf
        </>
      )}
    </span>
  </header>
);

export default CatalogueHeadpiece;
