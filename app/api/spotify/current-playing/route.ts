import { CurrentPlayingRouteResponse } from "@/models/samples/spotify.models";
import { getNowPlaying, getRecentlyPlayed } from "@/services/spotify";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await getNowPlaying();
    if (data) {
      return NextResponse.json<CurrentPlayingRouteResponse>(data);
    }

    // getNowPlaying is false when the player is empty or holds something
    // other than a track (an episode, an ad). Only then is the newest play
    // the last song: while a track is loaded, even paused, the newest play
    // is the one before it.
    const [lastPlayed] = await getRecentlyPlayed(1);
    return NextResponse.json<CurrentPlayingRouteResponse>({
      lastPlayed: lastPlayed ?? null,
    });
  } catch {
    // getNowPlaying has already logged the cause
    return NextResponse.json(
      { error: "An error occurred while processing the request" },
      { status: 500 }
    );
  }
}
