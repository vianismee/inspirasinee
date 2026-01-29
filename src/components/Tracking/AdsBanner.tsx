"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { AdConfig } from "@/types/tracking";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdsBannerProps {
  ads: AdConfig[];
}

export function AdsBanner({ ads }: AdsBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter active ads
  const activeAds = ads.filter((ad) => ad.isActive);

  if (activeAds.length === 0) {
    return null;
  }

  const currentAd = activeAds[currentIndex];

  const handleAdClick = () => {
    if (currentAd?.linkUrl) {
      window.open(currentAd.linkUrl, '_blank', 'noopener,noreferrer');
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
    <div className="relative w-full mb-6 group">
      <div
        onClick={handleAdClick}
        className="relative w-full h-48 md:h-56 rounded-lg overflow-hidden cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300"
        role="banner"
        aria-label={currentAd.altText}
      >
        {/* Ad Image */}
        <img
          src={currentAd.imageUrl}
          alt={currentAd.altText}
          className="w-full h-full object-cover"
        />

        {/* Overlay gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Ad content */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <p className="text-white text-sm md:text-base font-medium drop-shadow-lg">
            {currentAd.altText}
          </p>
          <p className="text-white/80 text-xs mt-1 drop-shadow-md">
            Click to visit
          </p>
        </div>

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
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 h-8 w-8 md:h-10 md:w-10"
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
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 h-8 w-8 md:h-10 md:w-10"
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
