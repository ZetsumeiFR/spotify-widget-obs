"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function WidgetURLGenerator() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const widgetURL =
    token && typeof window !== "undefined"
      ? `${window.location.origin}/widget/spotify?token=${token}`
      : "";

  useEffect(() => {
    fetchToken();
  }, []);

  const fetchToken = async () => {
    try {
      const response = await fetch("/api/widget/generate-token");
      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
      }
    } catch (error) {
      console.error("Failed to fetch token:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateToken = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/widget/generate-token", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        toast.success("Widget URL generated!");
      } else {
        toast.error("Failed to generate widget URL");
      }
    } catch (error) {
      console.error("Failed to generate token:", error);
      toast.error("Failed to generate widget URL");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (widgetURL) {
      navigator.clipboard.writeText(widgetURL);
      toast.success("Widget URL copied to clipboard!");
    }
  };

  const openInNewTab = () => {
    if (widgetURL) {
      window.open(widgetURL, "_blank");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>OBS Widget URL</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>OBS Widget URL</CardTitle>
        <CardDescription>
          Use this URL in OBS as a Browser Source to display your Spotify widget
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!token ? (
          <Button onClick={generateToken} disabled={generating}>
            {generating ? "Generating..." : "Generate Widget URL"}
          </Button>
        ) : (
          <>
            <div className="flex gap-2">
              <Input value={widgetURL} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                title="Copy to clipboard"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={openInNewTab}
                title="Open in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-semibold">How to use in OBS:</p>
              <ol className="mt-2 list-inside list-decimal space-y-1 text-muted-foreground">
                <li>Add a new Browser Source in OBS</li>
                <li>Paste the URL above</li>
                <li>
                  Set width to 1920 and height to 1080 (or your canvas size)
                </li>
                <li>
                  Enable &quot;Shutdown source when not visible&quot; to save
                  resources
                </li>
              </ol>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
