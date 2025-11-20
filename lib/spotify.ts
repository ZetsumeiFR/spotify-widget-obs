import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { account } from "./db/schema";

export interface SpotifyTrack {
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  duration_ms: number;
}

export interface SpotifyCurrentlyPlaying {
  is_playing: boolean;
  progress_ms: number;
  item: SpotifyTrack | null;
}

export class SpotifyService {
  private static SPOTIFY_API_BASE = "https://api.spotify.com/v1";
  private static SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

  /**
   * Get Spotify account tokens for a user
   */
  static async getSpotifyAccount(userId: string) {
    const accounts = await db
      .select()
      .from(account)
      .where(and(eq(account.userId, userId), eq(account.providerId, "spotify")))
      .limit(1);

    return accounts[0] || null;
  }

  /**
   * Refresh Spotify access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    expires_in: number;
  }> {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Spotify credentials not configured");
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64",
    );

    const response = await fetch(this.SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Update access token in database
   */
  static async updateAccessToken(
    userId: string,
    newAccessToken: string,
    expiresIn: number,
  ) {
    const expiresAt = Date.now() + expiresIn * 1000;

    await db
      .update(account)
      .set({
        accessToken: newAccessToken,
        accessTokenExpiresAt: new Date(expiresAt),
      })
      .where(
        and(eq(account.userId, userId), eq(account.providerId, "spotify")),
      );
  }

  /**
   * Get valid access token (refresh if expired)
   */
  static async getValidAccessToken(userId: string): Promise<string | null> {
    const spotifyAccount = await this.getSpotifyAccount(userId);

    if (!spotifyAccount) {
      return null;
    }

    const now = Date.now();
    const expiresAt = spotifyAccount.accessTokenExpiresAt
      ? new Date(spotifyAccount.accessTokenExpiresAt).getTime()
      : 0;

    // If token is expired or expires in less than 5 minutes, refresh it
    if (expiresAt - now < 5 * 60 * 1000) {
      if (!spotifyAccount.refreshToken) {
        throw new Error("No refresh token available");
      }

      const { access_token, expires_in } = await this.refreshAccessToken(
        spotifyAccount.refreshToken,
      );

      await this.updateAccessToken(userId, access_token, expires_in);

      return access_token;
    }

    return spotifyAccount.accessToken || null;
  }

  /**
   * Get currently playing track from Spotify API
   */
  static async getCurrentlyPlaying(
    accessToken: string,
  ): Promise<SpotifyCurrentlyPlaying | null> {
    const response = await fetch(
      `${this.SPOTIFY_API_BASE}/me/player/currently-playing`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    // 204 means no content (nothing is playing)
    if (response.status === 204) {
      return {
        is_playing: false,
        progress_ms: 0,
        item: null,
      };
    }

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get user's currently playing track (handles token refresh automatically)
   */
  static async getUserCurrentTrack(
    userId: string,
  ): Promise<SpotifyCurrentlyPlaying | null> {
    const accessToken = await this.getValidAccessToken(userId);

    if (!accessToken) {
      return null;
    }

    return this.getCurrentlyPlaying(accessToken);
  }

  /**
   * Format milliseconds to MM:SS
   */
  static formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
}
