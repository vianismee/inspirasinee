import { ScrollText, Star, ClockFading, BrushCleaning } from "lucide-react";

import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/ui/timeline";

const items = [
  {
    id: 1,
    date: "3 days ago",
    title: "Pesanan Dibuat",
    description: "Pesanan dibuat",
    icon: ScrollText,
  },
  {
    id: 2,
    date: "3 days ago",
    title: "Dalam Antrian",
    description:
      "Sepatumu masih dalam antrian untuk diproses oleh Technician kami",
    icon: ClockFading,
  },
  {
    id: 3,
    title: "Proses Oleh Technician",
    description: "Sepatumu dalam tahap Cleaning oleh Technician kami",
    icon: BrushCleaning,
  },
  {
    id: 4,
    title: "Sepatumu siap di Ambil",
    description: "Sepatumu sudah siap untuk di ambil",
    icon: Star,
  },
];

interface TimelineProgressProps {
  progress: number | 0;
}

export default function TimelineProgress({ progress }: TimelineProgressProps) {
  return (
    <Timeline value={progress}>
      {items.map((item) => (
        <TimelineItem
          key={item.id}
          step={item.id}
          className="group-data-[orientation=vertical]/timeline:ms-10"
        >
          <TimelineHeader>
            <TimelineSeparator className="group-data-[orientation=vertical]/timeline:-left-7 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=vertical]/timeline:translate-y-6.5" />
            <TimelineTitle className="mt-0.5 font-bold">
              {item.title}
            </TimelineTitle>
            <TimelineIndicator className="bg-primary/10 group-data-completed/timeline-item:bg-primary group-data-completed/timeline-item:text-primary-foreground flex size-6 items-center justify-center border-none group-data-[orientation=vertical]/timeline:-left-7">
              <item.icon size={14} />
            </TimelineIndicator>
          </TimelineHeader>
          <TimelineContent>
            {item.description}
            <TimelineDate className="mt-2 mb-0">{item.date}</TimelineDate>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
