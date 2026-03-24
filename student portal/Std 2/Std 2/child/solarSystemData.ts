/**
 * child/solarSystemData.ts
 * ─────────────────────────────────────────────────────
 * Solar System educational data — age-appropriate for Class 2 students
 *
 * Complete data for all 8 planets + Sun + Moon
 * with fun facts, quiz questions, and visual properties.
 */

export interface CelestialBody {
  id: string;
  name: string;
  emoji: string;
  type: 'star' | 'planet' | 'moon';
  order: number;                 // 0 = Sun, 1 = Mercury...
  color: string;
  glowColor: string;
  size: number;                  // relative radius (Sun = 100)
  orbitRadius: number;           // px from center
  orbitSpeed: number;            // seconds per revolution
  distanceFromSun: string;       // human-readable
  description: string;
  funFacts: string[];
  quiz: { question: string; options: string[]; correctIndex: number }[];
}

export const SOLAR_SYSTEM: CelestialBody[] = [
  {
    id: 'sun',
    name: 'The Sun',
    emoji: '☀️',
    type: 'star',
    order: 0,
    color: '#fbbf24',
    glowColor: 'rgba(251,191,36,0.4)',
    size: 100,
    orbitRadius: 0,
    orbitSpeed: 0,
    distanceFromSun: '0 km (Center)',
    description: 'The Sun is a giant ball of hot gas called a star. It gives us light and heat. Without the Sun, there would be no life on Earth!',
    funFacts: [
      'The Sun is so big that 1.3 million Earths could fit inside it!',
      'The Sun is about 4.6 billion years old',
      'Light from the Sun takes 8 minutes to reach Earth',
      'The surface of the Sun is about 5,500°C hot!',
    ],
    quiz: [
      { question: 'The Sun is a ___?', options: ['Planet', 'Star', 'Moon', 'Comet'], correctIndex: 1 },
      { question: 'How long does sunlight take to reach Earth?', options: ['1 second', '8 minutes', '1 hour', '1 day'], correctIndex: 1 },
    ],
  },
  {
    id: 'mercury',
    name: 'Mercury',
    emoji: '☿️',
    type: 'planet',
    order: 1,
    color: '#9ca3af',
    glowColor: 'rgba(156,163,175,0.3)',
    size: 8,
    orbitRadius: 80,
    orbitSpeed: 20,
    distanceFromSun: '57.9 million km',
    description: 'Mercury is the smallest planet and the closest to the Sun. It has no atmosphere to protect it, so it is very hot during the day and very cold at night!',
    funFacts: [
      'Mercury is the fastest planet — it orbits the Sun in just 88 days!',
      'A day on Mercury lasts 59 Earth days',
      'Mercury has no moons',
      'It is covered in craters like our Moon',
    ],
    quiz: [
      { question: 'Mercury is the ___ planet from the Sun?', options: ['Second', 'First', 'Third', 'Fourth'], correctIndex: 1 },
      { question: 'How many moons does Mercury have?', options: ['1', '2', '0', '3'], correctIndex: 2 },
    ],
  },
  {
    id: 'venus',
    name: 'Venus',
    emoji: '♀️',
    type: 'planet',
    order: 2,
    color: '#f59e0b',
    glowColor: 'rgba(245,158,11,0.3)',
    size: 14,
    orbitRadius: 115,
    orbitSpeed: 28,
    distanceFromSun: '108.2 million km',
    description: 'Venus is the hottest planet! It has thick clouds that trap heat like a blanket. Venus is sometimes called Earth\'s twin because it is about the same size.',
    funFacts: [
      'Venus spins in the opposite direction to most planets!',
      'A day on Venus is longer than its year',
      'Venus is the brightest planet in our night sky',
      'The surface temperature is about 465°C — hot enough to melt lead!',
    ],
    quiz: [
      { question: 'Venus is the ___ planet in our Solar System?', options: ['Coldest', 'Hottest', 'Biggest', 'Smallest'], correctIndex: 1 },
      { question: 'Venus is sometimes called Earth\'s ___?', options: ['Brother', 'Twin', 'Friend', 'Neighbor'], correctIndex: 1 },
    ],
  },
  {
    id: 'earth',
    name: 'Earth',
    emoji: '🌍',
    type: 'planet',
    order: 3,
    color: '#3b82f6',
    glowColor: 'rgba(59,130,246,0.3)',
    size: 14,
    orbitRadius: 155,
    orbitSpeed: 36,
    distanceFromSun: '149.6 million km',
    description: 'Earth is our home planet! It is the only planet where we know life exists. It has water, air, and just the right temperature for living things.',
    funFacts: [
      'About 71% of Earth\'s surface is covered with water',
      'Earth takes 365.25 days to orbit the Sun — that\'s why we have leap years!',
      'Earth has one moon, simply called "The Moon"',
      'The Earth is about 4.5 billion years old',
    ],
    quiz: [
      { question: 'How much of Earth is covered by water?', options: ['50%', '30%', '71%', '90%'], correctIndex: 2 },
      { question: 'How many moons does Earth have?', options: ['0', '1', '2', '3'], correctIndex: 1 },
    ],
  },
  {
    id: 'mars',
    name: 'Mars',
    emoji: '♂️',
    type: 'planet',
    order: 4,
    color: '#ef4444',
    glowColor: 'rgba(239,68,68,0.3)',
    size: 10,
    orbitRadius: 195,
    orbitSpeed: 45,
    distanceFromSun: '227.9 million km',
    description: 'Mars is called the "Red Planet" because its soil contains iron rust! Scientists are studying Mars to see if humans could live there one day.',
    funFacts: [
      'Mars has the tallest volcano in the solar system — Olympus Mons!',
      'Mars has two small moons: Phobos and Deimos',
      'A day on Mars is about 24 hours and 37 minutes',
      'Mars has seasons like Earth because it tilts on its axis',
    ],
    quiz: [
      { question: 'Mars is also called the ___ Planet?', options: ['Blue', 'Red', 'Green', 'Yellow'], correctIndex: 1 },
      { question: 'How many moons does Mars have?', options: ['0', '1', '2', '4'], correctIndex: 2 },
    ],
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    emoji: '♃',
    type: 'planet',
    order: 5,
    color: '#f97316',
    glowColor: 'rgba(249,115,22,0.3)',
    size: 35,
    orbitRadius: 255,
    orbitSpeed: 55,
    distanceFromSun: '778.5 million km',
    description: 'Jupiter is the BIGGEST planet in our solar system! It is a gas giant and has a Great Red Spot — a giant storm that has been raging for hundreds of years!',
    funFacts: [
      'Jupiter is so big that all other planets could fit inside it!',
      'Jupiter has at least 95 known moons',
      'The Great Red Spot is a storm bigger than Earth',
      'Jupiter spins very fast — a day lasts only about 10 hours',
    ],
    quiz: [
      { question: 'Jupiter is the ___ planet?', options: ['Smallest', 'Hottest', 'Biggest', 'Closest'], correctIndex: 2 },
      { question: 'What is Jupiter\'s Great Red Spot?', options: ['A volcano', 'A storm', 'An ocean', 'A mountain'], correctIndex: 1 },
    ],
  },
  {
    id: 'saturn',
    name: 'Saturn',
    emoji: '🪐',
    type: 'planet',
    order: 6,
    color: '#eab308',
    glowColor: 'rgba(234,179,8,0.3)',
    size: 30,
    orbitRadius: 310,
    orbitSpeed: 65,
    distanceFromSun: '1.43 billion km',
    description: 'Saturn is famous for its beautiful rings! The rings are made of ice and rock. Saturn is a gas giant like Jupiter and could float in a giant bathtub!',
    funFacts: [
      'Saturn\'s rings are made of billions of pieces of ice and rock',
      'Saturn has 146 known moons — the most of any planet!',
      'Saturn is so light it would float in water',
      'The wind on Saturn can blow at 1,800 km per hour!',
    ],
    quiz: [
      { question: 'Saturn is famous for its ___?', options: ['Color', 'Rings', 'Size', 'Moons'], correctIndex: 1 },
      { question: 'Saturn\'s rings are made of ___?', options: ['Gas', 'Fire', 'Ice and rock', 'Water'], correctIndex: 2 },
    ],
  },
  {
    id: 'uranus',
    name: 'Uranus',
    emoji: '🔵',
    type: 'planet',
    order: 7,
    color: '#67e8f9',
    glowColor: 'rgba(103,232,249,0.3)',
    size: 22,
    orbitRadius: 360,
    orbitSpeed: 75,
    distanceFromSun: '2.87 billion km',
    description: 'Uranus is an ice giant that spins on its side! It looks blue-green because of gases in its atmosphere. It is very cold and far from the Sun.',
    funFacts: [
      'Uranus rotates on its side — like a rolling ball!',
      'Uranus has 27 known moons',
      'It takes 84 Earth years for Uranus to orbit the Sun',
      'Uranus was the first planet discovered using a telescope',
    ],
    quiz: [
      { question: 'Uranus rotates ___?', options: ['Upright', 'On its side', 'Backwards', 'Very fast'], correctIndex: 1 },
      { question: 'What color does Uranus appear?', options: ['Red', 'Yellow', 'Blue-green', 'White'], correctIndex: 2 },
    ],
  },
  {
    id: 'neptune',
    name: 'Neptune',
    emoji: '🔷',
    type: 'planet',
    order: 8,
    color: '#3b82f6',
    glowColor: 'rgba(59,130,246,0.3)',
    size: 20,
    orbitRadius: 400,
    orbitSpeed: 85,
    distanceFromSun: '4.5 billion km',
    description: 'Neptune is the farthest planet from the Sun! It is very cold and has the strongest winds in the solar system. It looks deep blue.',
    funFacts: [
      'Neptune has the strongest winds — up to 2,100 km/hr!',
      'It takes Neptune 165 Earth years to orbit the Sun',
      'Neptune has 16 known moons — the largest is Triton',
      'Neptune was discovered using mathematics before it was seen!',
    ],
    quiz: [
      { question: 'Neptune is the ___ planet from the Sun?', options: ['6th', '7th', '8th', '9th'], correctIndex: 2 },
      { question: 'Neptune has the strongest ___ in the solar system?', options: ['Gravity', 'Winds', 'Volcanoes', 'Storms'], correctIndex: 1 },
    ],
  },
  {
    id: 'moon',
    name: 'The Moon',
    emoji: '🌙',
    type: 'moon',
    order: 99,
    color: '#d1d5db',
    glowColor: 'rgba(209,213,219,0.3)',
    size: 6,
    orbitRadius: 30,
    orbitSpeed: 8,
    distanceFromSun: '384,400 km from Earth',
    description: 'The Moon is Earth\'s only natural satellite. It orbits around the Earth and reflects sunlight to glow at night. We can see different shapes of the Moon called phases!',
    funFacts: [
      'The Moon has no atmosphere — no air, no wind, no weather!',
      'The Moon\'s gravity is 6 times weaker than Earth\'s',
      'Only 12 people have ever walked on the Moon',
      'The Moon causes tides in Earth\'s oceans',
    ],
    quiz: [
      { question: 'The Moon orbits around ___?', options: ['The Sun', 'Mars', 'Earth', 'Jupiter'], correctIndex: 2 },
      { question: 'How many people have walked on the Moon?', options: ['6', '12', '20', '100'], correctIndex: 1 },
    ],
  },
];

/** Planet order mnemonic for kids */
export const PLANET_MNEMONIC = 'My Very Eager Mother Just Served Us Noodles';

/** Get all planets (exclude Sun and Moon) */
export function getPlanets(): CelestialBody[] {
  return SOLAR_SYSTEM.filter(b => b.type === 'planet');
}

/** Get body by ID */
export function getBodyById(id: string): CelestialBody | undefined {
  return SOLAR_SYSTEM.find(b => b.id === id);
}
