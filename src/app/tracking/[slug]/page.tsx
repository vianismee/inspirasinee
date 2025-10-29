import { TrackingApp } from "@/components/Tracking/Tracking";

export default async function TrackingSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="w-full flex justify-center">
      <TrackingApp params={slug} />
    </div>
  );
}
