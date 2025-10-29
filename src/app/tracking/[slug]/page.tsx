"use client";

import { TrackingApp } from "@/components/Tracking/Tracking";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function TrackingSlugPage() {
  const params = useParams();
  const [slug, setSlug] = useState<string>("");

  useEffect(() => {
    if (params && params.slug && typeof params.slug === "string") {
      setSlug(params.slug);
    }
  }, [params]);

  if (!slug) {
    return (
      <div className="w-full flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <TrackingApp params={slug} />
    </div>
  );
}
