import CrossReferenceSlip from "./CrossReferenceSlip";

type CrossReferenceProps = React.ComponentProps<"a"> & {
  /* The key the card is served under, set by rehype-cross-references */
  "data-slip"?: string;
  /* The link's own words, for naming the mark before its card exists */
  "data-slip-name"?: string;
};

/**
 * A link the post marked for a slip: the anchor as authored, handed to
 * the client island with the key its card is fetched under. The
 * registry hands this the anchor's own props, so a link that reached
 * here without a key (or without an address) renders as exactly the
 * anchor the post wrote.
 */
export default function CrossReference({
  children,
  "data-slip": slip,
  "data-slip-name": name,
  ...anchor
}: CrossReferenceProps) {
  if (!slip || !anchor.href) {
    return <a {...anchor}>{children}</a>;
  }
  return (
    <CrossReferenceSlip anchor={anchor} slip={slip} name={name}>
      {children}
    </CrossReferenceSlip>
  );
}
