"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export function AuthForm() {
  const [isLoading, setIsLoading] = useState(false);

  const handleOAuthSignIn = async (provider: "twitch" | "kick") => {
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: provider,
      });
    } catch {
      toast.error("Erreur lors de la connexion");
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Se connecter</CardTitle>
        <CardDescription>
          Connectez-vous avec votre compte Twitch ou Kick
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* OAuth Providers */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => handleOAuthSignIn("twitch")}
            disabled={isLoading}
            className="w-full"
          >
            <svg
              className="mr-2 h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
            </svg>
            Twitch
          </Button>

          <Button
            variant="outline"
            onClick={() => handleOAuthSignIn("kick")}
            disabled={isLoading}
            className="w-full"
          >
            <svg
              className="mr-2 h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M20.205 0H3.795A3.795 3.795 0 0 0 0 3.795v16.41A3.795 3.795 0 0 0 3.795 24h16.41A3.795 3.795 0 0 0 24 20.205V3.795A3.795 3.795 0 0 0 20.205 0zm-7.102 17.846-5.128-5.128 5.128-5.128v3.59h3.59v3.076h-3.59v3.59z" />
            </svg>
            Kick
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
