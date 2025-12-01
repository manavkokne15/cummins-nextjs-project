"use client";

import styles from "./GraphPage.module.css";

export default function GraphPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Graph View</h1>
        <p className={styles.description}>
          Interactive graphs showing vehicle density and analytical metrics
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
            <line x1="12" y1="2" x2="12" y2="22" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <p className={styles.placeholderText}>Graph Visualization</p>
          <p className={styles.placeholderSubtext}>
            Your vehicle analytics graph will be displayed here
          </p>
        </div>
      </div>
    </div>
  );
}
