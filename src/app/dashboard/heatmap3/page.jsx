"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Heatmap3 from "@/components/heatmap3/Heatmap3";

export default function Heatmap3Route() {
  return (
    <DashboardLayout>
      <div style={{ height: 'calc(100vh - 80px)', width: '100%' }}>
        <Heatmap3 />
      </div>
    </DashboardLayout>
  );
}