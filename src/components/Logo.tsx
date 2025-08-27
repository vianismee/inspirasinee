// src/components/Logo.tsx

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className, size = 28 }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "flex gap-2 self-center items-center font-medium",
        className
      )}
    >
      <Image
        src={"/asset/main_logo.png"}
        alt="Inspirasinee Logo"
        width={size} // Gunakan prop 'size'
        height={size} // Gunakan prop 'size'
      />
      <span className="font-bold font-sans text-[15pt] translate-y-2 translate-x-2 text-[#0243fe]">
        INSPIRASINEE
      </span>
    </Link>
  );
}
