"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Settings, Users, FileText, TrendingUp } from "lucide-react";

const referralNavItems = [
  {
    title: "Settings",
    href: "/admin/referral",
    icon: Settings,
    description: "Configure referral system"
  },
  {
    title: "Customers",
    href: "/admin/referral/customers",
    icon: Users,
    description: "Manage customer points"
  },
  {
    title: "Reports",
    href: "/admin/referral/reports",
    icon: FileText,
    description: "View analytics and reports"
  }
];

export function ReferralNavigation() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-2">
      {referralNavItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "justify-start gap-2",
                isActive && "bg-primary text-primary-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.title}</span>
            </Button>
          </Link>
        );
      })}
    </div>
  );
}