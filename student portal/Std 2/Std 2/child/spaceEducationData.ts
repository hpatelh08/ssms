/**
 * child/spaceEducationData.ts
 * ─────────────────────────────────────────────────────
 * Space & Earth Education — Question bank for Std 3
 *
 * 10 themed worlds with 20+ questions each.
 * Math question generators for infinite content.
 * Daily limit system (10 levels/day, 24h cooldown).
 * Each level = 5 sub-levels (questions).
 */

/* ── Types ──────────────────────────────────────── */

export interface EduQuestion {
  question: string;
  options: string[];
  correct: number;   // index in options
  tip: string;       // short explanation shown after answer
}

export interface EduWorld {
  id: string;
  name: string;
  icon: string;
  color: string;
  glowColor: string;
  description: string;
}

/* ── 10 Themed Worlds ──────────────────────────── */

export const WORLDS: EduWorld[] = [
  { id: 'solar',   name: 'Eco System',       icon: '☀️', color: '#fbbf24', glowColor: 'rgba(251,191,36,0.3)',  description: 'Explore our Sun, planets & moons' },
  { id: 'rockets', name: 'Space Travel',     icon: '🚀', color: '#3b82f6', glowColor: 'rgba(59,130,246,0.3)',  description: 'Rockets, astronauts & space stations' },
  { id: 'mystery', name: 'Space Mysteries',  icon: '🛸', color: '#a855f7', glowColor: 'rgba(168,85,247,0.3)',  description: 'Comets, asteroids, black holes & more' },
  { id: 'air',     name: 'Air & Sky',        icon: '🌬️', color: '#06b6d4', glowColor: 'rgba(6,182,212,0.3)',   description: 'Atmosphere, wind & the air we breathe' },
  { id: 'water',   name: 'Water World',      icon: '💧', color: '#0ea5e9', glowColor: 'rgba(14,165,233,0.3)',  description: 'Oceans, rain, water cycle & rivers' },
  { id: 'nature',  name: 'Green Earth',      icon: '🌱', color: '#22c55e', glowColor: 'rgba(34,197,94,0.3)',   description: 'Plants, trees, forests & oxygen' },
  { id: 'animals', name: 'Animal Planet',    icon: '🐾', color: '#f97316', glowColor: 'rgba(249,115,22,0.3)',  description: 'Animals, habitats & food chains' },
  { id: 'protect', name: 'Save Our Earth',   icon: '♻️', color: '#10b981', glowColor: 'rgba(16,185,129,0.3)',  description: 'Pollution, plastic, recycling & clean Earth' },
  { id: 'weather', name: 'Weather & Seasons',icon: '🌤️', color: '#eab308', glowColor: 'rgba(234,179,8,0.3)',   description: 'Clouds, rain, storms & seasons' },
  { id: 'science', name: 'Fun Science',      icon: '🔬', color: '#8b5cf6', glowColor: 'rgba(139,92,246,0.3)',  description: 'Gravity, light, magnets & simple machines' },
];

/* ── Question Pools (20+ per world) ────────────── */

const Q: Record<string, EduQuestion[]> = {
  solar: [
    { question: 'How many planets are in our solar system?', options: ['7', '8', '9', '10'], correct: 1, tip: 'There are 8 planets in our solar system.' },
    { question: 'Which planet is closest to the Sun?', options: ['Venus', 'Earth', 'Mercury', 'Mars'], correct: 2, tip: 'Mercury is the closest planet to the Sun.' },
    { question: 'Which is the largest planet?', options: ['Saturn', 'Jupiter', 'Neptune', 'Uranus'], correct: 1, tip: 'Jupiter is the biggest planet!' },
    { question: 'The Sun is a ___?', options: ['Planet', 'Moon', 'Star', 'Comet'], correct: 2, tip: 'The Sun is a star — a giant ball of hot gas.' },
    { question: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Mercury'], correct: 1, tip: 'Mars looks red because of iron in its soil.' },
    { question: 'Which planet has beautiful rings?', options: ['Jupiter', 'Mars', 'Saturn', 'Earth'], correct: 2, tip: 'Saturn has beautiful rings made of ice and rock.' },
    { question: 'Earth is the ___ planet from the Sun.', options: ['1st', '2nd', '3rd', '4th'], correct: 2, tip: 'Earth is the third planet from the Sun.' },
    { question: 'Which planet is called the Blue Planet?', options: ['Neptune', 'Earth', 'Uranus', 'Venus'], correct: 1, tip: 'Earth is called the Blue Planet because of water.' },
    { question: 'How long does Earth take to orbit the Sun?', options: ['1 day', '1 month', '1 year', '1 week'], correct: 2, tip: 'Earth takes 365 days (1 year) to go around the Sun.' },
    { question: 'Which planet spins on its side?', options: ['Mars', 'Neptune', 'Uranus', 'Saturn'], correct: 2, tip: 'Uranus spins on its side like a rolling ball!' },
    { question: 'The Moon goes around the ___?', options: ['Sun', 'Mars', 'Earth', 'Jupiter'], correct: 2, tip: 'The Moon orbits around the Earth.' },
    { question: 'Which planet is the hottest?', options: ['Mercury', 'Venus', 'Mars', 'Jupiter'], correct: 1, tip: 'Venus is the hottest because of thick clouds trapping heat.' },
    { question: 'What gives us day and night?', options: ['Moon rotating', 'Earth rotating', 'Sun moving', 'Stars shining'], correct: 1, tip: 'Earth spinning on its axis gives us day and night.' },
    { question: 'Which planet has the Great Red Spot?', options: ['Mars', 'Saturn', 'Jupiter', 'Neptune'], correct: 2, tip: 'Jupiter has a giant storm called the Great Red Spot.' },
    { question: 'Neptune is which color?', options: ['Red', 'Green', 'Blue', 'Yellow'], correct: 2, tip: 'Neptune appears blue because of methane gas.' },
    { question: 'How many moons does Earth have?', options: ['0', '1', '2', '3'], correct: 1, tip: 'Earth has just one Moon.' },
    { question: 'Which planet is farthest from the Sun?', options: ['Uranus', 'Saturn', 'Neptune', 'Pluto'], correct: 2, tip: 'Neptune is the farthest planet from the Sun.' },
    { question: 'The Sun rises in the ___?', options: ['West', 'North', 'East', 'South'], correct: 2, tip: 'The Sun rises in the East and sets in the West.' },
    { question: 'Sunlight takes ___ minutes to reach Earth.', options: ['1', '8', '30', '60'], correct: 1, tip: 'Light from the Sun takes about 8 minutes to reach us.' },
    { question: 'Which is the smallest planet?', options: ['Mars', 'Mercury', 'Venus', 'Earth'], correct: 1, tip: 'Mercury is the smallest planet in our solar system.' },
  ],

  rockets: [
    { question: 'Who was the first person in space?', options: ['Neil Armstrong', 'Yuri Gagarin', 'Kalpana Chawla', 'Buzz Aldrin'], correct: 1, tip: 'Yuri Gagarin from Russia was the first person in space in 1961.' },
    { question: 'What is the name of India\'s space agency?', options: ['NASA', 'ISRO', 'ESA', 'JAXA'], correct: 1, tip: 'ISRO — Indian Space Research Organisation.' },
    { question: 'Rockets need ___ to fly in space.', options: ['Wings', 'Fuel', 'Wind', 'Wheels'], correct: 1, tip: 'Rockets burn fuel to push themselves forward.' },
    { question: 'The first man on the Moon was ___?', options: ['Yuri Gagarin', 'Buzz Aldrin', 'Neil Armstrong', 'Sunita Williams'], correct: 2, tip: 'Neil Armstrong walked on the Moon in 1969.' },
    { question: 'What do astronauts wear in space?', options: ['Raincoat', 'Spacesuit', 'Uniform', 'Jacket'], correct: 1, tip: 'Spacesuits protect astronauts from extreme heat and cold.' },
    { question: 'ISS stands for International Space ___?', options: ['Ship', 'Station', 'Satellite', 'System'], correct: 1, tip: 'ISS = International Space Station, where astronauts live.' },
    { question: 'Can astronauts float in space?', options: ['Yes', 'No', 'Only on Moon', 'Only at night'], correct: 0, tip: 'Yes! There is very little gravity in space, so they float.' },
    { question: 'India\'s Moon mission is called ___?', options: ['Mangalyaan', 'Chandrayaan', 'Aditya', 'Gaganyaan'], correct: 1, tip: 'Chandrayaan means "Moon vehicle" in Sanskrit.' },
    { question: 'Satellites help us with ___?', options: ['Cooking', 'TV & GPS', 'Swimming', 'Painting'], correct: 1, tip: 'Satellites give us TV, internet, GPS and weather info.' },
    { question: 'What fuel do rockets mostly use?', options: ['Petrol', 'Diesel', 'Hydrogen', 'CNG'], correct: 2, tip: 'Many rockets use liquid hydrogen as fuel.' },
    { question: 'How many people can the ISS hold?', options: ['2', '6', '20', '100'], correct: 1, tip: 'The ISS usually has about 6 astronauts at a time.' },
    { question: 'India\'s Mars mission is called ___?', options: ['Chandrayaan', 'Mangalyaan', 'Aditya', 'PSLV'], correct: 1, tip: 'Mangalyaan was India\'s successful Mars mission in 2014.' },
    { question: 'In space, sound ___?', options: ['Is very loud', 'Cannot travel', 'Echoes', 'Is soft'], correct: 1, tip: 'Sound needs air to travel. Space has no air, so no sound!' },
    { question: 'A telescope helps us see ___?', options: ['Underground', 'Far away stars', 'Inside body', 'Under water'], correct: 1, tip: 'Telescopes make faraway objects look closer.' },
    { question: 'Who was the first Indian woman in space?', options: ['Sunita Williams', 'Kalpana Chawla', 'Indira Gandhi', 'Sarojini Naidu'], correct: 1, tip: 'Kalpana Chawla went to space in 1997.' },
    { question: 'What shape is a satellite dish?', options: ['Square', 'Round/curved', 'Triangle', 'Star'], correct: 1, tip: 'Satellite dishes are curved to focus signals.' },
    { question: 'Astronauts eat food from ___?', options: ['Plates', 'Packets/tubes', 'Bowls', 'Cups'], correct: 1, tip: 'Food floats in space, so it comes in sealed packets!' },
    { question: 'What is Gaganyaan?', options: ['A car', 'India\'s human spaceflight', 'A satellite', 'A planet'], correct: 1, tip: 'Gaganyaan is ISRO\'s mission to send Indians to space.' },
    { question: 'Space starts at about ___ km above Earth.', options: ['10', '100', '1000', '10000'], correct: 1, tip: 'Space begins about 100 km above Earth\'s surface.' },
    { question: 'Rockets launch from a ___?', options: ['Airport', 'Launchpad', 'Hospital', 'School'], correct: 1, tip: 'Rockets are launched from special launchpads.' },
  ],

  mystery: [
    { question: 'A comet is made of ___?', options: ['Rock & gold', 'Ice & dust', 'Water & air', 'Fire & gas'], correct: 1, tip: 'Comets are "dirty snowballs" of ice, dust and rock.' },
    { question: 'Asteroids are found mostly between ___?', options: ['Earth & Moon', 'Mars & Jupiter', 'Sun & Mercury', 'Saturn & Neptune'], correct: 1, tip: 'The asteroid belt is between Mars and Jupiter.' },
    { question: 'A shooting star is actually a ___?', options: ['Star falling', 'Meteor burning', 'Rocket', 'Satellite'], correct: 1, tip: 'Shooting stars are tiny space rocks burning in our atmosphere.' },
    { question: 'What is a black hole?', options: ['A hole on Earth', 'A region with super strong gravity', 'A dark room', 'A cave'], correct: 1, tip: 'A black hole pulls in everything, even light!' },
    { question: 'Our galaxy is called the ___?', options: ['Andromeda', 'Milky Way', 'Solar Way', 'Star Way'], correct: 1, tip: 'We live in the Milky Way galaxy.' },
    { question: 'How many stars can you see at night?', options: ['100', '500', 'About 3000', 'Only 10'], correct: 2, tip: 'On a clear night, you can see about 3000 stars!' },
    { question: 'A constellation is a group of ___?', options: ['Planets', 'Stars', 'Moons', 'Comets'], correct: 1, tip: 'Constellations are patterns of stars in the sky.' },
    { question: 'The dwarf planet Pluto is very ___?', options: ['Hot', 'Big', 'Cold', 'Close to Sun'], correct: 2, tip: 'Pluto is extremely cold — about -230°C!' },
    { question: 'What makes a comet\'s tail?', options: ['Wind', 'Sun\'s heat melts ice', 'Rain', 'Magic'], correct: 1, tip: 'The Sun heats the comet, creating a glowing tail.' },
    { question: 'Are there other solar systems?', options: ['No, only ours', 'Yes, billions!', 'Only 2', 'Nobody knows'], correct: 1, tip: 'There are billions of other solar systems in our galaxy!' },
    { question: 'The Big Dipper is a ___?', options: ['Planet', 'Constellation', 'Galaxy', 'Star'], correct: 1, tip: 'The Big Dipper is a famous group of 7 stars.' },
    { question: 'A light-year measures ___?', options: ['Time', 'Weight', 'Distance', 'Speed'], correct: 2, tip: 'A light-year is the distance light travels in one year.' },
    { question: 'The closest star to Earth (after Sun) is ___?', options: ['Sirius', 'Proxima Centauri', 'Polaris', 'Vega'], correct: 1, tip: 'Proxima Centauri is about 4.2 light-years away.' },
    { question: 'Meteorites are space rocks that ___?', options: ['Stay in space', 'Land on Earth', 'Become stars', 'Turn into water'], correct: 1, tip: 'When meteors survive and hit Earth, they\'re called meteorites.' },
    { question: 'UFO stands for ___?', options: ['Ultra Fast Object', 'Unidentified Flying Object', 'Under Flight Operation', 'United Flight Office'], correct: 1, tip: 'UFO = Unidentified Flying Object — something unknown in the sky!' },
    { question: 'Stars twinkle because of Earth\'s ___?', options: ['Rotation', 'Atmosphere', 'Gravity', 'Water'], correct: 1, tip: 'Stars twinkle because light bends through our atmosphere.' },
    { question: 'A galaxy contains ___?', options: ['Only planets', 'Billions of stars', 'Only moons', 'Only comets'], correct: 1, tip: 'Galaxies contain billions of stars, planets, and dust.' },
    { question: 'Halley\'s Comet appears every ___?', options: ['10 years', '25 years', '76 years', '100 years'], correct: 2, tip: 'Halley\'s Comet visits us every 76 years!' },
    { question: 'What is the North Star called?', options: ['Sirius', 'Polaris', 'Vega', 'Sun'], correct: 1, tip: 'Polaris (the North Star) helps find direction at night.' },
    { question: 'Space is mostly ___?', options: ['Full of air', 'Empty (vacuum)', 'Full of water', 'Full of fire'], correct: 1, tip: 'Space is almost completely empty — a vacuum.' },
  ],

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
    { question: 'We feel wind on our ___?', options: ['Eyes only', 'Skin', 'Hair only', 'Teeth'], correct: 1, tip: 'We feel wind blowing on our skin, hair and face.' },
    { question: 'Air has ___?', options: ['Weight', 'No weight', 'Color', 'Taste'], correct: 0, tip: 'Air has weight! A room full of air weighs about 50 kg.' },
    { question: 'Deep breathing is good for ___?', options: ['Teeth', 'Health', 'Hair', 'Nails'], correct: 1, tip: 'Deep breathing brings more oxygen to our body.' },
    { question: 'Where is air the thinnest?', options: ['At sea', 'In forests', 'On mountains', 'In caves'], correct: 2, tip: 'Air gets thinner as we go higher up mountains.' },
    { question: 'Windmills use ___ to make electricity?', options: ['Water', 'Sun', 'Wind', 'Coal'], correct: 2, tip: 'Windmills capture wind energy to generate electricity.' },
    { question: 'Smog is a mix of ___?', options: ['Smoke & fog', 'Sun & rain', 'Cloud & snow', 'Wind & dust'], correct: 0, tip: 'Smog = smoke + fog. It makes air unhealthy.' },
    { question: 'Flying a kite needs ___?', options: ['Rain', 'Wind', 'Snow', 'Darkness'], correct: 1, tip: 'Wind lifts and pushes the kite up into the sky.' },
    { question: 'The ozone layer protects us from ___?', options: ['Rain', 'Wind', 'Harmful UV rays', 'Cold'], correct: 2, tip: 'The ozone layer blocks dangerous ultraviolet rays from the Sun.' },
    { question: 'Yawning means your body wants more ___?', options: ['Food', 'Water', 'Oxygen', 'Sleep only'], correct: 2, tip: 'When we yawn, our body takes in a big gulp of oxygen.' },
  ],

  water: [
    { question: 'How much of Earth is covered by water?', options: ['25%', '50%', '70%', '90%'], correct: 2, tip: 'About 70% of Earth\'s surface is water!' },
    { question: 'The water cycle starts with ___?', options: ['Rain', 'Evaporation', 'Snow', 'Rivers'], correct: 1, tip: 'The Sun heats water, making it evaporate into the sky.' },
    { question: 'Clouds are made of tiny ___?', options: ['Stones', 'Water droplets', 'Stars', 'Sand'], correct: 1, tip: 'Clouds are made of millions of tiny water droplets.' },
    { question: 'Rain comes from ___?', options: ['Space', 'Clouds', 'Mountains', 'Trees'], correct: 1, tip: 'When cloud droplets get heavy, they fall as rain.' },
    { question: 'Which is the largest ocean?', options: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], correct: 2, tip: 'The Pacific Ocean is the largest and deepest ocean.' },
    { question: 'Is ocean water drinkable?', options: ['Yes', 'No, it\'s salty', 'Only when cold', 'Only when hot'], correct: 1, tip: 'Ocean water is too salty to drink.' },
    { question: 'Ice is water in ___ form?', options: ['Liquid', 'Gas', 'Solid', 'Plasma'], correct: 2, tip: 'When water freezes, it becomes solid ice.' },
    { question: 'Steam is water in ___ form?', options: ['Solid', 'Liquid', 'Gas', 'Crystal'], correct: 2, tip: 'When water boils, it turns into steam (gas).' },
    { question: 'We should ___ water.', options: ['Waste', 'Save', 'Color', 'Freeze only'], correct: 1, tip: 'Clean water is precious — we must save every drop!' },
    { question: 'Rivers flow into the ___?', options: ['Sky', 'Mountains', 'Sea/Ocean', 'Desert'], correct: 2, tip: 'Most rivers flow downhill and end up in the sea.' },
    { question: 'What is groundwater?', options: ['Water on ground', 'Water under the ground', 'Rain water', 'Sea water'], correct: 1, tip: 'Groundwater is water stored underground in rocks and soil.' },
    { question: 'A glacier is a huge mass of ___?', options: ['Sand', 'Ice', 'Rock', 'Mud'], correct: 1, tip: 'Glaciers are giant rivers of ice found on mountains.' },
    { question: 'Water boils at ___ °C?', options: ['0', '50', '100', '200'], correct: 2, tip: 'Water boils at 100°C and freezes at 0°C.' },
    { question: 'Water freezes at ___ °C?', options: ['0', '10', '50', '100'], correct: 0, tip: 'Water turns to ice at 0°C (32°F).' },
    { question: 'Which animal lives in both water and land?', options: ['Fish', 'Frog', 'Whale', 'Eagle'], correct: 1, tip: 'Frogs are amphibians — they live on land and in water.' },
    { question: 'Drinking dirty water can cause ___?', options: ['Strength', 'Diseases', 'Happiness', 'Growth'], correct: 1, tip: 'Dirty water has germs that make us sick.' },
    { question: 'What makes a rainbow appear?', options: ['Wind', 'Sunlight through rain', 'Moon', 'Stars'], correct: 1, tip: 'Sunlight splits into 7 colors when it passes through raindrops.' },
    { question: 'Wells bring up ___?', options: ['Air', 'Oil', 'Underground water', 'Mud'], correct: 2, tip: 'Wells are dug to bring up groundwater for drinking.' },
    { question: 'The biggest river in India is ___?', options: ['Yamuna', 'Ganga', 'Godavari', 'Narmada'], correct: 1, tip: 'The Ganga is the most important river in India.' },
    { question: 'Condensation means gas turns to ___?', options: ['Solid', 'Liquid', 'Gas', 'Plasma'], correct: 1, tip: 'When steam cools, it condenses back into water droplets.' },
  ],

  nature: [
    { question: 'Trees give us ___?', options: ['Carbon dioxide', 'Oxygen', 'Nitrogen', 'Smoke'], correct: 1, tip: 'Trees breathe out oxygen that we need to survive.' },
    { question: 'Photosynthesis means plants make ___?', options: ['Water', 'Air', 'Their own food', 'Soil'], correct: 2, tip: 'Plants use sunlight + CO2 + water to make food.' },
    { question: 'Plants need ___ to grow.', options: ['Darkness only', 'Sunlight, water & soil', 'Only water', 'Only air'], correct: 1, tip: 'Plants need sunlight, water, air, and soil nutrients.' },
    { question: 'The green color in leaves comes from ___?', options: ['Paint', 'Chlorophyll', 'Water', 'Soil'], correct: 1, tip: 'Chlorophyll gives leaves their green color.' },
    { question: 'Seeds grow into ___?', options: ['Rocks', 'New plants', 'Animals', 'Water'], correct: 1, tip: 'Seeds contain a baby plant inside them!' },
    { question: 'Roots of a plant absorb ___?', options: ['Sunlight', 'Water from soil', 'Air only', 'Insects'], correct: 1, tip: 'Roots soak up water and nutrients from the soil.' },
    { question: 'The largest living tree type is ___?', options: ['Mango', 'Sequoia/Redwood', 'Neem', 'Banyan'], correct: 1, tip: 'Giant Sequoias can grow over 80 meters tall!' },
    { question: 'Forests are called the ___ of Earth.', options: ['Eyes', 'Lungs', 'Heart', 'Brain'], correct: 1, tip: 'Forests produce oxygen — like Earth\'s lungs.' },
    { question: 'Bees help plants by ___?', options: ['Eating leaves', 'Pollination', 'Cutting stems', 'Making shade'], correct: 1, tip: 'Bees carry pollen between flowers, helping plants grow fruit.' },
    { question: 'A cactus stores water in its ___?', options: ['Leaves', 'Roots', 'Stem', 'Flowers'], correct: 2, tip: 'Cacti store water in their thick stems for dry times.' },
    { question: 'How many types of plants exist?', options: ['1000', '10,000', 'Over 3,00,000', '500'], correct: 2, tip: 'There are over 3 lakh (300,000+) species of plants!' },
    { question: 'Planting trees helps reduce ___?', options: ['Oxygen', 'Pollution', 'Rain', 'Sunshine'], correct: 1, tip: 'Trees absorb CO2 and clean the air.' },
    { question: 'Mushrooms are a type of ___?', options: ['Plant', 'Animal', 'Fungus', 'Bacteria'], correct: 2, tip: 'Mushrooms are fungi, not plants!' },
    { question: 'Sunflowers face the ___?', options: ['Moon', 'Ground', 'Sun', 'Stars'], correct: 2, tip: 'Sunflowers turn to face the Sun as it moves across the sky.' },
    { question: 'Which gas do plants release at night?', options: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Helium'], correct: 1, tip: 'At night, plants release small amounts of carbon dioxide.' },
    { question: 'Fruits contain ___ for new plants.', options: ['Leaves', 'Seeds', 'Roots', 'Bark'], correct: 1, tip: 'Seeds inside fruits can grow into new plants.' },
    { question: 'The Amazon is the world\'s largest ___?', options: ['Desert', 'Ocean', 'Rainforest', 'Mountain'], correct: 2, tip: 'The Amazon Rainforest produces 20% of Earth\'s oxygen.' },
    { question: 'Venus Flytrap is a plant that eats ___?', options: ['Soil', 'Sunlight', 'Insects', 'Water'], correct: 2, tip: 'Venus Flytraps snap shut to catch and digest insects!' },
    { question: 'Leaves change color in ___?', options: ['Summer', 'Autumn/Fall', 'Spring', 'Monsoon'], correct: 1, tip: 'In autumn, leaves turn red, orange, and yellow before falling.' },
    { question: 'Plants release oxygen through tiny holes called ___?', options: ['Pores', 'Stomata', 'Eyes', 'Cracks'], correct: 1, tip: 'Stomata are tiny openings on leaves for gas exchange.' },
  ],

  animals: [
    { question: 'The fastest land animal is ___?', options: ['Lion', 'Cheetah', 'Horse', 'Tiger'], correct: 1, tip: 'Cheetahs can run up to 120 km/h!' },
    { question: 'Which animal is the largest on Earth?', options: ['Elephant', 'Giraffe', 'Blue Whale', 'Dinosaur'], correct: 2, tip: 'The Blue Whale is the largest animal ever — up to 30 meters!' },
    { question: 'A group of lions is called a ___?', options: ['Pack', 'Herd', 'Pride', 'Flock'], correct: 2, tip: 'A group of lions is called a pride.' },
    { question: 'Which bird cannot fly?', options: ['Eagle', 'Sparrow', 'Ostrich', 'Parrot'], correct: 2, tip: 'Ostriches are too heavy to fly, but they run very fast!' },
    { question: 'Dolphins breathe with ___?', options: ['Gills', 'Lungs', 'Skin', 'Fins'], correct: 1, tip: 'Dolphins are mammals — they breathe air through lungs.' },
    { question: 'Where do polar bears live?', options: ['Desert', 'Forest', 'Arctic (cold)', 'Ocean'], correct: 2, tip: 'Polar bears live in the freezing Arctic region.' },
    { question: 'A caterpillar becomes a ___?', options: ['Ant', 'Butterfly', 'Spider', 'Bee'], correct: 1, tip: 'Caterpillars transform into butterflies — it\'s called metamorphosis!' },
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
    { question: 'Penguins live in ___?', options: ['Desert', 'Forest', 'Cold regions (Antarctica)', 'Mountains'], correct: 2, tip: 'Most penguins live in Antarctica — the coldest place on Earth.' },
  ],

  protect: [
    { question: 'Plastic takes ___ years to decompose.', options: ['1', '10', '100-500', '5'], correct: 2, tip: 'Plastic can take 100 to 500 years to break down!' },
    { question: 'The 3 Rs of waste are ___?', options: ['Run, Read, Rest', 'Reduce, Reuse, Recycle', 'Rain, River, Rock', 'Red, Rose, Ruby'], correct: 1, tip: 'Reduce, Reuse, Recycle — the 3 Rs help save our Earth.' },
    { question: 'Planting trees helps fight ___?', options: ['Darkness', 'Climate change', 'Thunder', 'Stars'], correct: 1, tip: 'Trees absorb CO2, helping fight global warming.' },
    { question: 'Single-use plastic means ___?', options: ['Strong plastic', 'Used once then thrown', 'Reusable', 'Edible'], correct: 1, tip: 'Single-use plastics like straws are used once and pollute forever.' },
    { question: 'Which bag is better for Earth?', options: ['Plastic bag', 'Cloth/jute bag', 'Polythene bag', 'Foam bag'], correct: 1, tip: 'Cloth bags can be reused many times and don\'t pollute.' },
    { question: 'Turning off lights when leaving saves ___?', options: ['Water', 'Electricity', 'Food', 'Paper'], correct: 1, tip: 'Saving electricity helps reduce pollution from power plants.' },
    { question: 'Global warming means Earth is getting ___?', options: ['Colder', 'Hotter', 'Bigger', 'Smaller'], correct: 1, tip: 'Pollution traps heat, making Earth\'s temperature rise.' },
    { question: 'Which pollutes water?', options: ['Fish', 'Factory waste', 'Sunlight', 'Wind'], correct: 1, tip: 'Factories dumping chemicals pollute rivers and oceans.' },
    { question: 'We should use ___ bottles instead of plastic.', options: ['Glass', 'Paper', 'Steel/reusable', 'Foam'], correct: 2, tip: 'Reusable steel or glass bottles reduce plastic waste.' },
    { question: 'Endangered means an animal is ___?', options: ['Very common', 'At risk of dying out', 'Very fast', 'Very large'], correct: 1, tip: 'Endangered animals may become extinct if not protected.' },
    { question: 'Solar panels use ___ for energy.', options: ['Wind', 'Water', 'Sunlight', 'Coal'], correct: 2, tip: 'Solar panels convert sunlight into clean electricity.' },
    { question: 'Oil spills in the ocean harm ___?', options: ['Nothing', 'Sea life', 'Only rocks', 'Only sand'], correct: 1, tip: 'Oil spills kill fish, birds, and damage ocean ecosystems.' },
    { question: 'Composting turns waste into ___?', options: ['Water', 'Soil/fertilizer', 'Plastic', 'Metal'], correct: 1, tip: 'Composting turns food scraps into rich soil for plants.' },
    { question: 'Noise pollution comes from ___?', options: ['Flowers', 'Loud honking & machines', 'Trees', 'Rain'], correct: 1, tip: 'Too much noise from traffic and machines causes noise pollution.' },
    { question: 'Deforestation means ___?', options: ['Planting trees', 'Cutting down forests', 'Watering plants', 'Growing seeds'], correct: 1, tip: 'Cutting down forests destroys animal habitats and increases pollution.' },
    { question: 'Using both sides of paper helps save ___?', options: ['Water', 'Trees', 'Fuel', 'Electricity'], correct: 1, tip: 'Paper is made from trees — using less paper saves forests.' },
    { question: 'Walking or cycling instead of driving reduces ___?', options: ['Exercise', 'Air pollution', 'Sunlight', 'Noise'], correct: 1, tip: 'Walking and cycling produce zero pollution!' },
    { question: 'Earth Day is celebrated on ___?', options: ['Jan 1', 'April 22', 'Aug 15', 'Dec 25'], correct: 1, tip: 'Earth Day is April 22 — a day to celebrate and protect our planet.' },
    { question: 'Which is a renewable energy source?', options: ['Coal', 'Petrol', 'Wind', 'Diesel'], correct: 2, tip: 'Wind, solar, and water are renewable — they never run out.' },
    { question: 'Coral reefs are dying because of ___?', options: ['Too much fish', 'Warming oceans', 'Too much rain', 'Sunlight'], correct: 1, tip: 'Rising ocean temperatures bleach and kill coral reefs.' },
  ],

  weather: [
    { question: 'Rain comes from ___?', options: ['Space', 'Clouds', 'Underground', 'Mountains'], correct: 1, tip: 'Rain falls from clouds when water droplets become heavy.' },
    { question: 'How many seasons does India have?', options: ['2', '4', '6', '3'], correct: 2, tip: 'India has 6 seasons: Spring, Summer, Monsoon, Autumn, Pre-winter, Winter.' },
    { question: 'Thunder is caused by ___?', options: ['Wind', 'Lightning heating air', 'Clouds bumping', 'Rain'], correct: 1, tip: 'Lightning heats air so fast it creates a booming sound!' },
    { question: 'A thermometer measures ___?', options: ['Wind', 'Rain', 'Temperature', 'Sunlight'], correct: 2, tip: 'Thermometers show how hot or cold it is.' },
    { question: 'Which season has the most rain in India?', options: ['Winter', 'Summer', 'Monsoon', 'Spring'], correct: 2, tip: 'The monsoon season (June-September) brings the most rain.' },
    { question: 'Snow is frozen ___?', options: ['Air', 'Dust', 'Water', 'Sand'], correct: 2, tip: 'Snow is tiny ice crystals formed from water vapor in clouds.' },
    { question: 'A rainbow has ___ colors.', options: ['5', '6', '7', '8'], correct: 2, tip: 'VIBGYOR — Violet, Indigo, Blue, Green, Yellow, Orange, Red.' },
    { question: 'Fog is a cloud at ___?', options: ['High altitude', 'Ground level', 'In space', 'Underground'], correct: 1, tip: 'Fog is just a cloud that forms near the ground.' },
    { question: 'Wind speed is measured by a ___?', options: ['Thermometer', 'Barometer', 'Anemometer', 'Ruler'], correct: 2, tip: 'An anemometer spins in the wind to measure its speed.' },
    { question: 'Hailstones are balls of ___?', options: ['Rock', 'Sand', 'Ice', 'Crystal'], correct: 2, tip: 'Hailstones are lumps of ice that fall from storm clouds.' },
    { question: 'The hottest season in India is ___?', options: ['Winter', 'Monsoon', 'Summer', 'Autumn'], correct: 2, tip: 'Summer (April-June) is the hottest season in India.' },
    { question: 'A cyclone is a strong ___?', options: ['Earthquake', 'Windstorm', 'Flood', 'Drought'], correct: 1, tip: 'Cyclones are powerful rotating storms with strong winds.' },
    { question: 'Evaporation happens when ___?', options: ['Water cools', 'Water freezes', 'Sun heats water', 'Wind blows'], correct: 2, tip: 'The Sun\'s heat turns water into invisible water vapor.' },
    { question: 'In winter, days are ___?', options: ['Longer', 'Shorter', 'Same', 'Hotter'], correct: 1, tip: 'Winter days are shorter because the Sun sets earlier.' },
    { question: 'A drought means ___?', options: ['Too much rain', 'No rain for long', 'Heavy snow', 'Strong wind'], correct: 1, tip: 'Droughts happen when an area gets very little rain.' },
    { question: 'Dew drops form in the ___?', options: ['Afternoon', 'Evening', 'Early morning', 'Midnight'], correct: 2, tip: 'Cool morning air turns water vapor into tiny dew drops on grass.' },
    { question: 'Climate is the ___ weather pattern of a place.', options: ['Daily', 'Weekly', 'Long-term average', 'Monthly'], correct: 2, tip: 'Climate is the average weather over many years.' },
    { question: 'Clouds that bring rain are usually ___?', options: ['White & fluffy', 'Dark & heavy', 'Thin & wispy', 'Red'], correct: 1, tip: 'Dark cumulonimbus clouds are full of water and bring rain.' },
    { question: 'A weather forecast predicts ___?', options: ['Past weather', 'Future weather', 'Moon phases', 'Tides'], correct: 1, tip: 'Weather forecasts help us plan by predicting rain, sun, etc.' },
    { question: 'Which instrument measures rainfall?', options: ['Barometer', 'Rain gauge', 'Compass', 'Telescope'], correct: 1, tip: 'A rain gauge collects rain to measure how much falls.' },
  ],

  science: [
    { question: 'Gravity pulls things ___?', options: ['Up', 'Down', 'Sideways', 'In circles'], correct: 1, tip: 'Gravity pulls everything toward the center of the Earth.' },
    { question: 'Light travels in ___?', options: ['Curves', 'Circles', 'Straight lines', 'Zigzags'], correct: 2, tip: 'Light always travels in straight lines.' },
    { question: 'A magnet attracts ___?', options: ['Wood', 'Paper', 'Iron', 'Rubber'], correct: 2, tip: 'Magnets attract metals like iron, steel, and nickel.' },
    { question: 'Sound needs ___ to travel.', options: ['Light', 'A medium (air/water)', 'Gravity', 'Heat'], correct: 1, tip: 'Sound waves need something (air, water, solid) to travel through.' },
    { question: 'A lever is a simple ___?', options: ['Motor', 'Machine', 'Battery', 'Computer'], correct: 1, tip: 'A see-saw is an example of a lever — a simple machine.' },
    { question: 'Which is a source of light?', options: ['Moon', 'Sun', 'Earth', 'Mars'], correct: 1, tip: 'The Sun makes its own light. The Moon only reflects it.' },
    { question: 'Friction makes things ___?', options: ['Faster', 'Slower', 'Invisible', 'Lighter'], correct: 1, tip: 'Friction resists movement — it slows things down.' },
    { question: 'An echo is a ___ sound.', options: ['New', 'Reflected/bounced', 'Silent', 'Colored'], correct: 1, tip: 'An echo happens when sound bounces off a surface back to you.' },
    { question: 'Which of these uses wheels?', options: ['Chair only', 'Bicycle', 'Book', 'Pen'], correct: 1, tip: 'A wheel and axle is a simple machine used in vehicles.' },
    { question: 'A shadow forms when light is ___?', options: ['Turned off', 'Blocked by an object', 'Made brighter', 'Colored'], correct: 1, tip: 'When an object blocks light, it creates a dark shadow behind it.' },
    { question: 'Which travels faster?', options: ['Sound', 'Light', 'Wind', 'Water'], correct: 1, tip: 'Light travels at 3,00,000 km/s — much faster than sound!' },
    { question: 'Batteries convert ___ energy to electrical.', options: ['Light', 'Chemical', 'Sound', 'Wind'], correct: 1, tip: 'Batteries store chemical energy and convert it to electricity.' },
    { question: 'A compass needle always points ___?', options: ['East', 'West', 'North', 'South'], correct: 2, tip: 'A magnetic compass needle points toward Earth\'s North Pole.' },
    { question: 'Pulling a door handle is a ___?', options: ['Push', 'Pull', 'Twist', 'Lift'], correct: 1, tip: 'Opening a door toward you is a pull force.' },
    { question: 'A prism splits white light into ___?', options: ['2 colors', '5 colors', '7 colors', '10 colors'], correct: 2, tip: 'A prism splits white light into 7 rainbow colors.' },
    { question: 'Objects float in water if they are ___?', options: ['Heavy', 'Less dense than water', 'Shiny', 'Hard'], correct: 1, tip: 'Things less dense (lighter per size) than water will float.' },
    { question: 'A pulley helps us ___?', options: ['Cook', 'Lift heavy things', 'Sleep', 'Swim'], correct: 1, tip: 'Pulleys make it easier to lift heavy objects up.' },
    { question: 'Static electricity can make hair ___?', options: ['Fall off', 'Stand up', 'Change color', 'Grow'], correct: 1, tip: 'Static charge makes strands of hair repel each other and stand up!' },
    { question: 'A thermometer uses ___ to measure temperature.', options: ['Water', 'Mercury/digital sensor', 'Air', 'Sand'], correct: 1, tip: 'Mercury expands when heated, showing temperature on the scale.' },
    { question: 'Force is a ___ or pull.', options: ['Sound', 'Push', 'Color', 'Light'], correct: 1, tip: 'A force is a push or pull that can change motion.' },
  ],
};

export { Q as QUESTION_POOLS };

/* ── Math Question Generator ───────────────────── */

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleOptions(correct: number, wrongs: number[]): { options: string[]; correctIdx: number } {
  const all = [correct, ...wrongs].map(String);
  // Fisher-Yates shuffle
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return { options: all, correctIdx: all.indexOf(String(correct)) };
}

export function generateMathQuestion(): EduQuestion {
  const type = randInt(0, 4);

  if (type === 0) {
    // Addition
    const a = randInt(10, 50), b = randInt(10, 50);
    const ans = a + b;
    const { options, correctIdx } = shuffleOptions(ans, [ans + randInt(1, 5), ans - randInt(1, 5), ans + randInt(6, 12)]);
    return { question: `What is ${a} + ${b}?`, options, correct: correctIdx, tip: `${a} + ${b} = ${ans}` };
  }
  if (type === 1) {
    // Subtraction
    const a = randInt(30, 99), b = randInt(5, a - 1);
    const ans = a - b;
    const { options, correctIdx } = shuffleOptions(ans, [ans + randInt(1, 5), ans - randInt(1, 5), ans + randInt(6, 10)]);
    return { question: `What is ${a} − ${b}?`, options, correct: correctIdx, tip: `${a} − ${b} = ${ans}` };
  }
  if (type === 2) {
    // Multiplication (tables 2-9)
    const a = randInt(2, 9), b = randInt(2, 9);
    const ans = a * b;
    const { options, correctIdx } = shuffleOptions(ans, [ans + a, ans - a, ans + randInt(1, 5)]);
    return { question: `What is ${a} × ${b}?`, options, correct: correctIdx, tip: `${a} × ${b} = ${ans}` };
  }
  if (type === 3) {
    // Pattern completion
    const start = randInt(2, 10), step = randInt(2, 5);
    const seq = [start, start + step, start + 2 * step, start + 3 * step];
    const ans = start + 4 * step;
    const { options, correctIdx } = shuffleOptions(ans, [ans + step, ans - step, ans + 1]);
    return { question: `What comes next: ${seq.join(', ')}, ?`, options, correct: correctIdx, tip: `Pattern: +${step}. Next is ${ans}.` };
  }
  // Comparison
  const a = randInt(20, 99), b = randInt(20, 99);
  const opts = [String(a), String(b), 'They are equal', 'Cannot tell'];
  if (a > b) return { question: `Which is greater: ${a} or ${b}?`, options: opts, correct: 0, tip: `${a} > ${b}` };
  if (b > a) return { question: `Which is greater: ${a} or ${b}?`, options: opts, correct: 1, tip: `${b} > ${a}` };
  return { question: `Which is greater: ${a} or ${b}?`, options: opts, correct: 2, tip: `${a} = ${b}. They are equal!` };
}

/* ── Level Generator ───────────────────────────── */

export const QUESTIONS_PER_LEVEL = 5;

export function generateLevel(worldId: string, levelNum: number): EduQuestion[] {
  const pool = Q[worldId] || Q.solar;
  const questions: EduQuestion[] = [];

  // Seed-based selection: use level number to pick different combos
  const offset = ((levelNum - 1) * QUESTIONS_PER_LEVEL) % pool.length;

  // Pick 3 questions from pool (rotating through), 2 math questions
  for (let i = 0; i < 3; i++) {
    questions.push(pool[(offset + i) % pool.length]);
  }
  questions.push(generateMathQuestion());
  questions.push(generateMathQuestion());

  // Shuffle the 5 questions
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  return questions;
}

/* ── Daily Limit System ────────────────────────── */

const DAILY_KEY = 'space_edu_daily_v1';
const MAX_DAILY = 10;
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface DailyProgress {
  levelsToday: number;
  lastBatchTimestamp: number;   // when 10th level was completed
  totalCompleted: number;
  worldLevels: Record<string, number>; // world id → highest level completed
}

export function loadDailyProgress(): DailyProgress {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { levelsToday: 0, lastBatchTimestamp: 0, totalCompleted: 0, worldLevels: {} };
}

export function saveDailyProgress(p: DailyProgress) {
  try { localStorage.setItem(DAILY_KEY, JSON.stringify(p)); }
  catch { /* quota */ }
}

export interface DailyStatus {
  canPlay: boolean;
  remaining: number;
  unlockTime: number | null;  // timestamp when they can play again
}

export function getDailyStatus(p: DailyProgress): DailyStatus {
  const now = Date.now();

  // If never hit limit, just check count
  if (p.levelsToday < MAX_DAILY && p.lastBatchTimestamp === 0) {
    return { canPlay: true, remaining: MAX_DAILY - p.levelsToday, unlockTime: null };
  }

  // If limit was hit, check if exactly 24h passed since that moment
  if (p.lastBatchTimestamp > 0) {
    const unlockAt = p.lastBatchTimestamp + COOLDOWN_MS;
    if (now >= unlockAt) {
      // 24h passed — allow next 10 levels
      return { canPlay: true, remaining: MAX_DAILY, unlockTime: null };
    }
    if (p.levelsToday >= MAX_DAILY) {
      // Still locked — show remaining time (capped at 24h)
      return { canPlay: false, remaining: 0, unlockTime: unlockAt };
    }
  }

  // Still under daily limit
  return { canPlay: true, remaining: MAX_DAILY - p.levelsToday, unlockTime: null };
}

export function recordLevelComplete(p: DailyProgress, worldId: string, levelNum: number): DailyProgress {
  const now = Date.now();
  const status = getDailyStatus(p);

  let levelsToday = p.levelsToday;
  let batchTs = p.lastBatchTimestamp;

  // If 24h cooldown passed, reset counter and clear batch timestamp
  if (status.canPlay && p.levelsToday >= MAX_DAILY && p.lastBatchTimestamp > 0) {
    levelsToday = 0;
    batchTs = 0;
  }

  levelsToday += 1;

  // When hitting exactly 10, stamp the current time (24h starts NOW)
  if (levelsToday >= MAX_DAILY) {
    batchTs = now;
  }

  return {
    levelsToday,
    lastBatchTimestamp: batchTs,
    totalCompleted: p.totalCompleted + 1,
    worldLevels: {
      ...p.worldLevels,
      [worldId]: Math.max(p.worldLevels[worldId] || 0, levelNum),
    },
  };
}
