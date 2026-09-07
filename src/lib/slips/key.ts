import crypto from "crypto";

/* The word an author writes as a markdown link's title to ask for a
   slip; a raw anchor asks with data-preview instead */
export const PREVIEW_TITLE = "preview";

/* The name a link's card is served under: twelve hex characters of the
   href's hash, enough to keep every link on the site apart and short
   enough to read in a network panel */
export const getSlipKey = (href: string): string =>
  crypto.createHash("sha1").update(href).digest("hex").slice(0, 12);
