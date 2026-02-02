"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "../ui/button";
import { AdConfig } from "@/types/tracking";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdsBannerProps {
  ads: AdConfig[];
}

const AUTO_SLIDE_INTERVAL = 2000; // 2 seconds

export function AdsBanner({ ads }: AdsBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Filter active ads
  const activeAds = ads.filter((ad) => ad.isActive);

  // Auto-slide effect
  useEffect(() => {
    if (activeAds.length <= 1 || isPaused) {
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeAds.length);
    }, AUTO_SLIDE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeAds.length, isPaused]);

  if (activeAds.length === 0) {
    return null;
  }

  const currentAd = activeAds[currentIndex];

  const handleAdClick = () => {
    if (currentAd?.linkUrl) {
      window.open(currentAd.linkUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeAds.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeAds.length) % activeAds.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="relative w-full mb-6 group md:max-w-4xl md:mx-auto">
      <div
        onClick={handleAdClick}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative w-full aspect-[2/1] rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300"
        role="banner"
      >
        {/* Banner Image using Next/Image for HD display */}
        <Image
          src={currentAd.imageUrl}
          alt=""
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={currentIndex === 0}
        />

        {/* Navigation arrows (always visible if multiple ads) */}
        {activeAds.length > 1 && (
          <>
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2  text-gray-800 h-8 w-8 md:h-10 md:w-10"
              aria-label="Previous ad"
            >
              <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2  text-gray-800 h-8 w-8 md:h-10 md:w-10"
              aria-label="Next ad"
            >
              <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </>
        )}

        {/* Dots indicator (always visible if multiple ads) */}
        {activeAds.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {activeAds.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(index);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-white w-6"
                    : "bg-white/50 hover:bg-white/70"
                }`}
                aria-label={`Go to ad ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
