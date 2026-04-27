import { useEffect, useRef } from 'react';
import adminSectionsHtml from '../assets/adminSections.html?raw';

// Load a <script> tag once and return a Promise
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const cacheBustedSrc = `${src}${src.includes('?') ? '&' : '?'}v=${Date.now()}`;
    if (document.querySelector(`script[data-ssms="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = cacheBustedSrc;
    s.dataset.ssms = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default function Admin() {
  const initialized = useRef(false);

  useEffect(() => {
    // Strict-Mode double-invocation guard
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      // Load legacy scripts in dependency order
      await loadScript('/js/data.js');
      await loadScript('/js/api.js');
      await loadScript('/js/auth.js');
      await loadScript('/js/layout.js');
      await loadScript('/js/admin.js');

      // Kick off admin page initialisation (replaces DOMContentLoaded)
      if (typeof window.initAdminPage === 'function') {
        window.initAdminPage();
      }
    })();
  }, []);

  return (
    <div className="app-layout">
      <aside className="sidebar" id="sidebar-root"></aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header className="topbar" id="topbar-root"></header>
        <main
          className="main-content"
          id="main"
          dangerouslySetInnerHTML={{ __html: adminSectionsHtml }}
        />
      </div>
    </div>
  );
}
