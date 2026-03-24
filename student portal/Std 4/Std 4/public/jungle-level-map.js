const TOTAL_LEVELS = 200;

// Demo state: only level 1 unlocked initially.
const completed = new Set([2, 3, 4, 5, 6]); // sample completed
const unlockedMax = 7; // sample unlock

const levelsEl = document.getElementById('levels');

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function computePositions(containerWidth, totalLevels) {
  // Zig-zag railway: alternate left/right lane (no manual placement).
  // Equivalent to:
  //   if (level % 2 === 0) left = leftLane
  //   else                left = rightLane
  const center = containerWidth / 2;
  const amplitude = clamp(containerWidth * 0.26, 150, 280);
  const leftLane = center - amplitude;
  const rightLane = center + amplitude;
  const margin = clamp(containerWidth * 0.10, 68, 130);

  const baseSpacing = 170;
  const positions = [];
  let y = 140; // top padding so first label wouldn't clip (if you add labels later)

  for (let i = 1; i <= totalLevels; i++) {
    const idx = i - 1;
    const x = clamp(i % 2 === 0 ? leftLane : rightLane, margin, containerWidth - margin);

    // Mild spacing variation: avoid perfect repetition.
    const spacing = clamp(baseSpacing + Math.sin(idx * 0.35) * 18 + (idx % 5 === 0 ? 10 : 0), 150, 210);
    positions.push({ level: i, x, y });
    y += spacing;
  }

  // Total height
  const height = y + 100;
  return { positions, height, center };
}

function statusFor(level) {
  if (completed.has(level)) return 'done';
  if (level === unlockedMax) return 'current';
  if (level < unlockedMax) return 'available';
  return 'locked';
}

function render() {
  const rect = levelsEl.getBoundingClientRect();
  const width = rect.width || Math.min(980, window.innerWidth);
  const { positions, height } = computePositions(width, TOTAL_LEVELS);

  levelsEl.style.height = `${height}px`;
  levelsEl.innerHTML = '';

  const frag = document.createDocumentFragment();
  for (const p of positions) {
    const st = statusFor(p.level);

    const wrap = document.createElement('div');
    wrap.className = `level level--${st}`;
    wrap.style.left = `${p.x}px`;
    wrap.style.top = `${p.y}px`;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = String(p.level);

    const locked = st === 'locked';
    btn.disabled = locked;
    btn.setAttribute('aria-label', `Level ${p.level}${locked ? ' locked' : ''}`);
    btn.addEventListener('click', () => {
      if (locked) return;
      // Hook your game open logic here.
      console.log('Selected level', p.level);
    });

    wrap.appendChild(btn);
    frag.appendChild(wrap);
  }

  levelsEl.appendChild(frag);
}

const ro = new ResizeObserver(() => render());
ro.observe(levelsEl);
window.addEventListener('resize', () => render(), { passive: true });
render();
