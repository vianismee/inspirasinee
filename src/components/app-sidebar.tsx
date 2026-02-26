"use client";

import * as React from "react";
import {
  IconDashboard,
  IconListDetails,
  IconTicket,
  IconUsers,
  IconShare,
  IconChartBar,
  IconPhoto,
  IconTrophy,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Logo } from "./Logo";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: IconDashboard,
    },
    {
      title: "Catalog",
      url: "/admin/catalog",
      icon: IconListDetails,
    },
    {
      title: "Discount",
      url: "/admin/discount",
      icon: IconTicket,
    },
    {
      title: "Customer",
      url: "/admin/customer",
      icon: IconUsers,
    },
    {
      title: "Membership",
      url: "/admin/membership",
      icon: IconTrophy,
    },
    {
      title: "Referral",
      url: "/admin/referral",
      icon: IconShare,
    },
    {
      title: "Banner",
      url: "/admin/banner",
      icon: IconPhoto,
    },
    {
      title: "Report",
      url: "/admin/report",
      icon: IconChartBar,
    },
    {
      title: "Settings",
      url: "/admin/settings/invoice-template",
      icon: IconListDetails, // Or another suitable icon
    },
  ],
  navSecondary: [],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Logo size={15} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
