import { getSlipCard } from "@/lib/slips/cards";
import { collectSlipTargets, type SlipTarget } from "@/lib/slips/targets";

/* Every card is written at build, one JSON file per link the posts have
   marked; nothing here runs on a request. A key outside the set is not
   a route at all. */
export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = false;

/* The scan reads every post; one pass serves the whole build worker.
   The dev server rescans per request instead, so a link marked while
   it runs is served without a restart. */
let targetsPromise: Promise<Map<string, SlipTarget>> | undefined;
const getTargets = () =>
  process.env.NODE_ENV === "production"
    ? (targetsPromise ??= collectSlipTargets())
    : collectSlipTargets();

export async function generateStaticParams() {
  const targets = await getTargets();
  return [...targets.keys()].map((key) => ({ key }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const target = (await getTargets()).get(key);
  /* A link nothing could be served for still gets its file, holding
     null, so the slip learns there is no card instead of waiting on an
     error */
  const card = target ? await getSlipCard(target.href) : null;
  return Response.json(card);
}
