import { TrackingApp } from "@/components/Tracking/Tracking";

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const fetchCache = 'force-no-store';
export const revalidate = 0;
export const runtime = 'nodejs';

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
