/**
 * data/ncertChapters.ts
 * NCERT Std 2 chapter data for English (Mridang),
 * Maths (Joyful Mathematics), Hindi (Sarangi), and Gujarati (Bulbul).
 * Each entry has a textbook context reference for the AI assistant.
 */

export type Subject = 'English' | 'Maths' | 'Hindi' | 'Gujarati';

export interface ChapterInfo {
  id: string;
  subject: Subject;
  chapter: number;
  name: string;
  /** Short textbook context hint sent to Groq for grounding */
  context: string;
}

/* ---- ENGLISH - NCERT Mridang Std 2 ---- */

const englishChapters: ChapterInfo[] = [
  {
    id: 'en-1', subject: 'English', chapter: 1,
    name: 'My Bicycle',
    context: 'Story about a child and their bicycle adventure. Teaches vocabulary about transport, actions, and movement. Unit 1 - NCERT Mridang Class 2.',
  },
  {
    id: 'en-2', subject: 'English', chapter: 2,
    name: 'Picture Reading',
    context: 'Activity-based lesson where students understand stories through pictures. Teaches observation, sequencing, and storytelling. Unit 1 - NCERT Mridang Class 2.',
  },
  {
    id: 'en-3', subject: 'English', chapter: 3,
    name: 'It is Fun',
    context: 'Story about fun activities and joyful learning. Teaches action words, expressions of happiness, and reading comprehension. Unit 2 - NCERT Mridang Class 2.',
  },
  {
    id: 'en-4', subject: 'English', chapter: 4,
    name: 'Seeing without Seeing',
    context: 'Lesson about understanding the world beyond just eyesight. Teaches senses, empathy, and vocabulary about perception. Unit 2 - NCERT Mridang Class 2.',
  },
  {
    id: 'en-5', subject: 'English', chapter: 5,
    name: 'Come Back Soon',
    context: 'Story about visiting places and returning home. Teaches vocabulary about travel, family, and emotions. Unit 3 - NCERT Mridang Class 2.',
  },
  {
    id: 'en-6', subject: 'English', chapter: 6,
    name: 'Between Home and School',
    context: 'Lesson about things children observe while traveling between home and school. Teaches observation, places, and daily routines. Unit 3 - NCERT Mridang Class 2.',
  },
  {
    id: 'en-7', subject: 'English', chapter: 7,
    name: 'This is My Town',
    context: 'Story describing a child\'s town and surroundings. Teaches vocabulary about community, buildings, and descriptive language. Unit 3 - NCERT Mridang Class 2.',
  },
  {
    id: 'en-8', subject: 'English', chapter: 8,
    name: 'A Show of Clouds',
    context: 'Poem about clouds and their beautiful shapes. Teaches nature vocabulary, imagination, and rhyming patterns. Unit 4 - NCERT Mridang Class 2.',
  },
  {
    id: 'en-9', subject: 'English', chapter: 9,
    name: 'My Name',
    context: 'Story about identity and the importance of names. Teaches self-awareness, personal vocabulary, and reading skills. Unit 4 - NCERT Mridang Class 2.',
  },
  {
    id: 'en-10', subject: 'English', chapter: 10,
    name: 'The Crow',
    context: 'Story about a crow and its clever behavior. Teaches animal vocabulary, problem-solving, and comprehension. Unit 4 - NCERT Mridang Class 2.',
  },
  {
    id: 'en-11', subject: 'English', chapter: 11,
    name: 'The Smart Monkey',
    context: 'Story about a clever monkey and its smart actions. Teaches animal behavior, wisdom, and reading comprehension. Unit 4 - NCERT Mridang Class 2.',
  },
  {
    id: 'en-12', subject: 'English', chapter: 12,
    name: 'Little Drops of Water',
    context: 'Poem about unity and how small efforts create big results. Teaches values, nature vocabulary, and poetic expression. Unit 5 - NCERT Mridang Class 2.',
  },
  {
    id: 'en-13', subject: 'English', chapter: 13,
    name: 'We are all Indians',
    context: 'Lesson about unity, diversity, and national identity. Teaches patriotism, cultural awareness, and comprehension. Unit 5 - NCERT Mridang Class 2.',
  },
];

/* ---- MATHS - NCERT Joyful Mathematics Std 2 ---- */

const mathsChapters: ChapterInfo[] = [
  {
    id: 'ma-1', subject: 'Maths', chapter: 1,
    name: 'A Day at the Beach',
    context: 'Counting in groups, grouping objects, number patterns, tens and ones. Introduction to place value for NCERT Joyful Mathematics Class 2.',
  },
  {
    id: 'ma-2', subject: 'Maths', chapter: 2,
    name: 'Shapes Around Us',
    context: 'Introduction to three-dimensional shapes - cube, cuboid, sphere, cone, cylinder. Recognizing shapes in daily life for NCERT Joyful Mathematics Class 2.',
  },
  {
    id: 'ma-3', subject: 'Maths', chapter: 3,
    name: 'Fun with Numbers',
    context: 'Learning numbers from 1 to 100, number patterns, counting forward and backward. Number formation for NCERT Joyful Mathematics Class 2.',
  },
  {
    id: 'ma-4', subject: 'Maths', chapter: 4,
    name: 'Shadow Story',
    context: 'Understanding two-dimensional shapes using shadows - square, circle, rectangle, triangle. Shape properties for NCERT Joyful Mathematics Class 2.',
  },
  {
    id: 'ma-5', subject: 'Maths', chapter: 5,
    name: 'Playing with Lines',
    context: 'Learning about directions and orientations of lines - horizontal, vertical, slant, curved, straight for NCERT Joyful Mathematics Class 2.',
  },
  {
    id: 'ma-6', subject: 'Maths', chapter: 6,
    name: 'Decoration for Festival',
    context: 'Addition and subtraction with real-life examples, solving word problems related to festivals for NCERT Joyful Mathematics Class 2.',
  },
  {
    id: 'ma-7', subject: 'Maths', chapter: 7,
    name: "Rani's Gift",
    context: 'Measuring length, comparing sizes, using non-standard and standard units. Introduction to measurement for NCERT Joyful Mathematics Class 2.',
  },
  {
    id: 'ma-8', subject: 'Maths', chapter: 8,
    name: 'Grouping and Sharing',
    context: 'Understanding multiplication and division through grouping and equal sharing. Basic concepts for NCERT Joyful Mathematics Class 2.',
  },
  {
    id: 'ma-9', subject: 'Maths', chapter: 9,
    name: 'Which Season is It?',
    context: 'Learning about seasons, passage of time, daily routines. Introduction to calendar and time for NCERT Joyful Mathematics Class 2.',
  },
  {
    id: 'ma-10', subject: 'Maths', chapter: 10,
    name: 'Fun at the Fair',
    context: 'Understanding money, Indian currency, buying and selling, daily transactions for NCERT Joyful Mathematics Class 2.',
  },
  {
    id: 'ma-11', subject: 'Maths', chapter: 11,
    name: 'Data Handling',
    context: 'Introduction to collecting data, organizing information, reading simple tables and pictographs for NCERT Joyful Mathematics Class 2.',
  },
  {
    id: 'ma-12', subject: 'Maths', chapter: 12,
    name: 'Puzzles',
    context: 'Fun puzzles and riddles for logical thinking, pattern recognition, problem-solving skills for NCERT Joyful Mathematics Class 2.',
  },
];

/* ---- HINDI - NCERT Sarangi Std 2 ---- */

const hindiChapters: ChapterInfo[] = [
  // Unit 1: इकाई एक – हमारा पर्यावरण
  {
    id: 'hi-1', subject: 'Hindi', chapter: 1,
    name: 'सीखो',
    context: 'सीखने और ज्ञान के बारे में कविता। Unit 1 - हमारा पर्यावरण। Poem about learning and knowledge.',
  },
  {
    id: 'hi-2', subject: 'Hindi', chapter: 2,
    name: 'चींटी',
    context: 'चींटी की कहानी - प्रकृति और जानवर। Unit 1 - हमारा पर्यावरण। Story about ants and nature.',
  },
  {
    id: 'hi-3', subject: 'Hindi', chapter: 3,
    name: 'कितने पैर?',
    context: 'जानवरों के पैर गिनने की कहानी। गिनती, जानवर। Unit 1 - हमारा पर्यावरण। Story about counting animal legs.',
  },
  {
    id: 'hi-4', subject: 'Hindi', chapter: 4,
    name: 'बया हमारी चिड़िया रानी!',
    context: 'बया पक्षी की कहानी - घोंसला बनाना, प्रकृति। Unit 1 - हमारा पर्यावरण। Story about weaver bird and nature.',
  },
  {
    id: 'hi-5', subject: 'Hindi', chapter: 5,
    name: 'आम का पेड़',
    context: 'आम के पेड़ की कहानी - फल, प्रकृति प्रेम। Unit 1 - हमारा पर्यावरण। Story about mango tree, fruits and nature.',
  },
  // Unit 2: इकाई दो – हमारे मित्र
  {
    id: 'hi-6', subject: 'Hindi', chapter: 6,
    name: 'बीरबल की खिचड़ी',
    context: 'बीरबल की चतुराई की कहानी। बुद्धि, हास्य। Unit 2 - हमारे मित्र। Birbal story about intelligence and humor.',
  },
  {
    id: 'hi-7', subject: 'Hindi', chapter: 7,
    name: 'मित्र को पत्र',
    context: 'दोस्त को पत्र लिखना। दोस्ती, पत्र लेखन। Unit 2 - हमारे मित्र। Story about friendship and letter writing.',
  },
  {
    id: 'hi-8', subject: 'Hindi', chapter: 8,
    name: 'चतुर गीदड़',
    context: 'चतुर गीदड़ की कहानी। चतुराई, जानवर। Unit 2 - हमारे मित्र। Story about a clever jackal.',
  },
  {
    id: 'hi-9', subject: 'Hindi', chapter: 9,
    name: 'प्रकृति पर्व — फूलदेई',
    context: 'फूलदेई त्योहार की कहानी। त्योहार, संस्कृति, प्रकृति। Unit 2 - हमारे मित्र। Story about Phuldei festival and culture.',
  },
  // Unit 3: इकाई तीन – आओ खेलें
  {
    id: 'hi-10', subject: 'Hindi', chapter: 10,
    name: 'रस्साकशी',
    context: 'रस्साकशी खेल की कहानी। खेल, टीमवर्क। Unit 3 - आओ खेलें। Story about tug of war and teamwork.',
  },
  {
    id: 'hi-11', subject: 'Hindi', chapter: 11,
    name: 'एक जादुई पिटारा',
    context: 'जादुई पिटारे की कहानी। जादू, कल्पना। Unit 3 - आओ खेलें। Story about a magic box and imagination.',
  },
  // Unit 4: इकाई चार – अपना-अपना काम
  {
    id: 'hi-12', subject: 'Hindi', chapter: 12,
    name: 'अपना-अपना काम',
    context: 'अपने काम की जिम्मेदारी। काम, जिम्मेदारी। Unit 4 - अपना-अपना काम। Story about work and responsibility.',
  },
  {
    id: 'hi-13', subject: 'Hindi', chapter: 13,
    name: 'पेड़ों की अम्मा तिमक्का',
    context: 'सालुमारदा तिमक्का की प्रेरक कहानी। पर्यावरण, प्रेरणा। Unit 4 - अपना-अपना काम। Inspiring story about Timakka and environment.',
  },
  {
    id: 'hi-14', subject: 'Hindi', chapter: 14,
    name: 'किसान की होशियारी',
    context: 'किसान की बुद्धिमानी की कहानी। किसान, बुद्धिमानी। Unit 4 - अपना-अपना काम। Story about farmer\'s wisdom.',
  },
  // Unit 5: इकाई पाँच – हमारा देश
  {
    id: 'hi-15', subject: 'Hindi', chapter: 15,
    name: 'भारत',
    context: 'देशभक्ति की कविता। भारत, एकता। Unit 5 - हमारा देश। Poem about patriotism and India.',
  },
  {
    id: 'hi-16', subject: 'Hindi', chapter: 16,
    name: 'चंद्रयान (संवाद)',
    context: 'चंद्रयान के बारे में संवाद। अंतरिक्ष, विज्ञान। Unit 5 - हमारा देश। Dialogue about Chandrayaan and space science.',
  },
  {
    id: 'hi-17', subject: 'Hindi', chapter: 17,
    name: 'बोलने वाली मूँद',
    context: 'बोलने वाली मूँद की कल्पनाशील कहानी। कल्पना। Unit 5 - हमारा देश। Imaginative story about a talking radish.',
  },
  {
    id: 'hi-18', subject: 'Hindi', chapter: 18,
    name: 'हम अनेक किन्तु एक',
    context: 'एकता में अनेकता की कविता। एकता, विविधता। Unit 5 - हमारा देश। Poem about unity in diversity.',
  },
];

/* ---- GUJARATI - GSEB Mayur Std 3 ---- */

const gujaratiChapters: ChapterInfo[] = [
  {
    id: 'gu-1', subject: 'Gujarati', chapter: 1,
    name: 'નાક-કાન વગર ગા',
    context: 'કલ્પના અને હાસ્યની વાર્તા। Imagination and humor story.',
  },
  {
    id: 'gu-2', subject: 'Gujarati', chapter: 2,
    name: 'નારાજ વનરાજ',
    context: 'પ્રકૃતિ અને પ્રાણી વિશે વાર્તા। Story about nature and animals.',
  },
  {
    id: 'gu-3', subject: 'Gujarati', chapter: 3,
    name: 'મકાન વગરના વાનર',
    context: 'પ્રાણી અને જીવનશૈલી વિશે વાર્તા। Story about animals and lifestyle.',
  },
  {
    id: 'gu-4', subject: 'Gujarati', chapter: 4,
    name: 'લાલકણને ખાઈ ગઈ બાજરી',
    context: 'ખોરાક અને લોકકથા વિશે વાર્તા। Folk tale about food.',
  },
  {
    id: 'gu-5', subject: 'Gujarati', chapter: 5,
    name: 'તીનું તમતમતું ગીત',
    context: 'સંગીત અને આનંદ વિશે કવિતા। Poem about music and joy.',
  },
  {
    id: 'gu-6', subject: 'Gujarati', chapter: 6,
    name: 'મરજી બનો, મઝા કરો',
    context: 'મિત્રતા અને આનંદ વિશે વાર્તા। Story about friendship and fun.',
  },
  {
    id: 'gu-7', subject: 'Gujarati', chapter: 7,
    name: 'મિયાંઉ...મિયાંઉ, અહી આવ',
    context: 'પ્રાણી અને રમૂજ વિશે વાર્તા। Story about animals and humor.',
  },
];

/* ---- COMBINED ---- */

export const CHAPTER_DATA: Record<Subject, ChapterInfo[]> = {
  English: englishChapters,
  Maths: mathsChapters,
  Hindi: hindiChapters,
  Gujarati: gujaratiChapters,
};

export const ALL_CHAPTERS: ChapterInfo[] = [...englishChapters, ...mathsChapters, ...hindiChapters, ...gujaratiChapters];
