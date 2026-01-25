"use client";

import { DropPointDashboard } from "@/components/admin/DropPointDashboard";

export default function DropPointPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Drop-Point Management</h1>
      <DropPointDashboard />
    </div>
  );
}