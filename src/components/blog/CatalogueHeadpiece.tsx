interface CatalogueHeadpieceProps {
  /* The library room the page belongs to: The Shelves, The Index, ... */
  room: string;
  title: string;
  /* Counts in the masthead's stat-line voice */
  stat: string;
  /* A shelf hue for category rooms; primary otherwise */
  hue?: string;
}

/* One header device for every index page: the masthead's own grammar
   (kicker, Fraunces title, accent bar, stat kickers) restated at chapter
   scale without the sacred sky */
const CatalogueHeadpiece = ({ hue, room, stat, title }: CatalogueHeadpieceProps) => (
  <header className="catalogue-headpiece">
    <span
      className="kicker catalogue-headpiece__room"
      style={hue ? { color: hue } : undefined}
    >
      {room}
    </span>
    <h1 className="catalogue-headpiece__title">{title}</h1>
    <span
      className="catalogue-headpiece__bar"
      style={
        hue
          ? { background: `color-mix(in srgb, ${hue} 60%, transparent)` }
          : undefined
      }
      aria-hidden
    />
    <span className="kicker catalogue-headpiece__stat">{stat}</span>
  </header>
);

export default CatalogueHeadpiece;
