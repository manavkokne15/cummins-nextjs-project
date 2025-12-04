"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className={`${styles.navbar} flex items-center justify-between h-16 px-8 bg-white sticky top-0 z-[1000] gap-6`}>
      {/* Left Section - Logo */}
      <div className={`${styles.navLeft} flex items-center min-w-60`}>
        <Link href="/dashboard" className={`${styles.logo} flex items-center gap-2 no-underline cursor-pointer transition-transform duration-200 hover:scale-105`}>
          <svg
            className={styles.logoIcon}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="8"
              y="8"
              width="24"
              height="24"
              stroke="currentColor"
              strokeWidth="2"
              rx="4"
            />
            <circle cx="14" cy="14" r="2" fill="currentColor" />
            <path
              d="M8 24L14 18L22 24L32 14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={styles.logoText}>Cummins Analytics</span>
        </Link>
      </div>

      {/* Mobile Menu Toggle */}
      <button
        className={styles.hamburger}
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <span className={`${styles.hamburgerLine} ${isMenuOpen ? styles.active : ""}`}></span>
        <span className={`${styles.hamburgerLine} ${isMenuOpen ? styles.active : ""}`}></span>
        <span className={`${styles.hamburgerLine} ${isMenuOpen ? styles.active : ""}`}></span>
      </button>

      {/* Center Section - Navigation Links */}
      <div className={`${styles.navCenter} flex items-center gap-2 ${isMenuOpen ? styles.active : ""}`}>
        <Link
          href="/dashboard/heatmap"
          className={styles.navLink}
          onClick={() => setIsMenuOpen(false)}
        >
          <svg className={styles.navIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
          </svg>
          <span>Heatmap</span>
        </Link>

        <Link
          href="/dashboard/chart"
          className={styles.navLink}
          onClick={() => setIsMenuOpen(false)}
        >
          <svg className={styles.navIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5z" />
          </svg>
          <span>Chart</span>
        </Link>

        <Link
          href="/dashboard/graph"
          className={styles.navLink}
          onClick={() => setIsMenuOpen(false)}
        >
          <svg className={styles.navIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z" />
          </svg>
          <span>Graph</span>
        </Link>

        <Link
          href="/dashboard/map"
          className={styles.navLink}
          onClick={() => setIsMenuOpen(false)}
        >
          <svg className={styles.navIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
          </svg>
          <span>Map</span>
        </Link>
      </div>

      {/* Right Section - User/Account */}
      <div className={styles.navRight}>
        <button className={styles.userButton}>
          <svg className={styles.userIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          <span>Account</span>
        </button>
      </div>
    </nav>
  );
}
