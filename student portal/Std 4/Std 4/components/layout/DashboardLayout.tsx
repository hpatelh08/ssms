/**
 * components/layout/DashboardLayout.tsx
 * ─────────────────────────────────────────────────────
 * Shared dashboard shell for both Parent and Student roles.
 *
 * Provides the identical structural skeleton:
 *  • Full-viewport root with sidebar offset (lg:pl-72)
 *  • FloatingWorld ambient background
 *  • Fixed TopBar slot (h-20, glass-strong)
 *  • Navigation slot (sidebar + bottom nav)
 *  • Main content area with AnimatePresence page transitions
 *  • Optional overlay slot (modals, celebrations)
 *
 * Usage:
 *   <DashboardLayout
 *     header={<TopBar ... />}
 *     navigation={<Navigation ... />}
 *     activeKey={currentView}
 *     overlay={<CelebrationOverlay />}
 *   >
 *     {pageContent}
 *   </DashboardLayout>
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingWorld } from '../background/FloatingWorld';
import { tw, pageTransition } from '../../styles/theme';

interface DashboardLayoutProps {
  /** TopBar component (fixed header) */
  header: React.ReactNode;
  /** Navigation component (sidebar + bottom nav) */
  navigation: React.ReactNode;
  /** Page content */
  children: React.ReactNode;
  /** Key for AnimatePresence page transitions */
  activeKey?: string;
  /** Optional overlay layer (celebrations, modals) */
  overlay?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  header,
  navigation,
  children,
  activeKey = 'default',
  overlay,
}) => (
  <div className={tw.layoutRoot}>
    <FloatingWorld />
    {header}
    {navigation}

    <main className={tw.layoutMain}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeKey}
          initial={pageTransition.initial}
          animate={pageTransition.animate}
          exit={pageTransition.exit}
          transition={pageTransition.transition}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </main>

    {overlay}
  </div>
);
