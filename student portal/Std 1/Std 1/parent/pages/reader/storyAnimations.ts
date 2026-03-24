/**
 * parent/pages/reader/storyAnimations.ts
 * ─────────────────────────────────────────────────────
 * AI-powered page illustration animation engine.
 *
 * Detects common illustration keywords on each page and
 * returns CSS keyframe animation definitions to apply.
 *
 * Used by Story Mode to animate elements on the page.
 */

/* ── Animation Types ────────────────────────────── */

export interface PageAnimation {
  id: string;
  label: string;
  emoji: string;
  cssKeyframes: string;
  cssAnimation: string;
  description: string;
}

/* ── Animation Library ──────────────────────────── */

const ANIMATION_LIBRARY: Record<string, PageAnimation> = {
  sun: {
    id: 'sun',
    label: 'Sun Glow',
    emoji: '☀️',
    cssKeyframes: `
      @keyframes sunPulse {
        0%, 100% { filter: brightness(1) drop-shadow(0 0 8px rgba(251,191,36,0.3)); transform: scale(1); }
        50% { filter: brightness(1.15) drop-shadow(0 0 20px rgba(251,191,36,0.6)); transform: scale(1.05); }
      }`,
    cssAnimation: 'sunPulse 3s ease-in-out infinite',
    description: 'Sun glows softly',
  },
  clouds: {
    id: 'clouds',
    label: 'Floating Clouds',
    emoji: '☁️',
    cssKeyframes: `
      @keyframes cloudFloat {
        0%, 100% { transform: translateX(0) translateY(0); }
        25% { transform: translateX(8px) translateY(-2px); }
        75% { transform: translateX(-6px) translateY(2px); }
      }`,
    cssAnimation: 'cloudFloat 6s ease-in-out infinite',
    description: 'Clouds drift gently',
  },
  birds: {
    id: 'birds',
    label: 'Flying Birds',
    emoji: '🐦',
    cssKeyframes: `
      @keyframes birdFly {
        0%, 100% { transform: translateX(0) translateY(0) scaleX(1); }
        25% { transform: translateX(4px) translateY(-6px) scaleX(0.95); }
        50% { transform: translateX(8px) translateY(-3px) scaleX(1); }
        75% { transform: translateX(4px) translateY(-8px) scaleX(0.95); }
      }`,
    cssAnimation: 'birdFly 2s ease-in-out infinite',
    description: 'Birds flap and glide',
  },
  children: {
    id: 'children',
    label: 'Children Move',
    emoji: '👦',
    cssKeyframes: `
      @keyframes childBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
      }`,
    cssAnimation: 'childBounce 2.5s ease-in-out infinite',
    description: 'Characters gently bounce',
  },
  wind: {
    id: 'wind',
    label: 'Wind Sway',
    emoji: '🌿',
    cssKeyframes: `
      @keyframes windSway {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(2deg); }
        75% { transform: rotate(-2deg); }
      }`,
    cssAnimation: 'windSway 3s ease-in-out infinite',
    description: 'Grass and leaves sway',
  },
  water: {
    id: 'water',
    label: 'Water Ripple',
    emoji: '💧',
    cssKeyframes: `
      @keyframes waterRipple {
        0%, 100% { transform: scaleX(1); opacity: 0.8; }
        50% { transform: scaleX(1.02); opacity: 1; }
      }`,
    cssAnimation: 'waterRipple 2.5s ease-in-out infinite',
    description: 'Water gently ripples',
  },
  stars: {
    id: 'stars',
    label: 'Twinkling Stars',
    emoji: '⭐',
    cssKeyframes: `
      @keyframes starTwinkle {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.85); }
      }`,
    cssAnimation: 'starTwinkle 1.5s ease-in-out infinite',
    description: 'Stars twinkle softly',
  },
  flowers: {
    id: 'flowers',
    label: 'Blooming Flowers',
    emoji: '🌸',
    cssKeyframes: `
      @keyframes flowerBloom {
        0%, 100% { transform: scale(1) rotate(0deg); }
        50% { transform: scale(1.08) rotate(3deg); }
      }`,
    cssAnimation: 'flowerBloom 4s ease-in-out infinite',
    description: 'Flowers bloom gently',
  },
  animal: {
    id: 'animal',
    label: 'Animal Move',
    emoji: '🐱',
    cssKeyframes: `
      @keyframes animalWiggle {
        0%, 100% { transform: translateX(0) rotate(0deg); }
        25% { transform: translateX(2px) rotate(1deg); }
        75% { transform: translateX(-2px) rotate(-1deg); }
      }`,
    cssAnimation: 'animalWiggle 2s ease-in-out infinite',
    description: 'Animal wiggles playfully',
  },
  ball: {
    id: 'ball',
    label: 'Bouncing Ball',
    emoji: '⚽',
    cssKeyframes: `
      @keyframes ballBounce {
        0%, 100% { transform: translateY(0); }
        40% { transform: translateY(-12px); }
        60% { transform: translateY(-6px); }
      }`,
    cssAnimation: 'ballBounce 1.2s ease-in-out infinite',
    description: 'Ball bounces lightly',
  },
  rain: {
    id: 'rain',
    label: 'Rainfall',
    emoji: '🌧️',
    cssKeyframes: `
      @keyframes rainFall {
        0% { transform: translateY(-4px); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateY(4px); opacity: 0; }
      }`,
    cssAnimation: 'rainFall 0.8s linear infinite',
    description: 'Rain drops fall',
  },
  butterfly: {
    id: 'butterfly',
    label: 'Butterfly Flutter',
    emoji: '🦋',
    cssKeyframes: `
      @keyframes butterflyFlutter {
        0%, 100% { transform: translateY(0) scaleX(1); }
        25% { transform: translateY(-6px) scaleX(0.8); }
        50% { transform: translateY(-3px) scaleX(1); }
        75% { transform: translateY(-8px) scaleX(0.8); }
      }`,
    cssAnimation: 'butterflyFlutter 1.8s ease-in-out infinite',
    description: 'Butterfly flutters around',
  },
};

/* ── Keyword Detection Map ──────────────────────── */

const KEYWORD_MAP: Record<string, string[]> = {
  sun: ['sun', 'sunny', 'sunrise', 'sunset', 'morning', 'bright', 'hot', 'सूरज', 'धूप'],
  clouds: ['cloud', 'clouds', 'sky', 'cloudy', 'बादल', 'आसमान'],
  birds: ['bird', 'birds', 'parrot', 'crow', 'pigeon', 'sparrow', 'चिड़िया', 'पक्षी', 'तोता'],
  children: ['child', 'children', 'boy', 'girl', 'Gopi', 'Meena', 'Raju', 'बच्चे', 'लड़का', 'लड़की'],
  wind: ['wind', 'breeze', 'rustling', 'leaves', 'grass', 'tree', 'पेड़', 'हवा', 'पत्ते'],
  water: ['water', 'river', 'pond', 'rain', 'stream', 'sea', 'ocean', 'पानी', 'नदी'],
  stars: ['star', 'stars', 'night', 'moon', 'तारे', 'चाँद', 'रात'],
  flowers: ['flower', 'flowers', 'garden', 'rose', 'lotus', 'फूल', 'बगीचा', 'गुलाब'],
  animal: ['cat', 'dog', 'rabbit', 'monkey', 'cow', 'horse', 'elephant', 'बिल्ली', 'कुत्ता', 'बंदर', 'हाथी'],
  ball: ['ball', 'play', 'game', 'kick', 'throw', 'catch', 'गेंद', 'खेल'],
  rain: ['rain', 'rainy', 'monsoon', 'umbrella', 'बारिश', 'छाता'],
  butterfly: ['butterfly', 'butterflies', 'तितली'],
};

/* ── Public API ─────────────────────────────────── */

/**
 * Detect which animations should play for a given page text.
 */
export function detectPageAnimations(pageText: string): PageAnimation[] {
  if (!pageText || pageText.trim().length === 0) return [];

  const lower = pageText.toLowerCase();
  const detected: PageAnimation[] = [];
  const seen = new Set<string>();

  for (const [animId, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase()) && !seen.has(animId)) {
        seen.add(animId);
        const anim = ANIMATION_LIBRARY[animId];
        if (anim) detected.push(anim);
        break;
      }
    }
  }

  // Limit to 4 animations per page to avoid visual overload
  return detected.slice(0, 4);
}

/**
 * Generate a combined CSS <style> block for all active animations.
 */
export function generateAnimationCSS(animations: PageAnimation[]): string {
  if (animations.length === 0) return '';
  return animations.map((a) => a.cssKeyframes).join('\n');
}

/**
 * Get a default "ambient" animation set for pages without detected keywords.
 */
export function getAmbientAnimations(): PageAnimation[] {
  return [ANIMATION_LIBRARY.wind, ANIMATION_LIBRARY.clouds].filter(Boolean);
}
