"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";

interface CurrentTrackData {
  connected: boolean;
  is_playing: boolean;
  track: {
    name: string;
    artists: string;
    album: string;
    albumArt: string | null;
    duration_ms: number;
    progress_ms: number;
    duration_formatted: string;
    progress_formatted: string;
  } | null;
}

export function CurrentTrack() {
  const [trackData, setTrackData] = useState<CurrentTrackData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentTrack = async () => {
    try {
      const response = await fetch("/api/spotify/current-track");
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404 && !data.connected) {
          setTrackData({ connected: false, is_playing: false, track: null });
          setError(null);
          return;
        }
        throw new Error(data.error || "Failed to fetch track");
      }

      setTrackData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentTrack();

    // Poll every 5 seconds for updates
    const interval = setInterval(fetchCurrentTrack, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleConnectSpotify = async () => {
    try {
      await authClient.signIn.social({
        provider: "spotify",
        callbackURL: window.location.href,
      });
    } catch (err) {
      console.error("Failed to connect Spotify:", err);
      setError("Failed to connect Spotify account");
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Spotify Now Playing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (trackData && !trackData.connected) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connect Spotify</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Connect your Spotify account to track what you&apos;re currently
            listening to.
          </p>
          <Button onClick={handleConnectSpotify}>
            Connect Spotify Account
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Spotify Now Playing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!trackData?.track || !trackData.is_playing) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Spotify Now Playing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No track currently playing
          </p>
        </CardContent>
      </Card>
    );
  }

  const { track } = trackData;
  const progressPercentage = (track.progress_ms / track.duration_ms) * 100;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Now Playing on Spotify</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20 rounded-md">
            <AvatarImage
              src={track.albumArt || undefined}
              alt={track.album}
              className="object-cover"
            />
            <AvatarFallback className="rounded-md">
              {track.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{track.name}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {track.artists}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {track.album}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{track.progress_formatted}</span>
            <span>{track.duration_formatted}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
