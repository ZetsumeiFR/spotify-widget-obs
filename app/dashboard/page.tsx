import { CurrentTrack } from "@/components/spotify/current-track";
import { WidgetURLGenerator } from "@/components/spotify/widget-url-generator";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth");
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-8 py-12">
      <div>
        <h1 className="text-3xl font-bold">Spotify Widget Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your Spotify widget for OBS and streaming
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CurrentTrack />
        <WidgetURLGenerator />
      </div>
    </div>
  );
}
