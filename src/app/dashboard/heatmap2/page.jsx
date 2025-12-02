"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Heatmap2 from "@/components/heatmap2/Heatmap2";

export default function Heatmap2Route() {
  return (
    <DashboardLayout>
      <div style={{ height: 'calc(100vh - 80px)', width: '100%' }}>
        <Heatmap2 />
      </div>
    </DashboardLayout>
  );
}