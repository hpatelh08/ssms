/**
 * data/ncertChapters.ts
 * NCERT Std 3 chapter data for English (English Reader),
 * Maths (Math-Magic), Science (EVS), Hindi (Veena), and Gujarati (GSEB).
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

/* ---- ENGLISH - NCERT English Reader Std 3 ---- */

const englishChapters: ChapterInfo[] = [
  {
    id: 'en-1', subject: 'English', chapter: 1,
    name: 'Colours',
    context: 'Story about colours and imagination. Teaches colour names, creative thinking, and reading comprehension. Unit 1 - Fun with Friends.',
  },
  {
    id: 'en-2', subject: 'English', chapter: 2,
    name: 'Badal and Moti',
    context: 'Story about a boy Badal and his pet dog Moti. Teaches friendship, pets, vocabulary about animals and companionship. Unit 1 - Fun with Friends.',
  },
  {
    id: 'en-3', subject: 'English', chapter: 3,
    name: 'Best Friends',
    context: 'Story about companionship and values of friendship. Teaches social values, sentence formation, and comprehension. Unit 1 - Fun with Friends.',
  },
  {
    id: 'en-4', subject: 'English', chapter: 4,
    name: 'Out in the Garden',
    context: 'Story about nature and playtime in the garden. Teaches nature vocabulary, action verbs, and observation skills. Unit 2 - Toys and Games.',
  },
  {
    id: 'en-5', subject: 'English', chapter: 5,
    name: 'Talking Toys',
    context: 'Story about toys and imagination. Teaches toy vocabulary, dialogue reading, and creative expression. Unit 2 - Toys and Games.',
  },
  {
    id: 'en-6', subject: 'English', chapter: 6,
    name: 'Paper Boats',
    context: 'Story about creativity and fun with paper boats. Teaches craft vocabulary, imaginative play, and sentence building. Unit 2 - Toys and Games.',
  },
  {
    id: 'en-7', subject: 'English', chapter: 7,
    name: 'The Big Laddoo',
    context: 'Story about sharing and sweets. Teaches values of sharing, food vocabulary, and reading comprehension. Unit 3 - Good Food.',
  },
  {
    id: 'en-8', subject: 'English', chapter: 8,
    name: 'Thank You',
    context: 'Story about gratitude and values. Teaches expressing thanks, polite language, and social skills. Unit 3 - Good Food.',
  },
  {
    id: 'en-9', subject: 'English', chapter: 9,
    name: "Madhu's Wish",
    context: 'Story about dreams and kindness. Teaches aspirations, descriptive language, and empathy. Unit 3 - Good Food.',
  },
  {
    id: 'en-10', subject: 'English', chapter: 10,
    name: 'Night',
    context: 'Poem about the night sky and wonder. Teaches vocabulary about night, stars, moon, and rhyming patterns. Unit 4 - The Sky.',
  },
  {
    id: 'en-11', subject: 'English', chapter: 11,
    name: 'Chanda Mama Counts the Stars',
    context: 'Poem about the moon and stars. Teaches counting, space vocabulary, and poetic expression. Unit 4 - The Sky.',
  },
  {
    id: 'en-12', subject: 'English', chapter: 12,
    name: 'Chandrayaan',
    context: 'Story about space exploration and India\'s Chandrayaan mission. Teaches science vocabulary, national pride, and comprehension. Unit 4 - The Sky.',
  },
];

/* ---- MATHS - NCERT Math-Magic Std 3 ---- */

const mathsChapters: ChapterInfo[] = [
  {
    id: 'ma-1', subject: 'Maths', chapter: 1,
    name: "What's in a Name?",
    context: 'Number names, writing numbers in words, place value (ones, tens, hundreds), number recognition and representation.',
  },
  {
    id: 'ma-2', subject: 'Maths', chapter: 2,
    name: 'Toy Joy',
    context: 'Counting toys, number sequences, comparing quantities, basic addition and subtraction, grouping objects.',
  },
  {
    id: 'ma-3', subject: 'Maths', chapter: 3,
    name: 'Double Century',
    context: 'Numbers up to 200, place value system, comparing numbers, ordering numbers, skip counting.',
  },
  {
    id: 'ma-4', subject: 'Maths', chapter: 4,
    name: 'Vacation With My Nani Maa',
    context: 'Addition with carrying, subtraction with borrowing, word problems, real-life math with family activities.',
  },
  {
    id: 'ma-5', subject: 'Maths', chapter: 5,
    name: 'Fun With Shapes',
    context: '2D shapes (triangle, square, circle, rectangle), 3D shapes (cube, sphere), symmetry, patterns, geometry.',
  },
  {
    id: 'ma-6', subject: 'Maths', chapter: 6,
    name: 'House of Hundreds - 1',
    context: 'Numbers 100-999, place value of hundreds, three-digit numbers, expanded form, number representation.',
  },
  {
    id: 'ma-7', subject: 'Maths', chapter: 7,
    name: 'Raksha Bandhan',
    context: 'Multiplication introduction, repeated addition, multiplication tables 2-10, groups, arrays, festival math.',
  },
  {
    id: 'ma-8', subject: 'Maths', chapter: 8,
    name: 'Fair Share',
    context: 'Division basics, equal sharing, grouping, fair distribution, division by 2-10, remainders.',
  },
  {
    id: 'ma-9', subject: 'Maths', chapter: 9,
    name: 'House of Hundreds - 2',
    context: 'Three-digit addition, three-digit subtraction, carrying in hundreds, borrowing from hundreds, large numbers.',
  },
  {
    id: 'ma-10', subject: 'Maths', chapter: 10,
    name: 'Fun at Class Party',
    context: 'Pattern recognition, number sequences, shape patterns, growing patterns, prediction, party arrangements.',
  },
  {
    id: 'ma-11', subject: 'Maths', chapter: 11,
    name: 'Filling and Lifting',
    context: 'Capacity measurement, volume, litres-millilitres, weight measurement, kilograms-grams, comparison.',
  },
  {
    id: 'ma-12', subject: 'Maths', chapter: 12,
    name: 'Give and Take',
    context: 'Advanced addition-subtraction, mixed operations, problem solving, exchange, money transactions.',
  },
  {
    id: 'ma-13', subject: 'Maths', chapter: 13,
    name: 'Time Goes On',
    context: 'Reading clocks, telling time, hours-minutes-seconds, AM-PM, calendar, days-weeks-months-years.',
  },
  {
    id: 'ma-14', subject: 'Maths', chapter: 14,
    name: 'The Surajkund Fair',
    context: 'Money, Indian currency, rupees-paise, buying-selling, addition-subtraction of money, change calculation.',
  },
];

/* ---- SCIENCE - NCERT EVS Std 3 ---- */

const scienceChapters: ChapterInfo[] = [
  {
    id: 'sc-1', subject: 'Science', chapter: 1,
    name: 'Family and Friends',
    context: 'Family bonds, friendship, social values. Understanding relationships and community. Unit 1 - Our Families and Communities.',
  },
  {
    id: 'sc-2', subject: 'Science', chapter: 2,
    name: 'Going to the Mela',
    context: 'Community fairs, social life, markets and public gatherings. Unit 1 - Our Families and Communities.',
  },
  {
    id: 'sc-3', subject: 'Science', chapter: 3,
    name: 'Celebrating Festivals',
    context: 'Traditions, culture, celebrations, Indian festivals and their significance. Unit 1 - Our Families and Communities.',
  },
  {
    id: 'sc-4', subject: 'Science', chapter: 4,
    name: 'Getting to Know Plants',
    context: 'Plant types, parts of plants, plant growth, observation of nature. Unit 2 - Life Around Us.',
  },
  {
    id: 'sc-5', subject: 'Science', chapter: 5,
    name: 'Plants and Animals Live Together',
    context: 'Ecosystem, interdependence of plants and animals, food chains, balance in nature. Unit 2 - Life Around Us.',
  },
  {
    id: 'sc-6', subject: 'Science', chapter: 6,
    name: 'Living in Harmony',
    context: 'Cooperation in nature, environmental awareness, peaceful living with nature. Unit 2 - Life Around Us.',
  },
  {
    id: 'sc-7', subject: 'Science', chapter: 7,
    name: 'Water — A Precious Gift',
    context: 'Water sources, importance of water, water conservation, clean water. Unit 3 - Gifts of Nature.',
  },
  {
    id: 'sc-8', subject: 'Science', chapter: 8,
    name: 'Food We Eat',
    context: 'Nutrition, food groups, healthy eating habits, balanced diet. Unit 3 - Gifts of Nature.',
  },
  {
    id: 'sc-9', subject: 'Science', chapter: 9,
    name: 'Staying Healthy and Happy',
    context: 'Hygiene, exercise, wellness, healthy habits, importance of physical activity. Unit 3 - Gifts of Nature.',
  },
  {
    id: 'sc-10', subject: 'Science', chapter: 10,
    name: 'This World of Things',
    context: 'Objects and materials around us, properties of materials, daily use items. Unit 4 - Things Around Us.',
  },
  {
    id: 'sc-11', subject: 'Science', chapter: 11,
    name: 'Making Things',
    context: 'Creativity, craft, construction, making objects from different materials. Unit 4 - Things Around Us.',
  },
  {
    id: 'sc-12', subject: 'Science', chapter: 12,
    name: 'Taking Charge of Waste',
    context: 'Waste management, recycling, reduce-reuse-recycle, responsibility towards environment. Unit 4 - Things Around Us.',
  },
];

/* ---- HINDI - NCERT Veena Std 3 ---- */

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
  Science: scienceChapters,
  Hindi: hindiChapters,
  Gujarati: gujaratiChapters,
};

export const ALL_CHAPTERS: ChapterInfo[] = [...englishChapters, ...mathsChapters, ...scienceChapters, ...hindiChapters, ...gujaratiChapters];
