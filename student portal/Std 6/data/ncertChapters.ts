/**
 * data/ncertChapters.ts
 * NCERT Class 6 chapter data for English, Maths, Science,
 * and Social Science. Each entry maps to a textbook context
 * reference for the AI assistant.
 */

export type Subject = 'English' | 'Maths' | 'Science' | 'Hindi' | 'Social Science';

export interface ChapterInfo {
  id: string;
  subject: Subject;
  chapter: number;
  name: string;
  /** Short textbook context hint sent to Groq for grounding */
  context: string;
}

/* ENGLISH -- NCERT Class 6 (Poorvi) */

const englishChapters: ChapterInfo[] = [
  { id: 'en-1', subject: 'English', chapter: 1, name: 'Unit 1: Fables and Folk Tales - A Bottle of Dew', context: 'A folk tale about the value of hard work and honesty. A farmer receives a magical bottle of dew. Themes: moral values, folk wisdom, narrative comprehension.' },
  { id: 'en-2', subject: 'English', chapter: 2, name: 'Unit 1: Fables and Folk Tales - The Raven and the Fox', context: 'A fable about a fox who flatters a raven to steal its food. Teaches about flattery, critical thinking, and moral lessons.' },
  { id: 'en-3', subject: 'English', chapter: 3, name: 'Unit 1: Fables and Folk Tales - Rama to the Rescue', context: 'A story about bravery and helping others. Themes: heroism, courage, friendship.' },
  { id: 'en-4', subject: 'English', chapter: 4, name: 'Unit 2: Friendship - The Unlikely Best Friends', context: 'A story about two very different characters who become best friends. Themes: friendship, acceptance, diversity.' },
  { id: 'en-5', subject: 'English', chapter: 5, name: "Unit 2: Friendship - A Friend's Prayer", context: "A poem about friendship and praying for a friend's well-being. Themes: friendship, empathy, poetry." },
  { id: 'en-6', subject: 'English', chapter: 6, name: 'Unit 2: Friendship - The Chair', context: 'A story about a chair that belongs to a special friend. Themes: memories, emotions, friendship.' },
  { id: 'en-7', subject: 'English', chapter: 7, name: 'Unit 3: Nurturing Nature - Neem Baba', context: 'A story about an old man who loves and protects trees, especially the neem tree. Themes: environment, nature conservation.' },
  { id: 'en-8', subject: 'English', chapter: 8, name: 'Unit 3: Nurturing Nature - What a Bird Thought', context: 'A poem from the perspective of a bird. Themes: nature, imagination, poetry, bird life.' },
  { id: 'en-9', subject: 'English', chapter: 9, name: 'Unit 3: Nurturing Nature - Spices that Heal Us', context: 'An informational text about common spices and their health benefits. Themes: health, Indian spices, science.' },
  { id: 'en-10', subject: 'English', chapter: 10, name: 'Unit 4: Sports and Wellness - Change of Heart', context: 'A story about a character who changes attitude towards sports. Themes: sportsmanship, perseverance.' },
  { id: 'en-11', subject: 'English', chapter: 11, name: 'Unit 4: Sports and Wellness - The Winner', context: 'A story about what it means to truly win. Themes: sportsmanship, determination, inner strength.' },
  { id: 'en-12', subject: 'English', chapter: 12, name: 'Unit 4: Sports and Wellness - Yoga: A Way of Life', context: 'An informational text about yoga and its benefits for health. Themes: yoga, wellness, Indian tradition.' },
  { id: 'en-13', subject: 'English', chapter: 13, name: 'Unit 5: Culture and Tradition - Hamara Bharat: Incredible India!', context: "A text celebrating India's rich cultural diversity and traditions. Themes: Indian culture, heritage, diversity." },
  { id: 'en-14', subject: 'English', chapter: 14, name: 'Unit 5: Culture and Tradition - The Kites', context: 'A poem about the joy of flying kites. Themes: Indian festivals, kite flying, celebration, poetry.' },
  { id: 'en-15', subject: 'English', chapter: 15, name: 'Unit 5: Culture and Tradition - Ila Sachani: Embroidering Dreams with her Feet', context: 'An inspiring story about Ila Sachani, an artist who embroiders with her feet. Themes: inspiration, disability, art.' },
  { id: 'en-16', subject: 'English', chapter: 16, name: 'Unit 5: Culture and Tradition - National War Memorial', context: 'A text about the National War Memorial in India and its significance. Themes: patriotism, sacrifice, national symbols.' },
];

/* MATHS -- NCERT Class 6 (Ganita Prakash) */

const mathsChapters: ChapterInfo[] = [
  { id: 'ma-1', subject: 'Maths', chapter: 1, name: 'Unit 1: Patterns in Mathematics', context: 'Patterns in numbers and shapes. Number sequences, visualising sequences, relations among number sequences, patterns in shapes.' },
  { id: 'ma-2', subject: 'Maths', chapter: 2, name: 'Unit 2: Lines and Angles', context: 'Points, line segments, lines, rays, angles. Comparing angles, special types of angles, measuring and drawing angles.' },
  { id: 'ma-3', subject: 'Maths', chapter: 3, name: 'Unit 3: Number Play', context: 'Numbers can tell us things, supercells, patterns on number line, palindromic patterns, Kaprekar numbers, Collatz conjecture, mental math, estimation.' },
  { id: 'ma-4', subject: 'Maths', chapter: 4, name: 'Unit 4: Data Handling and Presentation', context: 'Collecting and organising data, pictographs, bar graphs, drawing bar graphs, artistic considerations in data presentation.' },
  { id: 'ma-5', subject: 'Maths', chapter: 5, name: 'Unit 5: Prime Time', context: 'Common multiples and factors, prime numbers, co-prime numbers, prime factorisation, fun with numbers.' },
  { id: 'ma-6', subject: 'Maths', chapter: 6, name: 'Unit 6: Perimeter and Area', context: 'Perimeter of shapes, area of rectangles and irregular shapes, area of a triangle.' },
  { id: 'ma-7', subject: 'Maths', chapter: 7, name: 'Unit 7: Fractions', context: 'Fractional units, fractions as parts of a whole, measuring using fractions, fractions on number line, mixed fractions, equivalent fractions, comparing, adding and subtracting fractions.' },
  { id: 'ma-8', subject: 'Maths', chapter: 8, name: 'Unit 8: Playing with Constructions', context: 'Squares and rectangles, constructing squares and rectangles, exploring diagonals, points equidistant from two given points.' },
  { id: 'ma-9', subject: 'Maths', chapter: 9, name: 'Unit 9: Symmetry', context: 'Line of symmetry in shapes and figures, rotational symmetry, identifying symmetry in real-life objects.' },
  { id: 'ma-10', subject: 'Maths', chapter: 10, name: 'Unit 10: The Other Side of Zero', context: 'Introduction to integers, negative numbers, the token model, integers in real life, explorations with integers.' },
];

/* SCIENCE -- NCERT Class 6 */

const scienceChapters: ChapterInfo[] = [
  { id: 'sc-1', subject: 'Science', chapter: 1, name: 'Unit 1: The Wonderful World of Science', context: 'Introduction to science, scientific thinking, observation, curiosity, and the process of scientific inquiry.' },
  { id: 'sc-2', subject: 'Science', chapter: 2, name: 'Unit 2: Diversity in the Living World', context: 'Diversity among plants and animals, classification, habitats, adaptations, and importance of biodiversity.' },
  { id: 'sc-3', subject: 'Science', chapter: 3, name: 'Unit 3: Mindful Eating: A Path to a Healthy Body', context: 'Nutrients in food, balanced diet, deficiency diseases, importance of healthy eating habits.' },
  { id: 'sc-4', subject: 'Science', chapter: 4, name: 'Unit 4: Exploring Magnets', context: 'Properties of magnets, poles, magnetic field, uses of magnets, magnetic and non-magnetic materials.' },
  { id: 'sc-5', subject: 'Science', chapter: 5, name: 'Unit 5: Measurement of Length and Motion', context: 'Units of measurement, measuring length, types of motion: linear, circular, oscillatory, periodic.' },
  { id: 'sc-6', subject: 'Science', chapter: 6, name: 'Unit 6: Materials Around Us', context: 'Properties of materials, solubility, transparency, conductivity, uses of different materials.' },
  { id: 'sc-7', subject: 'Science', chapter: 7, name: 'Unit 7: Temperature and its Measurement', context: 'Concept of temperature, thermometers, scales of temperature, heat transfer, body temperature.' },
  { id: 'sc-8', subject: 'Science', chapter: 8, name: 'Unit 8: A Journey through States of Water', context: 'States of water: solid, liquid, gas. Evaporation, condensation, water cycle, melting, and boiling.' },
  { id: 'sc-9', subject: 'Science', chapter: 9, name: 'Unit 9: Methods of Separation in Everyday Life', context: 'Separation methods: sieving, filtration, evaporation, distillation, magnetic separation, handpicking.' },
  { id: 'sc-10', subject: 'Science', chapter: 10, name: 'Unit 10: Living Creatures: Exploring their Characteristics', context: 'Characteristics of living organisms: nutrition, respiration, growth, reproduction, response to stimuli.' },
  { id: 'sc-11', subject: 'Science', chapter: 11, name: "Unit 11: Nature's Treasures", context: 'Natural resources: air, water, soil, minerals, forests. Conservation and sustainable use of resources.' },
  { id: 'sc-12', subject: 'Science', chapter: 12, name: 'Unit 12: Beyond Earth', context: 'Universe, solar system, planets, stars, moon, satellites, space exploration.' },
];

/* SOCIAL SCIENCE -- NCERT Class 6 */

const socialScienceChapters: ChapterInfo[] = [
  { id: 'ss-1', subject: 'Social Science', chapter: 1, name: 'Unit 1: Locating Places on the Earth', context: 'Latitude and longitude, globe, maps, coordinates, finding locations on Earth.' },
  { id: 'ss-2', subject: 'Social Science', chapter: 2, name: 'Unit 2: Oceans and Continents', context: 'Seven continents, five oceans, distribution of land and water on Earth, physical features.' },
  { id: 'ss-3', subject: 'Social Science', chapter: 3, name: 'Unit 3: Landforms and Life', context: 'Mountains, plains, plateaus, rivers, effect of landforms on human life and settlement.' },
  { id: 'ss-4', subject: 'Social Science', chapter: 4, name: 'Unit 4: Timeline and Sources of History', context: 'Historical timelines, BCE/CE, primary and secondary sources of history, archaeological sources.' },
  { id: 'ss-5', subject: 'Social Science', chapter: 5, name: 'Unit 5: India, That Is Bharat', context: 'Location of India, physical features, neighbouring countries, diversity of India.' },
  { id: 'ss-6', subject: 'Social Science', chapter: 6, name: 'Unit 6: The Beginnings of Indian Civilisation', context: 'Indus Valley Civilisation, Harappa, Mohenjo-daro, urban planning, trade, culture.' },
  { id: 'ss-7', subject: 'Social Science', chapter: 7, name: "Unit 7: India's Cultural Roots", context: 'Vedic period, Upanishads, Buddhism, Jainism, cultural traditions of ancient India.' },
  { id: 'ss-8', subject: 'Social Science', chapter: 8, name: 'Unit 8: Unity in Diversity', context: "India's diversity in language, religion, food, clothing, festivals. Unity in diversity." },
  { id: 'ss-9', subject: 'Social Science', chapter: 9, name: 'Unit 9: Family and Community', context: 'Types of families, social institutions, community, roles and responsibilities, social relationships.' },
  { id: 'ss-10', subject: 'Social Science', chapter: 10, name: 'Unit 10: Grassroots Democracy - Part 1: Governance', context: 'Democratic governance, panchayati raj, local self-government, elections and representation.' },
  { id: 'ss-11', subject: 'Social Science', chapter: 11, name: 'Unit 11: Grassroots Democracy - Part 2: Local Government in Rural Areas', context: 'Gram panchayat, gram sabha, village development, rural local governance.' },
  { id: 'ss-12', subject: 'Social Science', chapter: 12, name: 'Unit 12: Grassroots Democracy - Part 3: Local Government in Urban Areas', context: 'Municipal corporation, municipality, town panchayat, urban local governance, civic services.' },
  { id: 'ss-13', subject: 'Social Science', chapter: 13, name: 'Unit 13: The Value of Work', context: 'Dignity of labour, types of work, formal and informal work, gender and work, importance of all types of work.' },
  { id: 'ss-14', subject: 'Social Science', chapter: 14, name: 'Unit 14: Economic Activities Around Us', context: 'Primary, secondary and tertiary economic activities, markets, trade, livelihoods.' },
];

/* HINDI -- NCERT Class 6 (Vasant) */

const hindiChapters: ChapterInfo[] = [
  { id: 'hi-1', subject: 'Hindi', chapter: 1, name: 'Unit 1: मातृभूमि (कविता)', context: 'मातृभूमि के प्रति प्रेम और गौरव की कविता। कवि: सोहनलाल द्विवेदी। विषय: देशप्रेम, राष्ट्रभक्ति, प्रकृति का वर्णन।' },
  { id: 'hi-2', subject: 'Hindi', chapter: 2, name: 'Unit 2: गोल (संस्मरण)', context: 'मेजर ध्यानचंद के जीवन पर आधारित संस्मरण। विषय: खेल भावना, दृढ़ता, राष्ट्रीय गौरव।' },
  { id: 'hi-3', subject: 'Hindi', chapter: 3, name: 'Unit 3: पहली बूंद (कविता)', context: 'बारिश की पहली बूंद पर आधारित काव्य। कवि: गोपालकृष्ण कौल। विषय: प्रकृति, वर्षा, आनंद।' },
  { id: 'hi-4', subject: 'Hindi', chapter: 4, name: 'Unit 4: हार की जीत (कहानी)', context: 'एक प्रेरणादायक कहानी जिसमें हार में भी जीत का संदेश है। लेखक: सुदर्शन। विषय: नैतिकता, त्याग, सच्ची विजय।' },
  { id: 'hi-5', subject: 'Hindi', chapter: 5, name: 'Unit 5: रहीम के दोहे', context: 'अब्दुर्रहीम खानखाना द्वारा रचित दोहे। विषय: जीवन के व्यावहारिक सत्य, नीति, मित्रता, परोपकार।' },
  { id: 'hi-6', subject: 'Hindi', chapter: 6, name: 'Unit 6: मेरी माँ (आत्मकथा)', context: 'रामप्रसाद बिस्मिल की आत्मकथा पर आधारित पाठ। विषय: माँ का महत्व, बलिदान, स्वतंत्रता संग्राम।' },
  { id: 'hi-7', subject: 'Hindi', chapter: 7, name: 'Unit 7: जलाते चलो (कविता)', context: 'द्वारिका प्रसाद माहेश्वरी की कविता। विषय: निरंतर प्रयास, ज्ञान का प्रकाश फैलाना, उत्साह।' },
  { id: 'hi-8', subject: 'Hindi', chapter: 8, name: 'Unit 8: सत्रिया और बिहू नृत्य (निबंध)', context: 'असम के पारम्परिक नृत्य सत्रिया और बिहू का परिचय। लेखक: जया मेहता। विषय: भारतीय नृत्य परंपरा, लोक संस्कृति।' },
  { id: 'hi-9', subject: 'Hindi', chapter: 9, name: 'Unit 9: मैया मैं नहीं माखन खायो (पद)', context: 'सूरदास का भक्ति पद। विषय: श्रीकृष्ण की बाल लीला, वात्सल्य रस, भक्ति भाव।' },
  { id: 'hi-10', subject: 'Hindi', chapter: 10, name: 'Unit 10: परीक्षा (कहानी)', context: 'प्रेमचंद की कहानी। विषय: ईमानदारी, नैतिक परीक्षा, सच्चाई की जीत।' },
  { id: 'hi-11', subject: 'Hindi', chapter: 11, name: 'Unit 11: चेतक की वीरता (कविता)', context: 'श्यामनारायण पांडेय की वीर रस की कविता। विषय: महाराणा प्रताप का घोड़ा चेतक, वीरता, बलिदान।' },
  { id: 'hi-12', subject: 'Hindi', chapter: 12, name: 'Unit 12: हिंद महासागर में छोटा-सा हिंदुस्तान', context: 'रामधारी सिंह दिनकर की यात्रा वृत्तांत। विषय: प्रवासी भारतीय, भारतीय संस्कृति, हिंद महासागर।' },
  { id: 'hi-13', subject: 'Hindi', chapter: 13, name: 'Unit 13: पेड़ की बात (निबंध)', context: 'जगदीशचंद्र बसु का निबंध। विषय: पेड़-पौधों में जीवन, प्रकृति का महत्व, पर्यावरण।' },
];

export const CHAPTER_DATA: Record<Subject, ChapterInfo[]> = {
  English: englishChapters,
  Maths: mathsChapters,
  Science: scienceChapters,
  Hindi: hindiChapters,
  'Social Science': socialScienceChapters,
};

export const ALL_CHAPTERS: ChapterInfo[] = [...englishChapters, ...mathsChapters, ...scienceChapters, ...hindiChapters, ...socialScienceChapters];
