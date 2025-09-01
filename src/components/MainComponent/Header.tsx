import { LucideIcon } from "lucide-react";

interface HeadersProsp {
  title: string;
  desc: string;
}

export function Headers({ title, desc }: HeadersProsp) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
      <div>
        <h1 className="text-2xl text-center md:text-left sm:text-3xl font-bold text-gray-900 dark:text-white">
          {title}
        </h1>
        <p className="text-gray-500 text-center md:text-left dark:text-gray-400 mt-1">
          {desc}
        </p>
      </div>
    </header>
  );
}
