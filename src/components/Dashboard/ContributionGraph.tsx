"use client";

import { useState, useMemo } from "react";
import { format, startOfYear, endOfYear, eachDayOfInterval, getDay, getWeek } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Grid3x3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SalesDataPoint {
  date: string;
  total: number;
  count: number;
}

interface ContributionGraphProps {
  data: SalesDataPoint[];
  onDateClick?: (date: string, count: number) => void;
}

type ContributionLevel = 0 | 1 | 2 | 3 | 4;

const getContributionLevel = (count: number): ContributionLevel => {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  return 4;
};

const levelColors: Record<ContributionLevel, string> = {
  0: "bg-slate-100 dark:bg-slate-800",
  1: "bg-blue-200 dark:bg-blue-900/50",
  2: "bg-blue-300 dark:bg-blue-800/50",
  3: "bg-blue-400 dark:bg-blue-700/50",
  4: "bg-blue-500 dark:bg-blue-600",
};

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ContributionGraph({ data }: ContributionGraphProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  // Create a map of date to count for quick lookup
  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((item) => {
      map.set(item.date, item.count);
    });
    return map;
  }, [data]);

  // Filter data for selected year and create daily contributions
  const yearContributions = useMemo(() => {
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 0, 1));
    const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd });

    return allDays.map((day) => {
      const dateKey = format(day, "yyyy-MM-dd");
      return {
        date: dateKey,
        count: dataMap.get(dateKey) || 0,
      };
    });
  }, [dataMap, selectedYear]);

  // Build the grid: 53 weeks x 7 days
  const grid = useMemo(() => {
    const weeks: Array<Array<{ date: string; count: number; dayOfMonth: number } | null>> = [];

    // Initialize 53 weeks (some years need 53)
    for (let i = 0; i < 53; i++) {
      weeks[i] = Array(7).fill(null);
    }

    yearContributions.forEach((day) => {
      const date = new Date(day.date);
      const weekIndex = getWeek(date, { weekStartsOn: 0 }) - 1;
      const dayIndex = getDay(date);

      if (weekIndex >= 0 && weekIndex < 53) {
        weeks[weekIndex][dayIndex] = {
          date: day.date,
          count: day.count,
          dayOfMonth: date.getDate(),
        };
      }
    });

    return weeks;
  }, [yearContributions]);

  // Calculate month positions based on where the first week of each month starts
  const monthPositions = useMemo(() => {
    const positions: Array<{ month: string; weekIndex: number }> = [];
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));

    for (let month = 0; month < 12; month++) {
      const firstDayOfMonth = new Date(selectedYear, month, 1);
      const weekIndex = getWeek(firstDayOfMonth, { weekStartsOn: 0 }) - 1;

      positions.push({
        month: format(firstDayOfMonth, "MMM"),
        weekIndex: weekIndex >= 0 ? weekIndex : 0,
      });
    }

    return positions;
  }, [selectedYear]);

  const handleYearChange = (direction: "prev" | "next") => {
    setSelectedYear((prev) => {
      if (direction === "prev") return prev - 1;
      return prev + 1;
    });
  };

  const handleMouseEnter = (date: string, count: number, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();

    // Use fixed positioning with viewport coordinates to avoid clipping
    setTooltip({
      date,
      count,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const totalContributions = yearContributions.reduce((sum, day) => sum + day.count, 0);
  const activeDays = yearContributions.filter((day) => day.count > 0).length;

  // Calculate the width of the day labels column (w-10 = 2.5rem + mr-2 = 0.5rem = 3rem = 48px)
  const dayLabelsWidth = 48;

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Grid3x3 className="h-5 w-5 text-muted-foreground" />
              Order Activity
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Daily order frequency visualization
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleYearChange("prev")}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[60px] text-center">
              {selectedYear}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleYearChange("next")}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-semibold">{totalContributions}</span>
              <span className="text-muted-foreground">total orders</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-semibold">{activeDays}</span>
              <span className="text-muted-foreground">active days</span>
            </div>
          </div>

          {/* Month labels - positioned to align with grid */}
          <div className="relative pl-12" style={{ height: "20px" }}>
            {monthPositions.map((pos, index) => {
              // Calculate position: dayLabelsWidth + (weekIndex * (cell width + gap))
              // cell width = 16px (w-4), gap = 4px (gap-1)
              const leftPosition = dayLabelsWidth + pos.weekIndex * 20;

              return (
                <span
                  key={index}
                  className="absolute text-xs text-muted-foreground"
                  style={{ left: `${leftPosition}px` }}
                >
                  {pos.month}
                </span>
              );
            })}
          </div>

          {/* Contribution Grid */}
          <div className="relative overflow-x-auto pb-2">
            <div className="inline-flex gap-1">
              {/* Day labels */}
              <div className="flex flex-col gap-1 mr-2" style={{ width: "40px" }}>
                {weekDays.map((day, i) => (
                  <div
                    key={day}
                    className="h-4 w-10 flex items-center justify-end text-xs text-muted-foreground"
                    style={{ height: "16px" }}
                  >
                    {(i % 2 === 1) ? day : ""}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              {grid.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => {
                    if (!day) {
                      return <div key={`${weekIndex}-${dayIndex}`} className="w-4 h-4" />;
                    }

                    const level = getContributionLevel(day.count);

                    return (
                      <button
                        key={day.date}
                        className={cn(
                          "w-4 h-4 rounded-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                          levelColors[level],
                          day.count > 0 && "hover:ring-1 hover:ring-blue-400"
                        )}
                        onMouseEnter={(e) => handleMouseEnter(day.date, day.count, e)}
                        onMouseLeave={handleMouseLeave}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Tooltip */}
            {tooltip && (
              <div
                className="fixed z-50 px-3 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs rounded-lg shadow-lg pointer-events-none animate-in fade-in duration-150"
                style={{
                  left: `${tooltip.x}px`,
                  top: `${tooltip.y}px`,
                  transform: "translate(-50%, -100%) translateY(-8px)",
                }}
              >
                <div className="font-medium">
                  {format(new Date(tooltip.date), "MMM dd, yyyy")}
                </div>
                <div className="mt-1">
                  <span className="font-semibold">{tooltip.count}</span>
                  {" "}
                  {tooltip.count === 1 ? "order" : "orders"}
                </div>
                {/* Arrow */}
                <div className="absolute left-1/2 -bottom-1 w-2 h-2 bg-slate-900 dark:bg-slate-100 rotate-45 transform -translate-x-1/2" />
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={cn("w-4 h-4 rounded-sm", levelColors[level as ContributionLevel])}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
