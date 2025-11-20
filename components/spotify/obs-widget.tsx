"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface Track {
  name: string;
  artists: string;
  album: string;
  albumArt: string | null;
  duration_ms: number;
  progress_ms: number;
}

interface SpotifyData {
  connected: boolean;
  is_playing: boolean;
  track: Track | null;
}

interface OBSWidgetProps {
  token: string;
}

export function OBSWidget({ token }: OBSWidgetProps) {
  const [data, setData] = useState<SpotifyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previousTrackName, setPreviousTrackName] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const fetchCurrentTrack = async () => {
      try {
        const response = await fetch(
          `/api/spotify/current-track?token=${token}`,
        );

        if (!response.ok) {
          setError("Failed to fetch track data");
          return;
        }

        const spotifyData: SpotifyData = await response.json();
        setData(spotifyData);
        setError(null);

        // Track changes for animations
        if (
          spotifyData.track?.name &&
          spotifyData.track.name !== previousTrackName
        ) {
          setPreviousTrackName(spotifyData.track.name);
        }
      } catch (err) {
        setError("Error connecting to Spotify");
        console.error(err);
      }
    };

    // Initial fetch
    fetchCurrentTrack();

    // Poll every 2 seconds for updates
    const interval = setInterval(fetchCurrentTrack, 2000);

    return () => clearInterval(interval);
  }, [token, previousTrackName]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg bg-red-500/20 px-6 py-4 text-red-200 backdrop-blur-sm"
        >
          {error}
        </motion.div>
      </div>
    );
  }

  if (!data?.is_playing || !data.track) {
    return (
      <div className="flex h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white/60"
        >
          No track playing
        </motion.div>
      </div>
    );
  }

  const track = data.track;
  const progress = track.progress_ms / track.duration_ms;
  const intensity = Math.sin(progress * Math.PI); // Creates a wave effect peaking at 50%

  return (
    <div className="flex h-screen items-center justify-center p-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={track.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          {/* Background glow effect */}
          <motion.div
            className="absolute inset-0 -z-10 rounded-full bg-linear-to-br from-purple-500 via-pink-500 to-blue-500 opacity-50 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5 + intensity * 0.3, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <div className="flex flex-col items-center gap-6 rounded-2xl bg-black/40 p-8 backdrop-blur-md">
            {/* Album Art */}
            <motion.div
              className="relative"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.05, 1],
              }}
              transition={{
                rotate: {
                  duration: 30,
                  repeat: Infinity,
                  ease: "linear",
                },
                scale: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
            >
              {/* Glow ring around album */}
              <motion.div
                className="absolute -inset-4 rounded-full bg-linear-to-br from-purple-500 to-pink-500 opacity-60 blur-xl"
                animate={{
                  opacity: [0.4, 0.6 + intensity * 0.4, 0.4],
                  scale: [0.95, 1.05, 0.95],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {track.albumArt ? (
                <Image
                  src={track.albumArt}
                  alt={track.album}
                  className="relative h-64 w-64 rounded-2xl shadow-2xl"
                />
              ) : (
                <div className="relative flex h-64 w-64 items-center justify-center rounded-2xl bg-linear-to-br from-gray-800 to-gray-900 shadow-2xl">
                  <span className="text-4xl">🎵</span>
                </div>
              )}
            </motion.div>

            {/* Track Info */}
            <div className="w-full max-w-md space-y-2 text-center">
              <motion.h1
                initial={{ opacity: 0, filter: "blur(10px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-white"
              >
                {track.name}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, filter: "blur(10px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ delay: 0.3 }}
                className="text-xl text-white/70"
              >
                {track.artists}
              </motion.p>

              <motion.p
                initial={{ opacity: 0, filter: "blur(10px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ delay: 0.4 }}
                className="text-sm text-white/50"
              >
                {track.album}
              </motion.p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md space-y-2">
              <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-linear-to-br from-purple-500 via-pink-500 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${progress * 100}%`,
                  }}
                  transition={{
                    duration: 0.5,
                    ease: "easeOut",
                  }}
                />

                {/* Animated glow on progress bar */}
                <motion.div
                  className="absolute inset-0 bg-linear-to-br from-transparent via-white/30 to-transparent"
                  animate={{
                    x: ["-100%", "200%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{
                    width: "50%",
                  }}
                />
              </div>

              <div className="flex justify-between text-sm text-white/50">
                <span>{formatTime(track.progress_ms)}</span>
                <span>{formatTime(track.duration_ms)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
