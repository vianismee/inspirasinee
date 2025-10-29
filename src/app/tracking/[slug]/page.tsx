import { TrackingApp } from "@/components/Tracking/Tracking";
import { TrackingErrorBoundary } from "@/components/Tracking/TrackingErrorBoundary";

export default async function TrackingSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Basic server validation only - NO database queries
  if (!slug || typeof slug !== 'string' || slug.length < 6 || slug.length > 20) {
    return (
      <div className="w-full flex justify-center items-center min-h-screen">
        <div className="text-center p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Invalid tracking number
          </h2>
          <p className="text-gray-600">
            Please check your tracking number and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <TrackingErrorBoundary>
        <TrackingApp params={slug} />
      </TrackingErrorBoundary>
    </div>
  );
}
