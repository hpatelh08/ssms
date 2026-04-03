/**
 * App.tsx
 * ─────────────────────────────────────────────────────
 * Application root — Role-Based Isolation (Phase 11)
 *
 * Provider nesting (outermost → innermost):
 *   AuthProvider → SoundProvider → CelebrationProvider
 *   → MascotProvider → XPProvider → RoleRouter
 *
 * XPProvider sits innermost because its onLevelUp callback
 * calls play(), celebrate(), and triggerMascot(), requiring
 * Sound, Celebration, and Mascot contexts as ancestors.
 *
 * RoleRouter decides which layout to render based on
 * the authenticated user's role and grade.
 */

import React from 'react';
import { AuthProvider } from './auth/AuthContext';
import { SoundProvider } from './child/SoundProvider';
import { CelebrationProvider } from './child/useCelebrationController';
import { MascotProvider } from './child/useMascotController';
import { XPProvider } from './child/XPProvider';
import { TreeProvider } from './context/TreeContext';
import { GlobalTimerProvider } from './context/GlobalTimerContext';
import RoleRouter from "./auth/RoleRouter";

const DEMO_PDF_URL = 'https://ncert.nic.in/textbook/pdf/maen101.pdf'; // Replace with actual PDF URL
const DEMO_BOOK_NAME = 'NCERT Mathematics Class 6';

const App: React.FC = () => (
  <AuthProvider>
    <SoundProvider>
      <CelebrationProvider>
        <MascotProvider>
          <XPProvider>
            <TreeProvider>
              <GlobalTimerProvider>
                {/* Main Application Router */}
                <RoleRouter />
              </GlobalTimerProvider>
            </TreeProvider>
          </XPProvider>
        </MascotProvider>
      </CelebrationProvider>
    </SoundProvider>
  </AuthProvider>
);

export default App;