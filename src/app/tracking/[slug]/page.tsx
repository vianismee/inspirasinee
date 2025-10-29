"use client";

import { TrackingApp } from "@/components/Tracking/Tracking";
import { TrackingErrorBoundary } from "@/components/Tracking/TrackingErrorBoundary";
import { useEffect, useState } from "react";

// Force client-side runtime to prevent 500 errors
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function TrackingSlugPage() {
  const [slug, setSlug] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Get slug from URL pathname
    const pathname = window.location.pathname;
    const slugMatch = pathname.match(/\/tracking\/([^\/]+)/);
    if (slugMatch) {
      setSlug(slugMatch[1]);
    }
  }, []);

  // Basic client validation only - NO server processing
  if (!isClient) {
    return (
      <div className="w-full flex justify-center items-center min-h-screen">
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
