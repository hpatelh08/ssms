/**
 * child/ecoSystemData.ts
 * ─────────────────────────────────────────────────────
 * Eco System Module — Topic-based learning for Std 3
 *
 * 10 topics × 40 levels each × 5 questions per level.
 * Pyramid layout, topic-specific question banks.
 * Daily limit system (10 levels/day, 24h cooldown).
 */

/* ── Types ──────────────────────────────────────── */

export interface EcoQuestion {
  question: string;
  options: string[];
  correct: number;
  tip: string;
}

export interface EcoTopic {
  id: string;
  name: string;
  icon: string;
  color: string;
  glowColor: string;
  description: string;
  /** Pyramid row (1-4) */
  row: number;
}

/* ── 10 Eco Topics (Pyramid rows) ──────────────── */

export const ECO_TOPICS: EcoTopic[] = [
  // Row 1 — 1 card
  { id: 'sun',       name: 'Sun and Daylight',        icon: '☀️', color: '#fbbf24', glowColor: 'rgba(251,191,36,0.35)',  description: 'Learn about the Sun, light and day-night', row: 1 },
  // Row 2 — 2 cards
  { id: 'planets',   name: 'Planets and Space',        icon: '🪐', color: '#3b82f6', glowColor: 'rgba(59,130,246,0.35)',  description: 'Explore planets, stars and the solar system', row: 2 },
  { id: 'air',       name: 'Air and Sky',              icon: '🌬️', color: '#06b6d4', glowColor: 'rgba(6,182,212,0.35)',   description: 'Atmosphere, wind and the air we breathe', row: 2 },
  // Row 3 — 3 cards
  { id: 'water',     name: 'Water World',              icon: '💧', color: '#0ea5e9', glowColor: 'rgba(14,165,233,0.35)',  description: 'Oceans, rain, rivers and the water cycle', row: 3 },
  { id: 'plants',    name: 'Plants and Trees',         icon: '🌱', color: '#22c55e', glowColor: 'rgba(34,197,94,0.35)',   description: 'Roots, leaves, flowers, forests and oxygen', row: 3 },
  { id: 'animals',   name: 'Animals Around Us',        icon: '🐾', color: '#f97316', glowColor: 'rgba(249,115,22,0.35)',  description: 'Farm animals, wild animals and habitats', row: 3 },
  // Row 4 — 4 cards
  { id: 'weather',   name: 'Weather and Seasons',      icon: '🌤️', color: '#eab308', glowColor: 'rgba(234,179,8,0.35)',   description: 'Clouds, rain, storms and seasons', row: 4 },
  { id: 'land',      name: 'Land and Soil',            icon: '⛰️', color: '#a16207', glowColor: 'rgba(161,98,7,0.35)',    description: 'Soil, rocks, seeds and the ground we walk on', row: 4 },
  { id: 'clean',     name: 'Clean Earth and Recycling', icon: '♻️', color: '#10b981', glowColor: 'rgba(16,185,129,0.35)',  description: 'Reduce, reuse, recycle — save our Earth', row: 4 },
  { id: 'funscience',name: 'Fun EVS in Nature',        icon: '🔬', color: '#8b5cf6', glowColor: 'rgba(139,92,246,0.35)',  description: 'Magnets, light, shadows and simple experiments', row: 4 },
];

/* ── Question Pools (30+ per topic) ────────────── */

const Q: Record<string, EcoQuestion[]> = {

  /* ─── 1. Sun and Daylight ─── */
  sun: [
    { question: 'The Sun is a ___?', options: ['Planet', 'Moon', 'Star', 'Comet'], correct: 2, tip: 'The Sun is a star — a giant ball of hot gas.' },
    { question: 'The Sun gives us ___ and heat.', options: ['Darkness', 'Light', 'Rain', 'Snow'], correct: 1, tip: 'The Sun gives us light and heat every day.' },
    { question: 'The Sun rises in the ___?', options: ['West', 'North', 'East', 'South'], correct: 2, tip: 'The Sun rises in the East and sets in the West.' },
    { question: 'The Sun sets in the ___?', options: ['East', 'North', 'West', 'South'], correct: 2, tip: 'The Sun sets in the West every evening.' },
    { question: 'What gives us day and night?', options: ['Moon rotating', 'Earth rotating', 'Sun moving', 'Stars shining'], correct: 1, tip: 'Earth spinning on its axis gives us day and night.' },
    { question: 'How long is one full day?', options: ['12 hours', '24 hours', '6 hours', '48 hours'], correct: 1, tip: 'One day and night together is 24 hours.' },
    { question: 'When the Sun is up, it is ___?', options: ['Night', 'Evening', 'Day', 'Midnight'], correct: 2, tip: 'Daytime is when the Sun shines above us.' },
    { question: 'When the Sun goes below, it is ___?', options: ['Morning', 'Afternoon', 'Night', 'Noon'], correct: 2, tip: 'Night comes when the Sun sets below the horizon.' },
    { question: 'Sunlight helps plants make ___?', options: ['Water', 'Soil', 'Food', 'Wind'], correct: 2, tip: 'Plants use sunlight to make their food through photosynthesis.' },
    { question: 'Sunlight takes about ___ minutes to reach Earth.', options: ['1', '8', '30', '60'], correct: 1, tip: 'Light from the Sun takes about 8 minutes to travel to Earth.' },
    { question: 'Too much sun can cause ___?', options: ['Frosting', 'Sunburn', 'Snow', 'Rain'], correct: 1, tip: 'Too much sun without protection can cause sunburn.' },
    { question: 'We should wear ___ in strong sunlight.', options: ['Raincoat', 'Sunscreen', 'Gloves', 'Socks'], correct: 1, tip: 'Sunscreen protects our skin from harmful sun rays.' },
    { question: 'A sundial uses ___ to tell time.', options: ['Water', 'Wind', 'Shadow', 'Colour'], correct: 2, tip: 'A sundial tells time using the shadow cast by sunlight.' },
    { question: 'What color is sunlight?', options: ['Blue', 'Red', 'White (all colors)', 'Green'], correct: 2, tip: 'Sunlight is white — it contains all the rainbow colors.' },
    { question: 'Shadows are ___ at noon.', options: ['Very long', 'Very short', 'Gone', 'Moving fast'], correct: 1, tip: 'At noon the Sun is right above, making shadows very short.' },
    { question: 'Shadows are ___ in the morning.', options: ['Very short', 'Long', 'Missing', 'Bright'], correct: 1, tip: 'Morning shadows are long because the Sun is low.' },
    { question: 'The Sun helps dry our ___?', options: ['Books', 'Clothes', 'Toys', 'Shoes only'], correct: 1, tip: 'We dry clothes in the Sun — its heat removes moisture.' },
    { question: 'What happens during sunrise?', options: ['It gets dark', 'Sky becomes bright', 'Stars come out', 'It rains'], correct: 1, tip: 'At sunrise the sky turns bright as the Sun appears.' },
    { question: 'How many hours of daylight in summer?', options: ['Less hours', 'More hours', 'Same as winter', 'Zero'], correct: 1, tip: 'Summer days are longer — we get more hours of sunlight.' },
    { question: 'Solar energy comes from the ___?', options: ['Moon', 'Stars', 'Sun', 'Earth'], correct: 2, tip: 'Solar energy is the energy we get from the Sun.' },
    { question: 'Solar panels use ___ to make electricity.', options: ['Wind', 'Water', 'Sunlight', 'Soil'], correct: 2, tip: 'Solar panels convert sunlight into electricity.' },
    { question: 'The Sun is ___ than the Earth.', options: ['Smaller', 'Same size', 'Much bigger', 'Lighter'], correct: 2, tip: 'The Sun is about 1.3 million times bigger than Earth!' },
    { question: 'Do all planets get equal sunlight?', options: ['Yes', 'No, closer ones get more', 'Only Earth', 'Only Mars'], correct: 1, tip: 'Planets closer to the Sun get more sunlight and heat.' },
    { question: 'What season has the longest days?', options: ['Winter', 'Summer', 'Monsoon', 'Autumn'], correct: 1, tip: 'Summer has the longest daylight hours.' },
    { question: 'Vitamin ___ comes from sunlight.', options: ['A', 'B', 'C', 'D'], correct: 3, tip: 'Our body makes Vitamin D when sunlight touches our skin.' },
    { question: 'What blocks sunlight from reaching us?', options: ['Thick clouds', 'Air', 'Wind', 'Sound'], correct: 0, tip: 'Thick clouds can block sunlight, making the day cloudy.' },
    { question: 'Morning time is ___ noon.', options: ['After', 'Before', 'Same as', 'Far from'], correct: 1, tip: 'Morning comes before noon (12 o\'clock).' },
    { question: 'Evening comes ___ sunset.', options: ['Long before', 'Around', 'After midnight', 'At noon'], correct: 1, tip: 'Evening is the time around and just after sunset.' },
    { question: 'An eclipse happens when ___?', options: ['It rains', 'Moon blocks the Sun', 'Stars fall', 'Wind blows'], correct: 1, tip: 'A solar eclipse happens when the Moon comes between the Sun and Earth.' },
    { question: 'Without the Sun, Earth would be ___?', options: ['Very hot', 'Very cold and dark', 'The same', 'Full of water'], correct: 1, tip: 'Without sunlight, Earth would be freezing and dark.' },
  ],

  /* ─── 2. Planets and Space ─── */
  planets: [
    { question: 'How many planets are in our solar system?', options: ['7', '8', '9', '10'], correct: 1, tip: 'There are 8 planets in our solar system.' },
    { question: 'Which planet is closest to the Sun?', options: ['Venus', 'Earth', 'Mercury', 'Mars'], correct: 2, tip: 'Mercury is the closest planet to the Sun.' },
    { question: 'Which is the largest planet?', options: ['Saturn', 'Jupiter', 'Neptune', 'Uranus'], correct: 1, tip: 'Jupiter is the biggest planet!' },
    { question: 'Which planet is called the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Mercury'], correct: 1, tip: 'Mars looks red because of iron in its soil.' },
    { question: 'Which planet has beautiful rings?', options: ['Jupiter', 'Mars', 'Saturn', 'Earth'], correct: 2, tip: 'Saturn has beautiful rings made of ice and rock.' },
    { question: 'Earth is the ___ planet from the Sun.', options: ['1st', '2nd', '3rd', '4th'], correct: 2, tip: 'Earth is the third planet from the Sun.' },
    { question: 'Which planet is called the Blue Planet?', options: ['Neptune', 'Earth', 'Uranus', 'Venus'], correct: 1, tip: 'Earth is called the Blue Planet because of its water.' },
    { question: 'How long does Earth take to orbit the Sun?', options: ['1 day', '1 month', '1 year', '1 week'], correct: 2, tip: 'Earth takes 365 days (1 year) to orbit around the Sun.' },
    { question: 'The Moon goes around the ___?', options: ['Sun', 'Mars', 'Earth', 'Jupiter'], correct: 2, tip: 'The Moon orbits around the Earth.' },
    { question: 'Which planet is the hottest?', options: ['Mercury', 'Venus', 'Mars', 'Jupiter'], correct: 1, tip: 'Venus is the hottest because thick clouds trap heat.' },
    { question: 'Which planet has the Great Red Spot?', options: ['Mars', 'Saturn', 'Jupiter', 'Neptune'], correct: 2, tip: 'Jupiter has a giant storm called the Great Red Spot.' },
    { question: 'Neptune is which color?', options: ['Red', 'Green', 'Blue', 'Yellow'], correct: 2, tip: 'Neptune appears blue because of methane gas.' },
    { question: 'How many moons does Earth have?', options: ['0', '1', '2', '3'], correct: 1, tip: 'Earth has just one Moon.' },
    { question: 'Which planet is farthest from the Sun?', options: ['Uranus', 'Saturn', 'Neptune', 'Pluto'], correct: 2, tip: 'Neptune is the farthest planet from the Sun.' },
    { question: 'Which planet spins on its side?', options: ['Mars', 'Neptune', 'Uranus', 'Saturn'], correct: 2, tip: 'Uranus spins on its side like a rolling ball!' },
    { question: 'Which is the smallest planet?', options: ['Mars', 'Mercury', 'Venus', 'Pluto'], correct: 1, tip: 'Mercury is the smallest planet in our solar system.' },
    { question: 'Our galaxy is called the ___?', options: ['Andromeda', 'Milky Way', 'Solar Way', 'Star Way'], correct: 1, tip: 'We live in the Milky Way galaxy.' },
    { question: 'A shooting star is actually a ___?', options: ['Star falling', 'Meteor burning', 'Rocket', 'Satellite'], correct: 1, tip: 'Shooting stars are tiny space rocks burning up in our atmosphere.' },
    { question: 'Stars twinkle because of Earth\'s ___?', options: ['Rotation', 'Atmosphere', 'Gravity', 'Water'], correct: 1, tip: 'Stars twinkle because light bends through our atmosphere.' },
    { question: 'India\'s space agency is ___?', options: ['NASA', 'ISRO', 'ESA', 'JAXA'], correct: 1, tip: 'ISRO — Indian Space Research Organisation.' },
    { question: 'The first man on the Moon was ___?', options: ['Yuri Gagarin', 'Buzz Aldrin', 'Neil Armstrong', 'Sunita Williams'], correct: 2, tip: 'Neil Armstrong walked on the Moon in 1969.' },
    { question: 'Astronauts float in space because of very little ___?', options: ['Air', 'Gravity', 'Light', 'Water'], correct: 1, tip: 'In space there is very little gravity, so they float.' },
    { question: 'A constellation is a group of ___?', options: ['Planets', 'Stars', 'Moons', 'Comets'], correct: 1, tip: 'Constellations are patterns of stars in the sky.' },
    { question: 'A comet has a bright ___?', options: ['Ring', 'Tail', 'Spot', 'Shadow'], correct: 1, tip: 'The Sun heats a comet, creating a glowing tail.' },
    { question: 'Chandrayaan is India\'s ___ mission.', options: ['Mars', 'Moon', 'Sun', 'Saturn'], correct: 1, tip: 'Chandrayaan means "Moon vehicle" in Sanskrit.' },
    { question: 'Space is mostly ___?', options: ['Full of air', 'Empty (vacuum)', 'Full of water', 'Full of fire'], correct: 1, tip: 'Space is almost completely empty — a vacuum.' },
    { question: 'A telescope helps us see ___?', options: ['Underground', 'Far-away stars', 'Inside body', 'Under water'], correct: 1, tip: 'Telescopes make faraway objects look closer.' },
    { question: 'Asteroids are found mostly between ___?', options: ['Earth & Moon', 'Mars & Jupiter', 'Sun & Mercury', 'Saturn & Neptune'], correct: 1, tip: 'The asteroid belt is between Mars and Jupiter.' },
    { question: 'Pluto is called a ___ planet.', options: ['Giant', 'Dwarf', 'Gas', 'Ring'], correct: 1, tip: 'Pluto was reclassified as a dwarf planet.' },
    { question: 'Rockets need ___ to fly.', options: ['Wings', 'Fuel', 'Wind', 'Wheels'], correct: 1, tip: 'Rockets burn fuel to push themselves forward.' },
  ],

  /* ─── 3. Air and Sky ─── */
  air: [
    { question: 'Air is made of mostly ___?', options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], correct: 1, tip: 'About 78% of air is nitrogen!' },
    { question: 'Which gas do we breathe in?', options: ['Nitrogen', 'Carbon dioxide', 'Oxygen', 'Hydrogen'], correct: 2, tip: 'We breathe in oxygen to stay alive.' },
    { question: 'Which gas do we breathe out?', options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Helium'], correct: 2, tip: 'We breathe out carbon dioxide.' },
    { question: 'Plants take in ___ from air?', options: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Smoke'], correct: 1, tip: 'Plants absorb carbon dioxide and release oxygen!' },
    { question: 'Wind is ___?', options: ['Sleeping air', 'Moving air', 'Frozen air', 'Colored air'], correct: 1, tip: 'Wind is air that is moving from one place to another.' },
    { question: 'The layer of air around Earth is called ___?', options: ['Ozone', 'Atmosphere', 'Sky layer', 'Cloud belt'], correct: 1, tip: 'The atmosphere is the blanket of air around Earth.' },
    { question: 'Can we see air?', options: ['Yes, it\'s blue', 'No, air is invisible', 'Only at night', 'Yes, it\'s white'], correct: 1, tip: 'Air is invisible — we can\'t see it, but we feel it!' },
    { question: 'A balloon floats because of ___?', options: ['Magic', 'Light gas inside', 'Water', 'String'], correct: 1, tip: 'Helium is lighter than regular air, so balloons float.' },
    { question: 'Air pollution is caused by ___?', options: ['Trees', 'Smoke from vehicles', 'Rain', 'Sunlight'], correct: 1, tip: 'Vehicle smoke, factories, and burning waste pollute air.' },
    { question: 'Without air, fire will ___?', options: ['Burn brighter', 'Go out', 'Change color', 'Explode'], correct: 1, tip: 'Fire needs oxygen from air to burn.' },
    { question: 'Which gas fills party balloons?', options: ['Oxygen', 'Helium', 'Nitrogen', 'CO2'], correct: 1, tip: 'Helium makes balloons float because it\'s very light.' },
    { question: 'Air has ___?', options: ['Weight', 'No weight', 'Color', 'Taste'], correct: 0, tip: 'Air has weight! A full room of air weighs about 50 kg.' },
    { question: 'Deep breathing is good for ___?', options: ['Teeth', 'Health', 'Hair', 'Nails'], correct: 1, tip: 'Deep breathing brings more oxygen to our body.' },
    { question: 'Where is air the thinnest?', options: ['At sea', 'In forests', 'On mountains', 'In caves'], correct: 2, tip: 'Air gets thinner as we go higher up mountains.' },
    { question: 'Windmills use ___ to make electricity.', options: ['Water', 'Sun', 'Wind', 'Coal'], correct: 2, tip: 'Windmills capture wind energy to generate electricity.' },
    { question: 'Smog is a mix of ___?', options: ['Smoke & fog', 'Sun & rain', 'Cloud & snow', 'Wind & dust'], correct: 0, tip: 'Smog = smoke + fog. It makes air unhealthy.' },
    { question: 'Flying a kite needs ___?', options: ['Rain', 'Wind', 'Snow', 'Darkness'], correct: 1, tip: 'Wind lifts and pushes the kite up into the sky.' },
    { question: 'The ozone layer protects us from ___?', options: ['Rain', 'Wind', 'Harmful UV rays', 'Cold'], correct: 2, tip: 'The ozone layer blocks dangerous ultraviolet rays from the Sun.' },
    { question: 'Yawning means your body wants more ___?', options: ['Food', 'Water', 'Oxygen', 'Sleep only'], correct: 2, tip: 'When we yawn, our body takes in a big gulp of oxygen.' },
    { question: 'Clouds are found in the ___?', options: ['Ground', 'Sea', 'Sky', 'Underground'], correct: 2, tip: 'Clouds float in the sky, made of tiny water droplets.' },
    { question: 'Airplanes fly through the ___?', options: ['Water', 'Ground', 'Air', 'Space'], correct: 2, tip: 'Airplanes move through the atmosphere — the blanket of air.' },
    { question: 'At night the sky shows ___?', options: ['Clouds only', 'The Sun', 'Moon and stars', 'Nothing'], correct: 2, tip: 'At night we see the Moon and many twinkling stars.' },
    { question: 'Breathing fast is called ___?', options: ['Snoring', 'Panting', 'Singing', 'Coughing'], correct: 1, tip: 'When we run, we pant — breathing fast to get more air.' },
    { question: 'Fresh air is found in ___?', options: ['Traffic', 'Gardens & forests', 'Factories', 'Parking lots'], correct: 1, tip: 'Trees and plants make the air fresh and clean.' },
    { question: 'A tornado is a strong spinning ___?', options: ['Water', 'Cloud of dust', 'Wind', 'Rock'], correct: 2, tip: 'A tornado is a powerful spinning column of wind.' },
    { question: 'Birds can fly because they have ___?', options: ['Hands', 'Wings', 'Fins', 'Wheels'], correct: 1, tip: 'Birds use their wings to push through the air and fly.' },
    { question: 'A parachute works because of ___?', options: ['Gravity only', 'Air pushing against it', 'Strings', 'Color'], correct: 1, tip: 'Air fills the parachute and slows the fall.' },
    { question: 'In a sealed room, air can become ___?', options: ['Fresh', 'Stale', 'Colorful', 'Cold only'], correct: 1, tip: 'Without fresh air coming in, a room becomes stuffy and stale.' },
    { question: 'The sky looks blue because of ___?', options: ['Water', 'Sunlight scattering', 'Paint', 'Ice'], correct: 1, tip: 'Sunlight bounces off air molecules, making the sky look blue.' },
    { question: 'Bubbles in water show that water has ___?', options: ['Salt', 'Air', 'Sugar', 'Sand'], correct: 1, tip: 'Water contains dissolved air — bubbles show the air escaping.' },
  ],

  /* ─── 4. Water World ─── */
  water: [
    { question: 'How much of Earth is covered by water?', options: ['25%', '50%', '70%', '90%'], correct: 2, tip: 'About 70% of Earth\'s surface is water!' },
    { question: 'The water cycle starts with ___?', options: ['Rain', 'Evaporation', 'Snow', 'Rivers'], correct: 1, tip: 'The Sun heats water, making it evaporate into the sky.' },
    { question: 'Clouds are made of tiny ___?', options: ['Stones', 'Water droplets', 'Stars', 'Sand'], correct: 1, tip: 'Clouds are millions of tiny water droplets.' },
    { question: 'Rain comes from ___?', options: ['Space', 'Clouds', 'Mountains', 'Trees'], correct: 1, tip: 'When cloud droplets get heavy, they fall as rain.' },
    { question: 'Which is the largest ocean?', options: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], correct: 2, tip: 'The Pacific Ocean is the largest and deepest ocean.' },
    { question: 'Is ocean water drinkable?', options: ['Yes', 'No, it\'s salty', 'Only when cold', 'Only when hot'], correct: 1, tip: 'Ocean water is too salty to drink.' },
    { question: 'Ice is water in ___ form?', options: ['Liquid', 'Gas', 'Solid', 'Plasma'], correct: 2, tip: 'When water freezes, it becomes solid ice.' },
    { question: 'Steam is water in ___ form?', options: ['Solid', 'Liquid', 'Gas', 'Crystal'], correct: 2, tip: 'When water boils, it turns into steam (gas).' },
    { question: 'We should ___ water.', options: ['Waste', 'Save', 'Color', 'Freeze only'], correct: 1, tip: 'Clean water is precious — we must save every drop!' },
    { question: 'Rivers flow into the ___?', options: ['Sky', 'Mountains', 'Sea / Ocean', 'Desert'], correct: 2, tip: 'Most rivers flow downhill into the sea or ocean.' },
    { question: 'What is groundwater?', options: ['Water on ground', 'Water under the ground', 'Rain water', 'Sea water'], correct: 1, tip: 'Groundwater is water stored underground in rocks and soil.' },
    { question: 'A glacier is a huge mass of ___?', options: ['Sand', 'Ice', 'Rock', 'Mud'], correct: 1, tip: 'Glaciers are giant rivers of ice found on mountains.' },
    { question: 'Water boils at ___ °C?', options: ['0', '50', '100', '200'], correct: 2, tip: 'Water boils at 100 °C and freezes at 0 °C.' },
    { question: 'Water freezes at ___ °C?', options: ['0', '10', '50', '100'], correct: 0, tip: 'Water turns to ice at 0 °C.' },
    { question: 'Which animal lives in both water and land?', options: ['Fish', 'Frog', 'Whale', 'Eagle'], correct: 1, tip: 'Frogs are amphibians — they live on land and in water.' },
    { question: 'Drinking dirty water can cause ___?', options: ['Strength', 'Diseases', 'Happiness', 'Growth'], correct: 1, tip: 'Dirty water has germs that make us sick.' },
    { question: 'What makes a rainbow appear?', options: ['Wind', 'Sunlight through rain', 'Moon', 'Stars'], correct: 1, tip: 'Sunlight splits into 7 colors when it passes through raindrops.' },
    { question: 'Wells bring up ___?', options: ['Air', 'Oil', 'Underground water', 'Mud'], correct: 2, tip: 'Wells are dug to bring up groundwater for drinking.' },
    { question: 'The biggest river in India is ___?', options: ['Yamuna', 'Ganga', 'Godavari', 'Narmada'], correct: 1, tip: 'The Ganga is the most important river in India.' },
    { question: 'Condensation means gas becomes ___?', options: ['Solid', 'Liquid', 'Gas', 'Plasma'], correct: 1, tip: 'When steam cools, it condenses into water droplets.' },
    { question: 'Fish breathe using ___?', options: ['Lungs', 'Nose', 'Gills', 'Mouth'], correct: 2, tip: 'Fish have gills that take oxygen from water.' },
    { question: 'A pond is ___ than a lake.', options: ['Bigger', 'Smaller', 'Deeper', 'Wider'], correct: 1, tip: 'Ponds are smaller and shallower than lakes.' },
    { question: 'Tap water comes from ___?', options: ['Clouds', 'Treated water supply', 'Shops', 'Air'], correct: 1, tip: 'Tap water is cleaned and treated before reaching our homes.' },
    { question: 'The three states of water are ___?', options: ['Hot, cold, warm', 'Solid, liquid, gas', 'Big, small, tiny', 'Rain, snow, hail'], correct: 1, tip: 'Water exists as solid (ice), liquid (water), and gas (steam).' },
    { question: 'We use water for ___?', options: ['Only drinking', 'Drinking, cooking, cleaning', 'Only cooking', 'Only bathing'], correct: 1, tip: 'We use water for many things — drinking, cooking, cleaning, farming, etc.' },
    { question: 'What happens when you heat ice?', options: ['It stays ice', 'It melts into water', 'It becomes sand', 'Nothing'], correct: 1, tip: 'Heating ice turns it into liquid water (melting).' },
    { question: 'Waterfall is water flowing down a ___?', options: ['Flat road', 'Cliff / high rock', 'Tunnel', 'Bridge'], correct: 1, tip: 'A waterfall flows down from a steep cliff or rocks.' },
    { question: 'Which season brings the most rain in India?', options: ['Winter', 'Summer', 'Monsoon', 'Spring'], correct: 2, tip: 'The monsoon season (June-September) brings the most rain.' },
    { question: 'Drought means ___?', options: ['Too much rain', 'Very little rain', 'Heavy snow', 'Strong wind'], correct: 1, tip: 'Droughts happen when an area gets very little rain.' },
    { question: 'How much of Earth\'s water is drinking water?', options: ['70%', '50%', 'Only about 3%', '10%'], correct: 2, tip: 'Only about 3% of all water on Earth is fresh drinking water.' },
  ],

  /* ─── 5. Plants and Trees ─── */
  plants: [
    { question: 'Trees give us ___?', options: ['Carbon dioxide', 'Oxygen', 'Nitrogen', 'Smoke'], correct: 1, tip: 'Trees breathe out oxygen that we need to survive.' },
    { question: 'Plants make food using ___?', options: ['Darkness', 'Sunlight', 'Fire', 'Rocks'], correct: 1, tip: 'Plants use sunlight + CO₂ + water to make their food.' },
    { question: 'Plants need ___ to grow.', options: ['Darkness only', 'Sunlight, water & soil', 'Only water', 'Only air'], correct: 1, tip: 'Plants need sunlight, water, air, and soil nutrients.' },
    { question: 'The green color in leaves comes from ___?', options: ['Paint', 'Chlorophyll', 'Water', 'Soil'], correct: 1, tip: 'Chlorophyll gives leaves their green color.' },
    { question: 'Seeds grow into ___?', options: ['Rocks', 'New plants', 'Animals', 'Water'], correct: 1, tip: 'Seeds contain a baby plant inside them!' },
    { question: 'Roots absorb ___ from soil.', options: ['Sunlight', 'Water and nutrients', 'Air only', 'Insects'], correct: 1, tip: 'Roots soak up water and nutrients from the soil.' },
    { question: 'Forests are called the ___ of Earth.', options: ['Eyes', 'Lungs', 'Heart', 'Brain'], correct: 1, tip: 'Forests produce oxygen — like Earth\'s lungs.' },
    { question: 'Bees help plants by ___?', options: ['Eating leaves', 'Pollination', 'Cutting stems', 'Making shade'], correct: 1, tip: 'Bees carry pollen between flowers, helping plants grow fruit.' },
    { question: 'A cactus stores water in its ___?', options: ['Leaves', 'Roots', 'Stem', 'Flowers'], correct: 2, tip: 'Cacti store water in their thick stems for dry times.' },
    { question: 'Planting trees helps reduce ___?', options: ['Oxygen', 'Pollution', 'Rain', 'Sunshine'], correct: 1, tip: 'Trees absorb CO₂ and clean the air.' },
    { question: 'Sunflowers face the ___?', options: ['Moon', 'Ground', 'Sun', 'Stars'], correct: 2, tip: 'Sunflowers turn to face the Sun as it moves across the sky.' },
    { question: 'Fruits contain ___ for new plants.', options: ['Leaves', 'Seeds', 'Roots', 'Bark'], correct: 1, tip: 'Seeds inside fruits can grow into new plants.' },
    { question: 'The Amazon is the largest ___?', options: ['Desert', 'Ocean', 'Rainforest', 'Mountain'], correct: 2, tip: 'The Amazon Rainforest produces 20% of Earth\'s oxygen.' },
    { question: 'Leaves change color in ___?', options: ['Summer', 'Autumn / Fall', 'Spring', 'Monsoon'], correct: 1, tip: 'In autumn, leaves turn red, orange, and yellow before falling.' },
    { question: 'Plants release oxygen through tiny ___?', options: ['Pores', 'Stomata', 'Eyes', 'Cracks'], correct: 1, tip: 'Stomata are tiny openings on leaves for gas exchange.' },
    { question: 'A mushroom is a type of ___?', options: ['Plant', 'Animal', 'Fungus', 'Bacteria'], correct: 2, tip: 'Mushrooms are fungi, not plants!' },
    { question: 'Which part of a plant is underground?', options: ['Leaf', 'Flower', 'Root', 'Fruit'], correct: 2, tip: 'Roots grow underground and hold the plant in soil.' },
    { question: 'The trunk of a tree is its ___?', options: ['Arm', 'Main stem', 'Root', 'Leaf'], correct: 1, tip: 'The trunk is the strong main stem of a tree.' },
    { question: 'Flowers attract insects with their ___?', options: ['Thorns', 'Color and smell', 'Roots', 'Bark'], correct: 1, tip: 'Bright colors and sweet smell attract bees and butterflies.' },
    { question: 'We get rubber from ___?', options: ['Animals', 'Rocks', 'Rubber tree sap', 'Water'], correct: 2, tip: 'Rubber is made from the sticky sap (latex) of rubber trees.' },
    { question: 'Rice grows in ___?', options: ['Dry sand', 'Water fields (paddy)', 'Rocks', 'Mountains'], correct: 1, tip: 'Rice plants grow in flooded fields called paddy fields.' },
    { question: 'Mango is the national fruit of ___?', options: ['USA', 'UK', 'India', 'Japan'], correct: 2, tip: 'The delicious Mango is India\'s national fruit.' },
    { question: 'Which plant has thorns?', options: ['Tulip', 'Rose', 'Lily', 'Lotus'], correct: 1, tip: 'Rose plants have thorns on their stems.' },
    { question: 'Banyan tree is called the national ___ of India.', options: ['Flower', 'Tree', 'Fruit', 'Plant'], correct: 1, tip: 'The Banyan tree is India\'s national tree.' },
    { question: 'Wheat is used to make ___?', options: ['Clothes', 'Bread and roti', 'Toys', 'Furniture'], correct: 1, tip: 'Wheat flour is used to make bread, roti, and more.' },
    { question: 'Lotus grows in ___?', options: ['Desert sand', 'Water', 'Snow', 'Dry soil'], correct: 1, tip: 'Lotus is a beautiful flower that grows in ponds and lakes.' },
    { question: 'Neem leaves are used as ___?', options: ['Toys', 'Natural medicine', 'Paint', 'Fuel'], correct: 1, tip: 'Neem has been used as natural medicine for centuries.' },
    { question: 'How do plants drink water?', options: ['Through flowers', 'Through roots', 'Through leaves', 'They don\'t'], correct: 1, tip: 'Plants absorb water mainly through their roots.' },
    { question: 'Coconut grows on a ___ tree.', options: ['Short', 'Tall palm', 'Bush', 'Creeper'], correct: 1, tip: 'Coconut trees are tall palm trees found near coasts.' },
    { question: 'Plants also breathe at ___?', options: ['Only daytime', 'Only night', 'All the time', 'Never'], correct: 2, tip: 'Plants breathe (respire) all the time — day and night.' },
  ],

  /* ─── 6. Animals Around Us ─── */
  animals: [
    { question: 'The fastest land animal is ___?', options: ['Lion', 'Cheetah', 'Horse', 'Tiger'], correct: 1, tip: 'Cheetahs can run up to 120 km/h!' },
    { question: 'Which is the largest animal on Earth?', options: ['Elephant', 'Giraffe', 'Blue Whale', 'Dinosaur'], correct: 2, tip: 'The Blue Whale is the largest animal ever — up to 30 meters!' },
    { question: 'A group of lions is called a ___?', options: ['Pack', 'Herd', 'Pride', 'Flock'], correct: 2, tip: 'A group of lions is called a pride.' },
    { question: 'Which bird cannot fly?', options: ['Eagle', 'Sparrow', 'Ostrich', 'Parrot'], correct: 2, tip: 'Ostriches are too heavy to fly but they run very fast!' },
    { question: 'Dolphins breathe with ___?', options: ['Gills', 'Lungs', 'Skin', 'Fins'], correct: 1, tip: 'Dolphins are mammals — they breathe air through lungs.' },
    { question: 'Where do polar bears live?', options: ['Desert', 'Forest', 'Arctic (cold)', 'Ocean'], correct: 2, tip: 'Polar bears live in the freezing Arctic region.' },
    { question: 'A caterpillar becomes a ___?', options: ['Ant', 'Butterfly', 'Spider', 'Bee'], correct: 1, tip: 'Caterpillars transform into butterflies — metamorphosis!' },
    { question: 'Which animal has the longest neck?', options: ['Elephant', 'Snake', 'Giraffe', 'Camel'], correct: 2, tip: 'Giraffes have the longest necks of any animal.' },
    { question: 'A baby frog is called a ___?', options: ['Cub', 'Tadpole', 'Pup', 'Chick'], correct: 1, tip: 'Baby frogs are called tadpoles — they live in water!' },
    { question: 'Herbivores eat only ___?', options: ['Meat', 'Plants', 'Both', 'Insects'], correct: 1, tip: 'Herbivores like cows and rabbits eat only plants.' },
    { question: 'Carnivores eat only ___?', options: ['Plants', 'Meat', 'Fruits', 'Grass'], correct: 1, tip: 'Carnivores like lions and sharks eat other animals.' },
    { question: 'Which animal has 8 legs?', options: ['Ant', 'Bee', 'Spider', 'Butterfly'], correct: 2, tip: 'Spiders have 8 legs — they are arachnids, not insects.' },
    { question: 'Camels store ___ in their humps.', options: ['Water', 'Fat', 'Food', 'Air'], correct: 1, tip: 'Camel humps store fat, not water!' },
    { question: 'The national bird of India is ___?', options: ['Sparrow', 'Crow', 'Peacock', 'Parrot'], correct: 2, tip: 'The beautiful Peacock is India\'s national bird.' },
    { question: 'Fish breathe through ___?', options: ['Nose', 'Mouth', 'Gills', 'Lungs'], correct: 2, tip: 'Fish have gills that take oxygen from water.' },
    { question: 'Owls can see best at ___?', options: ['Morning', 'Afternoon', 'Night', 'Evening'], correct: 2, tip: 'Owls are nocturnal — they have excellent night vision.' },
    { question: 'A baby kangaroo lives in its mother\'s ___?', options: ['Tail', 'Ear', 'Pouch', 'Back'], correct: 2, tip: 'Baby kangaroos (joeys) grow inside their mother\'s pouch.' },
    { question: 'Which insects make honey?', options: ['Ants', 'Butterflies', 'Bees', 'Flies'], correct: 2, tip: 'Honeybees collect nectar from flowers to make honey.' },
    { question: 'The tiger is the national animal of ___?', options: ['USA', 'UK', 'India', 'China'], correct: 2, tip: 'The Royal Bengal Tiger is India\'s national animal.' },
    { question: 'Penguins live in ___?', options: ['Desert', 'Forest', 'Cold regions', 'Mountains'], correct: 2, tip: 'Most penguins live in Antarctica — the coldest place on Earth.' },
    { question: 'A cow gives us ___?', options: ['Eggs', 'Milk', 'Honey', 'Silk'], correct: 1, tip: 'Cows give us milk, which is healthy and nutritious.' },
    { question: 'A hen gives us ___?', options: ['Milk', 'Eggs', 'Wool', 'Honey'], correct: 1, tip: 'Hens lay eggs that we eat for breakfast.' },
    { question: 'Sheep give us ___?', options: ['Milk', 'Eggs', 'Wool', 'Silk'], correct: 2, tip: 'Sheep\'s thick coat is sheared to make wool.' },
    { question: 'Animals that sleep during the day are ___?', options: ['Diurnal', 'Nocturnal', 'Hibernating', 'Extinct'], correct: 1, tip: 'Nocturnal animals sleep during the day and are active at night.' },
    { question: 'Which animal is man\'s best friend?', options: ['Cat', 'Horse', 'Dog', 'Parrot'], correct: 2, tip: 'Dogs are called man\'s best friend for their loyalty.' },
    { question: 'Silk comes from ___?', options: ['Sheep', 'Spider', 'Silkworm', 'Cotton plant'], correct: 2, tip: 'Silkworms spin fine threads that we make into silk cloth.' },
    { question: 'Omnivores eat ___?', options: ['Only plants', 'Only meat', 'Both plants and meat', 'Nothing'], correct: 2, tip: 'Bears and humans are omnivores — we eat both plants and meat.' },
    { question: 'Which animal changes color?', options: ['Cat', 'Dog', 'Chameleon', 'Horse'], correct: 2, tip: 'Chameleons can change the color of their skin!' },
    { question: 'Ants live in ___?', options: ['Nests in trees', 'Anthills / colonies', 'Water', 'Clouds'], correct: 1, tip: 'Ants live in organized colonies, often underground.' },
    { question: 'A baby dog is called a ___?', options: ['Cub', 'Kitten', 'Puppy', 'Foal'], correct: 2, tip: 'Baby dogs are called puppies.' },
  ],

  /* ─── 7. Weather and Seasons ─── */
  weather: [
    { question: 'Rain comes from ___?', options: ['Space', 'Clouds', 'Underground', 'Mountains'], correct: 1, tip: 'Rain falls from clouds when water droplets become heavy.' },
    { question: 'How many seasons does India have?', options: ['2', '4', '6', '3'], correct: 2, tip: 'India has 6 seasons including Summer, Monsoon and Winter.' },
    { question: 'Thunder is caused by ___?', options: ['Wind', 'Lightning heating air', 'Clouds bumping', 'Rain'], correct: 1, tip: 'Lightning heats air so fast it creates a booming sound!' },
    { question: 'A thermometer measures ___?', options: ['Wind', 'Rain', 'Temperature', 'Sunlight'], correct: 2, tip: 'Thermometers show how hot or cold it is.' },
    { question: 'Which season has the most rain in India?', options: ['Winter', 'Summer', 'Monsoon', 'Spring'], correct: 2, tip: 'The monsoon season (June-Sept) brings the most rain.' },
    { question: 'Snow is frozen ___?', options: ['Air', 'Dust', 'Water', 'Sand'], correct: 2, tip: 'Snow is ice crystals formed from water vapor in clouds.' },
    { question: 'A rainbow has ___ colors.', options: ['5', '6', '7', '8'], correct: 2, tip: 'VIBGYOR — Violet, Indigo, Blue, Green, Yellow, Orange, Red.' },
    { question: 'Fog is a cloud at ___?', options: ['High altitude', 'Ground level', 'In space', 'Underground'], correct: 1, tip: 'Fog is just a cloud that forms near the ground.' },
    { question: 'Wind speed is measured by ___?', options: ['Thermometer', 'Barometer', 'Anemometer', 'Ruler'], correct: 2, tip: 'An anemometer spins in the wind to measure its speed.' },
    { question: 'Hailstones are balls of ___?', options: ['Rock', 'Sand', 'Ice', 'Crystal'], correct: 2, tip: 'Hailstones are lumps of ice that fall from storm clouds.' },
    { question: 'The hottest season in India is ___?', options: ['Winter', 'Monsoon', 'Summer', 'Autumn'], correct: 2, tip: 'Summer (April-June) is the hottest season in India.' },
    { question: 'A cyclone is a strong ___?', options: ['Earthquake', 'Windstorm', 'Flood', 'Drought'], correct: 1, tip: 'Cyclones are powerful rotating storms with strong winds.' },
    { question: 'Evaporation happens when ___?', options: ['Water cools', 'Water freezes', 'Sun heats water', 'Wind blows'], correct: 2, tip: 'The Sun\'s heat turns water into invisible water vapor.' },
    { question: 'In winter, days are ___?', options: ['Longer', 'Shorter', 'Same', 'Hotter'], correct: 1, tip: 'Winter days are shorter because the Sun sets earlier.' },
    { question: 'Dew drops form in the ___?', options: ['Afternoon', 'Evening', 'Early morning', 'Midnight'], correct: 2, tip: 'Cool morning air turns vapor into tiny dew drops on grass.' },
    { question: 'Climate is the ___ weather pattern.', options: ['Daily', 'Weekly', 'Long-term average', 'Monthly'], correct: 2, tip: 'Climate is the average weather over many years.' },
    { question: 'Rain clouds are usually ___?', options: ['White & fluffy', 'Dark & heavy', 'Thin & wispy', 'Red'], correct: 1, tip: 'Dark clouds are full of water and bring rain.' },
    { question: 'A weather forecast predicts ___?', options: ['Past weather', 'Future weather', 'Moon phases', 'Tides'], correct: 1, tip: 'Forecasts help us plan by predicting rain, sun, etc.' },
    { question: 'Which instrument measures rainfall?', options: ['Barometer', 'Rain gauge', 'Compass', 'Telescope'], correct: 1, tip: 'A rain gauge collects rain to measure how much falls.' },
    { question: 'What do we wear in summer?', options: ['Sweaters', 'Light cotton clothes', 'Raincoat', 'Boots'], correct: 1, tip: 'Light cotton clothes keep us cool in hot summer weather.' },
    { question: 'What do we use in rainy season?', options: ['Sunglasses', 'Umbrella', 'Fan', 'Blanket'], correct: 1, tip: 'An umbrella keeps us dry during rain.' },
    { question: 'Spring is known for ___?', options: ['Snow', 'Flowers blooming', 'Very hot sun', 'Strong storms'], correct: 1, tip: 'In spring, trees get new leaves and flowers bloom everywhere.' },
    { question: 'When water vapor cools it forms ___?', options: ['Fire', 'Clouds', 'Smoke', 'Dust'], correct: 1, tip: 'Cool water vapor condenses into tiny droplets forming clouds.' },
    { question: 'Hot air ___?', options: ['Sinks down', 'Stays still', 'Rises up', 'Moves sideways'], correct: 2, tip: 'Hot air is lighter than cold air, so it rises up.' },
    { question: 'Autumn is also called ___?', options: ['Spring', 'Fall', 'Summer', 'Monsoon'], correct: 1, tip: 'Autumn is called Fall because leaves fall from the trees.' },
    { question: 'We see lightning ___ we hear thunder.', options: ['After', 'Before', 'Same time', 'Never'], correct: 1, tip: 'Light travels faster than sound, so we see lightning first.' },
    { question: 'Frost forms when it is very ___?', options: ['Hot', 'Windy', 'Cold', 'Rainy'], correct: 2, tip: 'Frost forms when temperatures drop below freezing point.' },
    { question: 'Which season do birds migrate?', options: ['Summer', 'Monsoon', 'Winter', 'Spring'], correct: 2, tip: 'Many birds fly to warmer places in winter.' },
    { question: 'A barometer measures ___?', options: ['Temperature', 'Air pressure', 'Humidity', 'Wind speed'], correct: 1, tip: 'A barometer measures air pressure to predict weather.' },
    { question: 'Humidity means moisture in the ___?', options: ['Soil', 'Water', 'Air', 'Food'], correct: 2, tip: 'Humidity is the amount of water vapor in the air.' },
  ],

  /* ─── 8. Land and Soil ─── */
  land: [
    { question: 'Soil helps plants to ___?', options: ['Fly', 'Grow', 'Swim', 'Sing'], correct: 1, tip: 'Soil gives plants nutrients and a place to grow roots.' },
    { question: 'Seeds grow in ___?', options: ['Air', 'Soil', 'Fire', 'Plastic'], correct: 1, tip: 'Seeds need soil, water and sunlight to sprout.' },
    { question: 'Soil is made of tiny bits of ___?', options: ['Glass', 'Rock', 'Metal', 'Plastic'], correct: 1, tip: 'Over millions of years, rocks break down into tiny bits forming soil.' },
    { question: 'Earthworms are ___ for soil.', options: ['Bad', 'Good', 'Useless', 'Dangerous'], correct: 1, tip: 'Earthworms make soil healthy by mixing and aerating it.' },
    { question: 'What lives in the soil?', options: ['Stars', 'Worms and insects', 'Fish', 'Birds'], correct: 1, tip: 'Soil is home to worms, ants, beetles and many tiny creatures.' },
    { question: 'Rocks are ___?', options: ['Soft', 'Hard', 'Liquid', 'Gas'], correct: 1, tip: 'Rocks are hard, solid things found in the ground and mountains.' },
    { question: 'Sand is found at a ___?', options: ['Mountain top', 'Beach', 'Cloud', 'Lake bottom'], correct: 1, tip: 'Sandy beaches are made of very tiny broken pieces of rock.' },
    { question: 'A mountain is a very high ___?', options: ['Water body', 'Cloud', 'Land form', 'Building'], correct: 2, tip: 'Mountains are very tall landforms rising high above the ground.' },
    { question: 'A valley is a low area between ___?', options: ['Oceans', 'Clouds', 'Hills or mountains', 'Cities'], correct: 2, tip: 'Valleys are flat, low areas between hills or mountains.' },
    { question: 'What is a desert?', options: ['Wet forest', 'Dry land with little rain', 'Deep ocean', 'Frozen land'], correct: 1, tip: 'Deserts are dry areas that get very little rain.' },
    { question: 'Fertile soil is good for ___?', options: ['Swimming', 'Farming', 'Flying', 'Reading'], correct: 1, tip: 'Fertile soil has many nutrients, perfect for growing crops.' },
    { question: 'Clay soil holds ___ well.', options: ['Air', 'Water', 'Light', 'Heat only'], correct: 1, tip: 'Clay soil has tiny particles that hold water tightly.' },
    { question: 'Sandy soil lets water ___ quickly.', options: ['Stay', 'Pass through', 'Freeze', 'Evaporate'], correct: 1, tip: 'Sand has big gaps between particles, so water drains fast.' },
    { question: 'A flat area of land is called a ___?', options: ['Hill', 'Mountain', 'Plain', 'Valley'], correct: 2, tip: 'Plains are large flat areas of land good for farming.' },
    { question: 'An island is land surrounded by ___?', options: ['Air', 'Mountains', 'Water', 'Trees'], correct: 2, tip: 'An island is a piece of land completely surrounded by water.' },
    { question: 'Soil erosion is caused by ___?', options: ['Trees', 'Wind and water', 'Sunlight', 'Stars'], correct: 1, tip: 'Wind and running water wash away the top layer of soil.' },
    { question: 'Planting trees helps stop ___?', options: ['Rain', 'Soil erosion', 'Clouds', 'Stars'], correct: 1, tip: 'Tree roots hold the soil together and prevent erosion.' },
    { question: 'A volcano has hot ___ inside.', options: ['Water', 'Lava', 'Air', 'Ice'], correct: 1, tip: 'Volcanoes have melted rock (lava) inside that can erupt.' },
    { question: 'The top layer of soil is called ___?', options: ['Bedrock', 'Topsoil', 'Sandstone', 'Lava'], correct: 1, tip: 'Topsoil is the rich, dark top layer where plants grow best.' },
    { question: 'We get clay from ___?', options: ['Trees', 'Soil', 'Air', 'Space'], correct: 1, tip: 'Clay is a special type of fine soil used to make pots.' },
    { question: 'Farmers ___ the soil before planting.', options: ['Paint', 'Plough', 'Freeze', 'Burn'], correct: 1, tip: 'Ploughing loosens the soil and mixes in nutrients.' },
    { question: 'Compost is made from ___?', options: ['Plastic', 'Rotting plant waste', 'Rocks', 'Metal'], correct: 1, tip: 'Compost is decayed plant matter that enriches soil.' },
    { question: 'We build houses on ___?', options: ['Water', 'Air', 'Land', 'Clouds'], correct: 2, tip: 'We build our homes on solid ground — land.' },
    { question: 'A hill is ___ than a mountain.', options: ['Taller', 'Smaller', 'Wider', 'Heavier'], correct: 1, tip: 'Hills are shorter and rounder than mountains.' },
    { question: 'Caves are found inside ___?', options: ['Trees', 'Rocks / hills', 'Water', 'Clouds'], correct: 1, tip: 'Caves are hollow spaces formed inside rocks over time.' },
    { question: 'What is mud?', options: ['Dry sand', 'Wet soil', 'Hard rock', 'Clean water'], correct: 1, tip: 'When soil gets wet with water, it becomes soft mud.' },
    { question: 'Stones are smaller pieces of ___?', options: ['Clouds', 'Rock', 'Water', 'Air'], correct: 1, tip: 'Stones are small pieces broken off from larger rocks.' },
    { question: 'A plateau is a flat area on top of a ___?', options: ['Lake', 'Hill or mountain', 'River', 'Tree'], correct: 1, tip: 'A plateau is a flat, raised landform — like a table-top mountain.' },
    { question: 'The land near a river is usually ___?', options: ['Dry', 'Very fertile', 'Rocky', 'Frozen'], correct: 1, tip: 'River banks have rich, fertile soil good for growing crops.' },
    { question: 'Landslides happen when ___ moves down.', options: ['Air', 'Soil and rock', 'Stars', 'Wind'], correct: 1, tip: 'Landslides happen when rain loosens soil on steep slopes.' },
  ],

  /* ─── 9. Clean Earth and Recycling ─── */
  clean: [
    { question: 'Plastic takes ___ years to decompose.', options: ['1', '10', '100-500', '5'], correct: 2, tip: 'Plastic can take 100 to 500 years to break down!' },
    { question: 'The 3 Rs of waste are ___?', options: ['Run, Read, Rest', 'Reduce, Reuse, Recycle', 'Rain, River, Rock', 'Red, Rose, Ruby'], correct: 1, tip: 'Reduce, Reuse, Recycle — the 3 Rs help save our Earth.' },
    { question: 'Planting trees helps fight ___?', options: ['Darkness', 'Climate change', 'Thunder', 'Stars'], correct: 1, tip: 'Trees absorb CO₂, helping fight global warming.' },
    { question: 'Single-use plastic means ___?', options: ['Strong plastic', 'Used once then thrown', 'Reusable', 'Edible'], correct: 1, tip: 'Single-use plastics like straws pollute forever.' },
    { question: 'Which bag is better for Earth?', options: ['Plastic bag', 'Cloth / jute bag', 'Polythene bag', 'Foam bag'], correct: 1, tip: 'Cloth bags can be reused many times and don\'t pollute.' },
    { question: 'Turning off lights saves ___?', options: ['Water', 'Electricity', 'Food', 'Paper'], correct: 1, tip: 'Saving electricity reduces pollution from power plants.' },
    { question: 'Global warming means Earth is getting ___?', options: ['Colder', 'Hotter', 'Bigger', 'Smaller'], correct: 1, tip: 'Pollution traps heat, making Earth\'s temperature rise.' },
    { question: 'Which pollutes water?', options: ['Fish', 'Factory waste', 'Sunlight', 'Wind'], correct: 1, tip: 'Factories dumping chemicals pollute rivers and oceans.' },
    { question: 'We should use ___ bottles instead of plastic.', options: ['Glass', 'Paper', 'Steel / reusable', 'Foam'], correct: 2, tip: 'Reusable bottles reduce plastic waste.' },
    { question: 'Endangered means an animal is ___?', options: ['Very common', 'At risk of dying out', 'Very fast', 'Very large'], correct: 1, tip: 'Endangered animals may become extinct if not protected.' },
    { question: 'Solar panels use ___ for energy.', options: ['Wind', 'Water', 'Sunlight', 'Coal'], correct: 2, tip: 'Solar panels convert sunlight into clean electricity.' },
    { question: 'Oil spills in the ocean harm ___?', options: ['Nothing', 'Sea life', 'Only rocks', 'Only sand'], correct: 1, tip: 'Oil spills kill fish, birds, and damage ocean ecosystems.' },
    { question: 'Composting turns waste into ___?', options: ['Water', 'Soil / fertilizer', 'Plastic', 'Metal'], correct: 1, tip: 'Composting turns food scraps into rich soil for plants.' },
    { question: 'Noise pollution comes from ___?', options: ['Flowers', 'Loud honking & machines', 'Trees', 'Rain'], correct: 1, tip: 'Too much noise from traffic and machines causes pollution.' },
    { question: 'Deforestation means ___?', options: ['Planting trees', 'Cutting down forests', 'Watering plants', 'Growing seeds'], correct: 1, tip: 'Cutting forests destroys habitats and increases pollution.' },
    { question: 'Using both sides of paper saves ___?', options: ['Water', 'Trees', 'Fuel', 'Electricity'], correct: 1, tip: 'Paper is made from trees — less paper saves forests.' },
    { question: 'Walking or cycling reduces ___?', options: ['Exercise', 'Air pollution', 'Sunlight', 'Noise'], correct: 1, tip: 'Walking and cycling produce zero pollution!' },
    { question: 'Earth Day is celebrated on ___?', options: ['Jan 1', 'April 22', 'Aug 15', 'Dec 25'], correct: 1, tip: 'Earth Day is April 22 — a day to protect our planet.' },
    { question: 'Which is a renewable energy source?', options: ['Coal', 'Petrol', 'Wind', 'Diesel'], correct: 2, tip: 'Wind, solar, and water are renewable — they never run out.' },
    { question: 'We should throw garbage in a ___?', options: ['River', 'Road', 'Dustbin', 'Garden'], correct: 2, tip: 'Always throw garbage in a dustbin, never on the ground.' },
    { question: 'Recycling means making ___ things from old.', options: ['Same', 'New', 'Bad', 'Dirty'], correct: 1, tip: 'Recycling turns old materials into new useful products.' },
    { question: 'Burning garbage causes ___?', options: ['Fresh air', 'Air pollution', 'Rain', 'Flowers'], correct: 1, tip: 'Burning waste releases harmful smoke and gases.' },
    { question: 'Green dustbin is for ___ waste.', options: ['Plastic', 'Paper', 'Wet / kitchen waste', 'Glass'], correct: 2, tip: 'Green bins collect wet waste like food scraps and peels.' },
    { question: 'Blue dustbin is for ___ waste.', options: ['Wet waste', 'Dry / recyclable waste', 'Only paper', 'Only glass'], correct: 1, tip: 'Blue bins collect dry waste like paper, plastic, metal.' },
    { question: 'Cleaning a river helps ___?', options: ['Only fish', 'Everyone and nature', 'Nobody', 'Only boats'], correct: 1, tip: 'Clean rivers benefit people, animals and the whole ecosystem.' },
    { question: 'We should plant ___ trees, not cut them.', options: ['Zero', 'More', 'Fewer', 'Plastic'], correct: 1, tip: 'Planting more trees helps keep our Earth green and clean.' },
    { question: 'Electric cars are better because they produce less ___?', options: ['Speed', 'Pollution', 'Noise only', 'Light'], correct: 1, tip: 'Electric cars don\'t burn fuel, so they produce less pollution.' },
    { question: 'Paper can be recycled ___ times.', options: ['1', '2-3', '5-7', '0'], correct: 2, tip: 'Paper can be recycled about 5 to 7 times!' },
    { question: 'Turning off the tap while brushing saves ___?', options: ['Electricity', 'Water', 'Paper', 'Soil'], correct: 1, tip: 'A running tap wastes litres of clean water.' },
    { question: 'Saying no to plastic straws helps ___?', options: ['Nobody', 'The environment', 'Only fish', 'Only birds'], correct: 1, tip: 'Plastic straws are one of the top ocean pollutants.' },
  ],

  /* ─── 10. Fun Science in Nature ─── */
  funscience: [
    { question: 'Gravity pulls things ___?', options: ['Up', 'Down', 'Sideways', 'In circles'], correct: 1, tip: 'Gravity pulls everything toward the center of the Earth.' },
    { question: 'Light travels in ___?', options: ['Curves', 'Circles', 'Straight lines', 'Zigzags'], correct: 2, tip: 'Light always travels in straight lines.' },
    { question: 'A magnet attracts ___?', options: ['Wood', 'Paper', 'Iron', 'Rubber'], correct: 2, tip: 'Magnets attract metals like iron, steel, and nickel.' },
    { question: 'Sound needs ___ to travel.', options: ['Light', 'A medium (air / water)', 'Gravity', 'Heat'], correct: 1, tip: 'Sound needs something (air, water, solid) to travel through.' },
    { question: 'Which is a source of light?', options: ['Moon', 'Sun', 'Earth', 'Mars'], correct: 1, tip: 'The Sun makes its own light. The Moon only reflects it.' },
    { question: 'A shadow forms when light is ___?', options: ['Turned off', 'Blocked by an object', 'Made brighter', 'Colored'], correct: 1, tip: 'When an object blocks light, it creates a dark shadow.' },
    { question: 'Which travels faster?', options: ['Sound', 'Light', 'Wind', 'Water'], correct: 1, tip: 'Light travels at 3,00,000 km/s — much faster than sound!' },
    { question: 'A compass needle points ___?', options: ['East', 'West', 'North', 'South'], correct: 2, tip: 'A magnetic compass needle points toward North.' },
    { question: 'A prism splits white light into ___?', options: ['2 colors', '5 colors', '7 colors', '10 colors'], correct: 2, tip: 'A prism splits white light into 7 rainbow colors.' },
    { question: 'Objects float in water if they are ___?', options: ['Heavy', 'Less dense than water', 'Shiny', 'Hard'], correct: 1, tip: 'Things lighter per size (less dense) than water will float.' },
    { question: 'Friction makes things ___?', options: ['Faster', 'Slower', 'Invisible', 'Lighter'], correct: 1, tip: 'Friction resists movement — it slows things down.' },
    { question: 'An echo is a ___ sound.', options: ['New', 'Reflected / bounced', 'Silent', 'Colored'], correct: 1, tip: 'An echo happens when sound bounces off a surface.' },
    { question: 'Batteries change ___ energy to electrical.', options: ['Light', 'Chemical', 'Sound', 'Wind'], correct: 1, tip: 'Batteries store chemical energy and release electricity.' },
    { question: 'A lever is a simple ___?', options: ['Motor', 'Machine', 'Battery', 'Computer'], correct: 1, tip: 'A see-saw is an example of a lever — a simple machine.' },
    { question: 'Pulling a door handle is a ___?', options: ['Push', 'Pull', 'Twist', 'Lift'], correct: 1, tip: 'Opening a door toward you is a pull force.' },
    { question: 'A pulley helps us ___?', options: ['Cook', 'Lift heavy things', 'Sleep', 'Swim'], correct: 1, tip: 'Pulleys make it easier to lift heavy objects.' },
    { question: 'Static electricity can make hair ___?', options: ['Fall off', 'Stand up', 'Change color', 'Grow'], correct: 1, tip: 'Static charge makes hair strands repel and stand up!' },
    { question: 'Force is a ___ or pull.', options: ['Sound', 'Push', 'Color', 'Light'], correct: 1, tip: 'A force is a push or pull that can change motion.' },
    { question: 'Which of these uses wheels?', options: ['Chair only', 'Bicycle', 'Book', 'Pen'], correct: 1, tip: 'A wheel is a simple machine used in vehicles like bicycles.' },
    { question: 'Ice floats because it is ___ than water.', options: ['Heavier', 'Lighter', 'Same weight', 'Harder'], correct: 1, tip: 'Ice is less dense than liquid water, so it floats.' },
    { question: 'A thermometer measures ___?', options: ['Weight', 'Temperature', 'Distance', 'Speed'], correct: 1, tip: 'Thermometers tell us how hot or cold something is.' },
    { question: 'Magnets have ___ poles.', options: ['1', '2', '3', '4'], correct: 1, tip: 'Every magnet has 2 poles — North and South.' },
    { question: 'Same poles of magnets ___?', options: ['Attract', 'Repel (push away)', 'Stick together', 'Do nothing'], correct: 1, tip: 'Like poles push each other away (repel).' },
    { question: 'Opposite poles of magnets ___?', options: ['Repel', 'Attract (pull together)', 'Ignore', 'Break'], correct: 1, tip: 'Opposite poles attract — North pulls South.' },
    { question: 'A ramp is a ___?', options: ['Toy', 'Simple machine', 'Food', 'Animal'], correct: 1, tip: 'A ramp (inclined plane) makes it easier to move things up.' },
    { question: 'Sound is ___ in a big empty room.', options: ['Silent', 'Louder (echoes)', 'Softer', 'Same'], correct: 1, tip: 'Sound bounces off walls in empty rooms, making echoes.' },
    { question: 'A lens can ___ light.', options: ['Stop', 'Bend', 'Color', 'Freeze'], correct: 1, tip: 'Lenses bend light rays — that\'s how glasses and magnifiers work.' },
    { question: 'Which material conducts electricity?', options: ['Plastic', 'Wood', 'Metal', 'Rubber'], correct: 2, tip: 'Metals like copper and iron conduct electricity well.' },
    { question: 'A mirror ___?', options: ['Absorbs light', 'Reflects light', 'Makes light', 'Eats light'], correct: 1, tip: 'Mirrors bounce (reflect) light, letting us see our reflection.' },
    { question: 'What makes a ball fall to the ground?', options: ['Wind', 'Air', 'Gravity', 'Sound'], correct: 2, tip: 'Gravity pulls everything toward the ground.' },
  ],
};

export { Q as ECO_QUESTION_POOLS };

/* ── Math Question Generator ───────────────────── */

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleOptions(correct: number, wrongs: number[]): { options: string[]; correctIdx: number } {
  const all = [correct, ...wrongs].map(String);
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return { options: all, correctIdx: all.indexOf(String(correct)) };
}

function generateMathQuestion(): EcoQuestion {
  const type = randInt(0, 4);
  if (type === 0) {
    const a = randInt(10, 50), b = randInt(10, 50), ans = a + b;
    const { options, correctIdx } = shuffleOptions(ans, [ans + randInt(1, 5), ans - randInt(1, 5), ans + randInt(6, 12)]);
    return { question: `What is ${a} + ${b}?`, options, correct: correctIdx, tip: `${a} + ${b} = ${ans}` };
  }
  if (type === 1) {
    const a = randInt(30, 99), b = randInt(5, a - 1), ans = a - b;
    const { options, correctIdx } = shuffleOptions(ans, [ans + randInt(1, 5), ans - randInt(1, 5), ans + randInt(6, 10)]);
    return { question: `What is ${a} − ${b}?`, options, correct: correctIdx, tip: `${a} − ${b} = ${ans}` };
  }
  if (type === 2) {
    const a = randInt(2, 9), b = randInt(2, 9), ans = a * b;
    const { options, correctIdx } = shuffleOptions(ans, [ans + a, ans - a, ans + randInt(1, 5)]);
    return { question: `What is ${a} × ${b}?`, options, correct: correctIdx, tip: `${a} × ${b} = ${ans}` };
  }
  if (type === 3) {
    const start = randInt(2, 10), step = randInt(2, 5);
    const seq = [start, start + step, start + 2 * step, start + 3 * step];
    const ans = start + 4 * step;
    const { options, correctIdx } = shuffleOptions(ans, [ans + step, ans - step, ans + 1]);
    return { question: `What comes next: ${seq.join(', ')}, ?`, options, correct: correctIdx, tip: `Pattern: +${step}. Next is ${ans}.` };
  }
  const a = randInt(20, 99), b = randInt(20, 99);
  const opts = [String(a), String(b), 'They are equal', 'Cannot tell'];
  if (a > b) return { question: `Which is greater: ${a} or ${b}?`, options: opts, correct: 0, tip: `${a} > ${b}` };
  if (b > a) return { question: `Which is greater: ${a} or ${b}?`, options: opts, correct: 1, tip: `${b} > ${a}` };
  return { question: `Which is greater: ${a} or ${b}?`, options: opts, correct: 2, tip: `${a} = ${b}. They are equal!` };
}

/* ── Constants ──────────────────────────────────── */

export const LEVELS_PER_TOPIC = 40;
export const QUESTIONS_PER_LEVEL = 5;
/** Content vs math ratio: 4 content + 1 math */
const CONTENT_PER_LEVEL = 4;

/* ── Level Generator ───────────────────────────── */

export function generateEcoLevel(topicId: string, levelNum: number): EcoQuestion[] {
  const pool = Q[topicId] || Q.sun;
  const questions: EcoQuestion[] = [];
  const offset = ((levelNum - 1) * CONTENT_PER_LEVEL) % pool.length;

  for (let i = 0; i < CONTENT_PER_LEVEL; i++) {
    questions.push(pool[(offset + i) % pool.length]);
  }
  questions.push(generateMathQuestion());

  // Shuffle
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }
  return questions;
}

/* ── Star Rating ───────────────────────────────── */

/** 5/5 → 3★, 4/5 → 2★, 3/5 → 1★, <3 → 0★ (fail) */
export function getStarRating(score: number, total: number): number {
  if (score >= total) return 3;
  if (score >= total - 1) return 2;
  if (score >= total - 2) return 1;
  return 0;
}

export function isLevelPassed(score: number, total: number): boolean {
  return getStarRating(score, total) >= 1;
}

/* ── Progress System ───────────────────────────── */

export interface EcoLevelResult {
  stars: number;
  score: number;
  total: number;
}

export interface EcoTopicProgress {
  highestLevel: number;           // highest completed level (0 = none)
  levels: Record<number, EcoLevelResult>;
}

export interface EcoDailyProgress {
  levelsToday: number;
  lastBatchTimestamp: number;
  totalCompleted: number;
  topicProgress: Record<string, EcoTopicProgress>;
}

const ECO_DAILY_KEY = 'eco_system_daily_v1';
const MAX_DAILY = 10;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

function emptyTopicProgress(): EcoTopicProgress {
  return { highestLevel: 0, levels: {} };
}

export function loadEcoProgress(): EcoDailyProgress {
  try {
    const raw = localStorage.getItem(ECO_DAILY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.topicProgress) parsed.topicProgress = {};
      return parsed;
    }
  } catch { /* ignore */ }
  return { levelsToday: 0, lastBatchTimestamp: 0, totalCompleted: 0, topicProgress: {} };
}

export function saveEcoProgress(p: EcoDailyProgress) {
  try { localStorage.setItem(ECO_DAILY_KEY, JSON.stringify(p)); }
  catch { /* quota */ }
}

export interface EcoDailyStatus {
  canPlay: boolean;
  remaining: number;
  unlockTime: number | null;
}

export function getEcoDailyStatus(p: EcoDailyProgress): EcoDailyStatus {
  const now = Date.now();

  if (p.levelsToday < MAX_DAILY && p.lastBatchTimestamp === 0) {
    return { canPlay: true, remaining: MAX_DAILY - p.levelsToday, unlockTime: null };
  }

  if (p.lastBatchTimestamp > 0) {
    const unlockAt = p.lastBatchTimestamp + COOLDOWN_MS;
    if (now >= unlockAt) {
      return { canPlay: true, remaining: MAX_DAILY, unlockTime: null };
    }
    if (p.levelsToday >= MAX_DAILY) {
      return { canPlay: false, remaining: 0, unlockTime: unlockAt };
    }
  }

  return { canPlay: true, remaining: MAX_DAILY - p.levelsToday, unlockTime: null };
}

export function getEcoTopicProgress(p: EcoDailyProgress, topicId: string): EcoTopicProgress {
  return p.topicProgress?.[topicId] || emptyTopicProgress();
}

export function getEcoCurrentLevel(p: EcoDailyProgress, topicId: string): number {
  const tp = getEcoTopicProgress(p, topicId);
  return Math.min(tp.highestLevel + 1, LEVELS_PER_TOPIC);
}

export function recordEcoLevelComplete(
  p: EcoDailyProgress,
  topicId: string,
  levelNum: number,
  score: number,
  total: number = QUESTIONS_PER_LEVEL,
): EcoDailyProgress {
  const now = Date.now();
  const status = getEcoDailyStatus(p);

  let levelsToday = p.levelsToday;
  let batchTs = p.lastBatchTimestamp;

  // Reset if cooldown passed
  if (status.canPlay && p.levelsToday >= MAX_DAILY && p.lastBatchTimestamp > 0) {
    levelsToday = 0;
    batchTs = 0;
  }

  levelsToday += 1;
  if (levelsToday >= MAX_DAILY) batchTs = now;

  // Update topic progress
  const tp = { ...(p.topicProgress || {}) };
  if (!tp[topicId]) tp[topicId] = emptyTopicProgress();
  else tp[topicId] = { ...tp[topicId] };

  const prog = { ...tp[topicId] };
  const stars = getStarRating(score, total);
  const passed = stars >= 1;

  if (passed) {
    prog.highestLevel = Math.max(prog.highestLevel, levelNum);
  }

  prog.levels = {
    ...prog.levels,
    [levelNum]: {
      stars: Math.max(prog.levels[levelNum]?.stars ?? 0, stars),
      score,
      total,
    },
  };
  tp[topicId] = prog;

  return {
    levelsToday,
    lastBatchTimestamp: batchTs,
    totalCompleted: p.totalCompleted + (passed ? 1 : 0),
    topicProgress: tp,
  };
}
