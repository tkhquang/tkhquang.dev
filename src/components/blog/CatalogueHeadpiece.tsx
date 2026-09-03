interface CatalogueHeadpieceProps {
  /* The library room the page belongs to: The Shelves, The Index, ... */
  room: string;
  title: string;
  /* Counts in the masthead's stat-line voice */
  stat: string;
  /* A shelf hue for category rooms: it colors the BAR and the stat
     swatch only; the room kicker stays neutral ink per the demo */
  hue?: string;
  /* Tag pages: the hash dims, the subject speaks */
  hashed?: boolean;
  /* Category stat lines close with an inline swatch and the hue's name */
  swatchLabel?: string;
}

/* One header device for every index page: the masthead's own grammar
   (kicker, Fraunces title, accent bar, stat kickers) restated at chapter
   scale without the sacred sky */
const CatalogueHeadpiece = ({
  hashed,
  hue,
  room,
  stat,
  swatchLabel,
  title,
}: CatalogueHeadpieceProps) => (
  <header className="catalogue-headpiece">
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
