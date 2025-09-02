import { ScrollText, Star, ClockFading, BrushCleaning } from "lucide-react";

import {
  Timeline,
  TimelineContent,
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
  progress: string;
}

export default function TimelineProgress({ progress }: TimelineProgressProps) {
  const statusMap: { [key: string]: number } = {
    ongoing: 1,
    pending: 2,
    cleaning: 3,
    finish: 4,
  };
  const orderStep = statusMap[progress] | 0;
  return (
    <Timeline value={orderStep}>
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
          <TimelineContent>{item.description}</TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
