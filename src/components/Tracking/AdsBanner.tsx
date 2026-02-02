"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Button } from "../ui/button";
import { AdConfig } from "@/types/tracking";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdsBannerProps {
  ads: AdConfig[];
}

const AUTO_SLIDE_INTERVAL = 6000; // 6 seconds
const SWIPE_THRESHOLD = 50; // Minimum distance to trigger swipe

export function AdsBanner({ ads }: AdsBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<number | null>(null);
  const touchEndRef = useRef<number | null>(null);
  const dragStartRef = useRef<number | null>(null);
  const dragOffsetRef = useRef(0);
  const bannerRef = useRef<HTMLDivElement>(null);

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

  // Reset auto-slide timer when user manually navigates
  const resetAutoSlide = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (activeAds.length > 1 && !isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % activeAds.length);
      }, AUTO_SLIDE_INTERVAL);
    }
  }, [activeAds.length, isPaused]);

  if (activeAds.length === 0) {
    return null;
  }

  const currentAd = activeAds[currentIndex];

  const handleAdClick = () => {
    // Don't trigger click if user was dragging/swiping
    if (isDragging || Math.abs(dragOffsetRef.current) > 10) return;

    if (currentAd?.linkUrl) {
      window.open(currentAd.linkUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeAds.length);
    resetAutoSlide();
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeAds.length) % activeAds.length);
    resetAutoSlide();
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    resetAutoSlide();
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartRef.current = e.touches[0].clientX;
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;

    const currentTouch = e.touches[0].clientX;
    const diff = touchStartRef.current - currentTouch;

    if (Math.abs(diff) > 10) {
      setIsDragging(true);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null || touchEndRef.current === null) return;

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStartRef.current - touchEnd;

    // Reset after delay
    setTimeout(() => {
      setIsPaused(false);
      setIsDragging(false);
    }, 100);

    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) {
        handleNext(); // Swipe left -> next
      } else {
        handlePrev(); // Swipe right -> prev
      }
    }

    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  // Mouse handlers for desktop drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPaused(true);
    setIsDragging(false);
    dragStartRef.current = e.clientX;
    dragOffsetRef.current = 0;

    if (bannerRef.current) {
      bannerRef.current.style.cursor = "grabbing";
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStartRef.current === null) return;

    const currentX = e.clientX;
    const diff = dragStartRef.current - currentX;
    dragOffsetRef.current = diff;

    if (Math.abs(diff) > 10) {
      setIsDragging(true);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragStartRef.current === null) return;

    const diff = dragOffsetRef.current;

    // Reset after delay
    setTimeout(() => {
      setIsPaused(false);
      setIsDragging(false);
      dragOffsetRef.current = 0;
    }, 100);

    if (bannerRef.current) {
      bannerRef.current.style.cursor = "pointer";
    }

    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) {
        handleNext(); // Drag left -> next
      } else {
        handlePrev(); // Drag right -> prev
      }
    }

    dragStartRef.current = null;
  };

  const handleMouseLeave = () => {
    if (dragStartRef.current !== null) {
      dragStartRef.current = null;
      setIsDragging(false);
      dragOffsetRef.current = 0;
      setIsPaused(false);

      if (bannerRef.current) {
        bannerRef.current.style.cursor = "pointer";
      }
    }
  };

  return (
    <div className="relative w-full mb-6 group md:max-w-4xl md:mx-auto">
      <div
        ref={bannerRef}
        onClick={handleAdClick}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          setIsPaused(false);
          handleMouseLeave();
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="relative w-full aspect-[2/1] rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 select-none"
        role="banner"
        style={{ userSelect: 'none' }}
      >
        {/* Banner Image using Next/Image for HD display */}
        <Image
          src={currentAd.imageUrl}
          alt=""
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={currentIndex === 0}
          draggable={false}
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
