"use client";

import styles from "./DashboardLayout.module.css";

export default function DashboardLayout({ children }) {
  return (
    <div className={`${styles.dashboardContainer} flex flex-col min-h-screen bg-slate-50`}>
      <main className={`${styles.mainContent} flex-1 overflow-y-auto p-5 px-8`}>
        <div className={`${styles.contentWrapper} max-w-screen-2xl mx-auto w-full`}>
          {children}
        </div>
      </main>
    </div>
  );
}
