import HexDiffView from "./HexDiffView";
import { parseHexDiff } from "./parse";
import "server-only";

export default function HexDiff({ source }: { source: string }) {
  const prepared = parseHexDiff(source);

  return <HexDiffView key={prepared.id} example={prepared} />;
}
