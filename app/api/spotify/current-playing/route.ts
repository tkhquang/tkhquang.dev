import { NextRequest, NextResponse } from "next/server";
import { getNowPlaying } from "@/services/spotify";

export async function GET(request: NextRequest) {
  try {
    const data = await getNowPlaying();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "An error occurred while processing the request" },
      { status: 500 }
    );
  }
}
