/**
 * layout/AppLayout.tsx
 * ═══════════════════════════════════════════════════════════
 * Centralized layout shell — wraps ALL pages.
 *
 * Structure:
 *   .app-root          → flex row
 *     <Sidebar />      → sticky 240px flex child (desktop)
 *     .main-area       → flex column
 *       <Topbar />     → sticky 80px header
 *       .page-container → centered, capped content area
 *
 * All pages render their content INSIDE this shell.
 * No per-page layout wrappers needed.
 * ═══════════════════════════════════════════════════════════
 */

import React from 'react';
import './layout.css';

interface Props {
  sidebar?: React.ReactNode;
  topbar?: React.ReactNode;
  background?: React.ReactNode;
  overlay?: React.ReactNode;
  children: React.ReactNode;
}

const AppLayout: React.FC<Props> = ({ sidebar, topbar, background, overlay, children }) => (
  <div className="app-root">
    {/* Background layer (FloatingWorld, etc.) */}
    {background}

    {/* Sidebar — flex child on desktop, fixed bottom on mobile */}
    {sidebar}

    {/* Main area — fills remaining width */}
    <div className="main-area">
      {topbar}

      <main className="page-container main-dashboard">
        {children}
      </main>
    </div>

    {/* Overlay layer (celebration, mascot, etc.) */}
    {overlay}
  </div>
);

export default AppLayout;
