"use client";

import Link from "next/link";
import { Card, CardContent } from "../ui/card";
import { PointsData } from "@/types/tracking";
import { TrendingUp, Gift } from "lucide-react";

interface PointsCardProps {
  pointsData: PointsData;
}

export function PointsCard({ pointsData }: PointsCardProps) {
  const formatPoints = (points: number) => {
    return new Intl.NumberFormat("id-ID").format(points);
  };

  return (
    <Card className="shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
      <CardContent className="pt-6">
        <div className="text-center">
          {/* Points Balance Display */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <Gift className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
              Points Balance
            </h3>
          </div>

          {/* Large balance display */}
          <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-1">
            {formatPoints(pointsData.current_balance)}
          </div>
          <p className="text-sm text-blue-600/80 dark:text-blue-400/80 mb-6">
            Available Points
          </p>

          {/* Earned / Redeemed split */}
          <div className="grid grid-cols-2 gap-3">
            {/* Earned */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  +{formatPoints(pointsData.total_earned)}
                </span>
              </div>
              <p className="text-xs text-green-700 dark:text-green-500 font-medium">
                Total Earned
              </p>
            </div>

            {/* Redeemed */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Gift className="w-4 h-4 text-red-600" />
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                  -{formatPoints(pointsData.total_redeemed)}
                </span>
              </div>
              <p className="text-xs text-red-700 dark:text-red-500 font-medium">
                Total Redeemed
              </p>
            </div>
          </div>

          {/* Encouraging message for new customers */}
          {pointsData.total_earned === 0 && (
            <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200 text-center">
                Start earning points from every order!
              </p>
            </div>
          )}

          {/* Call to action for points redemption */}
          {pointsData.current_balance > 0 && (
            <div className="mt-4 text-center">
              <Link
                href="/customer-dashboard"
                className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                View Points History
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
