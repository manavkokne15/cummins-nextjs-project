"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import HeatmapPage from "@/components/heatmap";

export default function HeatmapRoute() {
  return (
    <DashboardLayout>
      <HeatmapPage />
    </DashboardLayout>
  );
}
