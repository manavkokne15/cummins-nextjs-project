"use client";

import styles from "./ChartPage.module.css";

export default function ChartPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Chart View</h1>
        <p className={styles.description}>
          Comprehensive charts and detailed analytics of vehicle data
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.placeholder}>
          <svg
            className={styles.icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
            <line x1="7" y1="2" x2="7" y2="22" />
            <line x1="12" y1="2" x2="12" y2="22" />
            <line x1="17" y1="2" x2="17" y2="22" />
          </svg>
          <p className={styles.placeholderText}>Chart Visualization</p>
          <p className={styles.placeholderSubtext}>
            Your vehicle analytics chart will be displayed here
          </p>
        </div>
      </div>
    </div>
  );
}
