'use client';

import React, { ReactNode } from 'react';
import styles from './Layout.module.css';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>✂️ Barber Booking</h1>
          <p className={styles.tagline}>Reserve your perfect cut</p>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <p>&copy; 2024 Barber Booking. All rights reserved.</p>
      </footer>
    </div>
  );
}
