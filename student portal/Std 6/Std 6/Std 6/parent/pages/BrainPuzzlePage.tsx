// parent/pages/BrainPuzzlePage.tsx
// Parent version of Brain Puzzle Zone — reuses the child BrainPuzzlePage
import React from 'react';
const BrainPuzzlePage = React.lazy(() => import('../../child/BrainPuzzlePage'));

const ParentBrainPuzzlePage: React.FC = () => (
  <React.Suspense fallback={<div style={{textAlign:'center',padding:40}}>Loading…</div>}>
    <BrainPuzzlePage />
  </React.Suspense>
);

export default ParentBrainPuzzlePage;
