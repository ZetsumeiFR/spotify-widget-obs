import { OBSWidget } from "@/components/spotify/obs-widget";
import { redirect } from "next/navigation";

export default async function WidgetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    redirect("/");
  }

  return (
    <div className="h-screen w-screen bg-transparent">
      <OBSWidget token={token} />
    </div>
  );
}
