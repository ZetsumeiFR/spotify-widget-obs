import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { widgetToken } from "@/lib/db/schema";
import { SpotifyService } from "@/lib/spotify";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null;

    // Check for widget token in query params
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (token) {
      // Validate widget token
      const widgetTokenRecord = await db.query.widgetToken.findFirst({
        where: eq(widgetToken.token, token),
      });

      if (!widgetTokenRecord) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }

      userId = widgetTokenRecord.userId;
    } else {
      // Fall back to session authentication
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = session.user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has connected Spotify
    const spotifyAccount = await SpotifyService.getSpotifyAccount(userId);

    if (!spotifyAccount) {
      return NextResponse.json(
        { error: "Spotify account not connected", connected: false },
        { status: 404 },
      );
    }

    // Get currently playing track
    const currentTrack = await SpotifyService.getUserCurrentTrack(userId);

    if (!currentTrack) {
      return NextResponse.json(
        { error: "Unable to fetch playback data", connected: true },
        { status: 500 },
      );
    }

    // Return formatted response
    return NextResponse.json({
      connected: true,
      is_playing: currentTrack.is_playing,
      track: currentTrack.item
        ? {
            name: currentTrack.item.name,
            artists: currentTrack.item.artists.map((a) => a.name).join(", "),
            album: currentTrack.item.album.name,
            albumArt:
              currentTrack.item.album.images[0]?.url ||
              currentTrack.item.album.images[1]?.url ||
              null,
            duration_ms: currentTrack.item.duration_ms,
            progress_ms: currentTrack.progress_ms,
            duration_formatted: SpotifyService.formatTime(
              currentTrack.item.duration_ms,
            ),
            progress_formatted: SpotifyService.formatTime(
              currentTrack.progress_ms,
            ),
          }
        : null,
    });
  } catch (error) {
    console.error("Spotify API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
