/**
 * data/ncertChapters.ts
 * NCERT Std 5 chapter data for English (Marigold / Santoor),
 * Maths (Maths Mela / Math-Magic), Science (EVS - Looking Around),
 * Hindi (Veena), and Gujarati (GSEB Kukut).
 * Each entry has a textbook context reference for the AI assistant.
 */

export type Subject = 'English' | 'Maths' | 'Science' | 'Hindi' | 'Gujarati';

export interface ChapterInfo {
  id: string;
  subject: Subject;
  chapter: number;
  name: string;
  /** Short textbook context hint sent to Groq for grounding */
  context: string;
}

/* ---- ENGLISH - NCERT Marigold / Santoor Std 5 ---- */

const englishChapters: ChapterInfo[] = [
  {
    id: 'en-1', subject: 'English', chapter: 1,
    name: "Papa's Spectacles",
    context: "Story about Papa's spectacles and family life. Teaches reading comprehension, family vocabulary, and values. Unit 1 - Let's Have Fun.",
  },
  {
    id: 'en-2', subject: 'English', chapter: 2,
    name: 'Gone with the Scooter',
    context: 'Story about a scooter ride and adventure. Teaches action verbs, adventure vocabulary, and narrative comprehension. Unit 1 - Let\'s Have Fun.',
  },
  {
    id: 'en-3', subject: 'English', chapter: 3,
    name: 'The Rainbow',
    context: 'Poem about the rainbow and colours in nature. Teaches colour vocabulary, poetic expression, and nature observation. Unit 2 - My Colourful World.',
  },
  {
    id: 'en-4', subject: 'English', chapter: 4,
    name: 'The Wise Parrot',
    context: 'Story about a wise parrot with a moral lesson. Teaches animal vocabulary, wisdom, and reading comprehension. Unit 2 - My Colourful World.',
  },
  {
    id: 'en-5', subject: 'English', chapter: 5,
    name: 'The Frog',
    context: 'Poem about a frog and water. Teaches nature vocabulary, rhymes, and poetic language. Unit 3 - Water.',
  },
  {
    id: 'en-6', subject: 'English', chapter: 6,
    name: 'What a Tank!',
    context: 'Story about water tanks and conservation. Teaches water vocabulary, environmental awareness, and comprehension. Unit 3 - Water.',
  },
  {
    id: 'en-7', subject: 'English', chapter: 7,
    name: 'Gilli Danda',
    context: 'Story about the traditional Indian game Gilli Danda. Teaches sports vocabulary, culture, and reading comprehension. Unit 4 - Ups and Downs.',
  },
  {
    id: 'en-8', subject: 'English', chapter: 8,
    name: 'The Decision of the Panchayat',
    context: 'Story about how a panchayat makes a fair decision. Teaches civics, justice, community vocabulary. Unit 4 - Ups and Downs.',
  },
  {
    id: 'en-9', subject: 'English', chapter: 9,
    name: 'Vocation',
    context: 'Poem about different occupations and work. Teaches occupations vocabulary, values of labour. Unit 5 - Work is Worship.',
  },
  {
    id: 'en-10', subject: 'English', chapter: 10,
    name: 'Glass Bangles',
    context: 'Story about the artisan craft of glass bangles. Teaches craft vocabulary, cultural heritage, and comprehension. Unit 5 - Work is Worship.',
  },
];

/* ---- MATHS - NCERT Maths Mela / Math-Magic Std 5 ---- */

const mathsChapters: ChapterInfo[] = [
  {
    id: 'ma-1', subject: 'Maths', chapter: 1,
    name: 'We the Travellers — I',
    context: 'Large numbers, place value up to lakhs and crores, reading and writing large numbers, comparison and ordering.',
  },
  {
    id: 'ma-2', subject: 'Maths', chapter: 2,
    name: 'Fractions',
    context: 'Types of fractions (proper, improper, mixed), equivalent fractions, comparing fractions, addition and subtraction of fractions.',
  },
  {
    id: 'ma-3', subject: 'Maths', chapter: 3,
    name: 'Angles as Turns',
    context: 'Understanding angles as amounts of turn, measuring angles in degrees, right angles, acute and obtuse angles, geometry tools.',
  },
  {
    id: 'ma-4', subject: 'Maths', chapter: 4,
    name: 'We the Travellers — II',
    context: 'Multiplication of large numbers, division with large numbers, factors, multiples, real-life applications of multiplication and division.',
  },
  {
    id: 'ma-5', subject: 'Maths', chapter: 5,
    name: 'Far and Near',
    context: 'Mental maths strategies, estimation and approximation, rounding numbers, distance and scale, map reading basics.',
  },
  {
    id: 'ma-6', subject: 'Maths', chapter: 6,
    name: 'The Dairy Farm',
    context: 'Decimals introduction, decimal place value, reading and writing decimals, comparing decimals, real-life decimal applications.',
  },
  {
    id: 'ma-7', subject: 'Maths', chapter: 7,
    name: 'Shapes and Patterns',
    context: '2D and 3D shapes, tessellations, geometric patterns, area and perimeter, nets of 3D shapes.',
  },
  {
    id: 'ma-8', subject: 'Maths', chapter: 8,
    name: 'Weight and Capacity',
    context: 'Metric units of weight (grams, kilograms), metric units of capacity (millilitres, litres), conversion, measurement problems.',
  },
  {
    id: 'ma-9', subject: 'Maths', chapter: 9,
    name: 'Coconut Farm',
    context: 'Average, introduction to percentages, problem solving with averages, real-life percentage applications.',
  },
  {
    id: 'ma-10', subject: 'Maths', chapter: 10,
    name: 'Symmetrical Designs',
    context: 'Lines of symmetry, rotational symmetry, reflective symmetry in shapes and designs, creating symmetric patterns.',
  },
  {
    id: 'ma-11', subject: 'Maths', chapter: 11,
    name: "Grandmother's Quilt",
    context: 'Area of irregular shapes, perimeter activities, fractions and area, exploring area through quilting patterns.',
  },
  {
    id: 'ma-12', subject: 'Maths', chapter: 12,
    name: 'Racing Seconds',
    context: 'Time measurement, seconds-minutes-hours, elapsed time, timetables, speed and distance basics.',
  },
  {
    id: 'ma-13', subject: 'Maths', chapter: 13,
    name: 'Animal Jumps',
    context: 'Introduction to integers, positive and negative numbers, number line, comparison of integers, real-life integer applications.',
  },
  {
    id: 'ma-14', subject: 'Maths', chapter: 14,
    name: 'Maps and Locations',
    context: 'Grid references, coordinates, reading map scales, directions, calculating distances on maps.',
  },
  {
    id: 'ma-15', subject: 'Maths', chapter: 15,
    name: 'Data Through Pictures',
    context: 'Data collection and organisation, pictographs, bar graphs, pie charts, interpreting and drawing graphs.',
  },
];

/* ---- SCIENCE - NCERT EVS Looking Around Std 5 ---- */

const scienceChapters: ChapterInfo[] = [
  {
    id: 'sc-1', subject: 'Science', chapter: 1,
    name: 'Water: The Essence of Life',
    context: 'Water cycle, sources of water, importance of water for living things, water conservation. Unit 1 - Life Around Us.',
  },
  {
    id: 'sc-2', subject: 'Science', chapter: 2,
    name: 'Journey of a River',
    context: 'River systems, flow of water, erosion and deposition, rivers and human settlements. Unit 1 - Life Around Us.',
  },
  {
    id: 'sc-3', subject: 'Science', chapter: 3,
    name: 'The Mystery of Food',
    context: 'Photosynthesis, food chains, nutrition in plants and animals, balanced diet. Unit 2 - Health and Well-being.',
  },
  {
    id: 'sc-4', subject: 'Science', chapter: 4,
    name: 'Our School: A Happy Place',
    context: 'School environment, safety and hygiene, collaboration and community. Unit 2 - Health and Well-being.',
  },
  {
    id: 'sc-5', subject: 'Science', chapter: 5,
    name: 'Our Vibrant Country',
    context: 'Cultural diversity, states of India, festivals, traditions, unity in diversity. Unit 3 - Incredible India.',
  },
  {
    id: 'sc-6', subject: 'Science', chapter: 6,
    name: 'Some Unique Places',
    context: 'Heritage sites, geographical wonders, biodiversity hotspots, conservation. Unit 3 - Incredible India.',
  },
  {
    id: 'sc-7', subject: 'Science', chapter: 7,
    name: 'Energy: How Things Work',
    context: 'Sources of energy, renewable and non-renewable energy, electricity, simple machines. Unit 4 - Things Around Us.',
  },
  {
    id: 'sc-8', subject: 'Science', chapter: 8,
    name: 'Clothes: How Things are Made',
    context: 'Textile fibers, weaving and spinning, cotton and silk production, sustainable fashion. Unit 4 - Things Around Us.',
  },
  {
    id: 'sc-9', subject: 'Science', chapter: 9,
    name: 'Rhythms of Nature',
    context: 'Seasons, Earth\'s revolution, day and night, weather patterns, natural cycles. Unit 5 - Our Amazing Planet.',
  },
  {
    id: 'sc-10', subject: 'Science', chapter: 10,
    name: 'Earth: Our Shared Home',
    context: 'Environmental conservation, ecosystems, biodiversity, pollution, responsibility towards Earth. Unit 5 - Our Amazing Planet.',
  },
];

/* ---- HINDI - NCERT Veena Std 5 ---- */

const hindiChapters: ChapterInfo[] = [
  {
    id: 'hi-1', subject: 'Hindi', chapter: 1,
    name: 'किरण',
    context: 'किरण की कहानी - चरित्र और वर्णनात्मक लेखन, पठन बोध। NCERT Veena Class 5 Chapter 1.',
  },
  {
    id: 'hi-2', subject: 'Hindi', chapter: 2,
    name: 'न्याय की कुर्सी',
    context: 'न्याय और नैतिक मूल्य की कहानी, संवाद। NCERT Veena Class 5 Chapter 2.',
  },
  {
    id: 'hi-3', subject: 'Hindi', chapter: 3,
    name: 'चाँद का कुरता',
    context: 'काव्य भाषा, रूपक और ताल की कविता। NCERT Veena Class 5 Chapter 3.',
  },
  {
    id: 'hi-4', subject: 'Hindi', chapter: 4,
    name: 'साङकेन',
    context: 'संस्कृति और त्योहार पर आधारित कहानी, पठन बोध। NCERT Veena Class 5 Chapter 4.',
  },
  {
    id: 'hi-5', subject: 'Hindi', chapter: 5,
    name: 'सुंदरीया',
    context: 'विशेषण और प्रकृति शब्दावली की कहानी। NCERT Veena Class 5 Chapter 5.',
  },
  {
    id: 'hi-6', subject: 'Hindi', chapter: 6,
    name: 'चतुर चित्रकार',
    context: 'चतुराई पर आधारित कहानी, शब्द भंडार और कथा लेखन। NCERT Veena Class 5 Chapter 6.',
  },
  {
    id: 'hi-7', subject: 'Hindi', chapter: 7,
    name: 'मेरा बचपन',
    context: 'आत्मकथा, भूतकाल और व्यक्तिगत लेखन। NCERT Veena Class 5 Chapter 7.',
  },
  {
    id: 'hi-8', subject: 'Hindi', chapter: 8,
    name: 'काजीरंगा राष्ट्रीय उद्यान की यात्रा',
    context: 'यात्रा वर्णन और वन्यजीव शब्दावली। NCERT Veena Class 5 Chapter 8.',
  },
  {
    id: 'hi-9', subject: 'Hindi', chapter: 9,
    name: 'न्याय',
    context: 'न्याय और नैतिक मूल्य, पठन बोध। NCERT Veena Class 5 Chapter 9.',
  },
  {
    id: 'hi-10', subject: 'Hindi', chapter: 10,
    name: 'तीन मछलियाँ',
    context: 'लोककथा - बुद्धिमानी और योजना। NCERT Veena Class 5 Chapter 10.',
  },
  {
    id: 'hi-11', subject: 'Hindi', chapter: 11,
    name: 'हमारे ये कलामंदिर',
    context: 'कला और सांस्कृतिक विरासत, कर्मवाच्य। NCERT Veena Class 5 Chapter 11.',
  },
];

/* ---- GUJARATI - GSEB Kukut Std 5 ---- */

const gujaratiChapters: ChapterInfo[] = [
  {
    id: 'gu-1', subject: 'Gujarati', chapter: 1,
    name: 'પતંગા પાઈ',
    context: 'પ્રકૃતિ, પતંગ અને કાવ્ય અભિવ્યક્તિ - GSEB Kukut Class 5 Chapter 1.',
  },
  {
    id: 'gu-2', subject: 'Gujarati', chapter: 2,
    name: 'તમારું મન આપો',
    context: 'ધ્યાન, મન અને શીખવું - GSEB Kukut Class 5 Chapter 2.',
  },
  {
    id: 'gu-3', subject: 'Gujarati', chapter: 3,
    name: 'છ પગ ને બે પાંખ',
    context: 'કીડા, પ્રાણીઓ અને પ્રકૃતિ - GSEB Kukut Class 5 Chapter 3.',
  },
  {
    id: 'gu-4', subject: 'Gujarati', chapter: 4,
    name: 'આપશો તો બતાવો',
    context: 'સહયોગ, વહેંચણી અને સામાજિક મૂલ્ય - GSEB Kukut Class 5 Chapter 4.',
  },
  {
    id: 'gu-5', subject: 'Gujarati', chapter: 5,
    name: 'ઠંડક - બળતરા',
    context: 'વિરોધી શબ્દો, ઠંડી-ગરમી અને કાવ્ય ભાષા - GSEB Kukut Class 5 Chapter 5.',
  },
  {
    id: 'gu-6', subject: 'Gujarati', chapter: 6,
    name: 'જીવતા હો અને જીવો',
    context: 'જીવન, સ્વતંત્રતા અને નૈતિક મૂલ્ય - GSEB Kukut Class 5 Chapter 6.',
  },
  {
    id: 'gu-7', subject: 'Gujarati', chapter: 7,
    name: 'પ્રશ્નોમાં પરાક્રમ',
    context: 'જિજ્ઞાસા, પ્રશ્ન અને સાહસ - GSEB Kukut Class 5 Chapter 7.',
  },
  {
    id: 'gu-8', subject: 'Gujarati', chapter: 8,
    name: 'ચોટી મુંગી ઘૂઘૂઘૂ',
    context: 'કીડી, પ્રાણી અને રમૂજ - GSEB Kukut Class 5 Chapter 8.',
  },
  {
    id: 'gu-9', subject: 'Gujarati', chapter: 9,
    name: 'શુભ રાત્રી',
    context: 'રાત, ઊંઘ અને સ્વપ્ન - GSEB Kukut Class 5 Chapter 9.',
  },
];

/* ---- COMBINED ---- */

export const CHAPTER_DATA: Record<Subject, ChapterInfo[]> = {
  English: englishChapters,
  Maths: mathsChapters,
  Science: scienceChapters,
  Hindi: hindiChapters,
  Gujarati: gujaratiChapters,
};

export const ALL_CHAPTERS: ChapterInfo[] = [...englishChapters, ...mathsChapters, ...scienceChapters, ...hindiChapters, ...gujaratiChapters];
