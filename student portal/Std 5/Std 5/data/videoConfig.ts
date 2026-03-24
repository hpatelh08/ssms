/**
 * data/videoConfig.ts
 * Video learning data for AI Buddy - English, Maths, EVS, Hindi, Gujarati.
 * Each video has a YouTube URL, title, and topic context
 * for RAG-grounded AI queries. Aligned to NCERT / GSEB Std 5.
 */

export type VideoSubject = 'English' | 'Maths' | 'Science' | 'Hindi' | 'Gujarati';

export interface VideoEntry {
  id: string;
  title: string;
  url: string;
  /** Extracted YouTube video ID for embedding */
  embedId: string;
  /** Context hint for AI grounding */
  context: string;
}

/* -- Helper to extract YouTube embed ID -- */

function extractYTId(url: string): string {
  const short = url.match(/youtu\.be\/([^?&]+)/);
  if (short) return short[1];
  const long = url.match(/[?&]v=([^?&]+)/);
  if (long) return long[1];
  return '';
}

function v(id: string, title: string, url: string, context: string): VideoEntry {
  return { id, title, url, embedId: extractYTId(url), context };
}

/* ---- ENGLISH VIDEOS (NCERT Marigold / Santoor Std 5) ---- */

export const englishVideos: VideoEntry[] = [
  v('papas_spectacles', "Papa's Spectacles", 'https://youtu.be/a7edy5J8ihk?si=nIKE2L7rqddmptZX',
    "Story about Papa's spectacles and family life. Reading comprehension, family vocabulary. Unit 1 - Let's Have Fun. Std 5 English."),
  v('gone_with_scooter', 'Gone with the Scooter', 'https://youtu.be/m3DGaWYUB60?si=JWDxbjDJG3Fbld5o',
    "Story about a scooter ride and adventure. Action verbs, narrative comprehension. Unit 1 - Let's Have Fun. Std 5 English."),
  v('the_rainbow', 'The Rainbow', 'https://youtu.be/EcOFwtgYj1Q',
    'Poem about the rainbow and colours in nature. Colour vocabulary, poetic expression. Unit 2 - My Colourful World. Std 5 English.'),
  v('wise_parrot', 'The Wise Parrot', 'https://youtu.be/wME8kYe3Noo?si=9ieMlc9gFwyQkrOG',
    'Story about a wise parrot with a moral lesson. Animal vocabulary, wisdom. Unit 2 - My Colourful World. Std 5 English.'),
  v('the_frog', 'The Frog', 'https://youtu.be/Jua19hf-0XI?si=RP8KXWhhW30rW6kv',
    'Poem about a frog and water. Nature vocabulary, rhymes, poetic language. Unit 3 - Water. Std 5 English.'),
  v('what_a_tank', 'What a Tank!', 'https://youtu.be/QKnfgkvKwo0?si=hPGoJoSnfQ10vmy0',
    'Story about water tanks and conservation. Water vocabulary, environmental awareness. Unit 3 - Water. Std 5 English.'),
  v('gilli_danda', 'Gilli Danda', 'https://youtu.be/EnozmxSChb0?si=m1gFu5AAyRbk8kZN',
    'Story about the traditional Indian game Gilli Danda. Sports vocabulary, culture. Unit 4 - Ups and Downs. Std 5 English.'),
  v('decision_panchayat', 'The Decision of the Panchayat', 'https://youtu.be/t2NWg8cosTc?si=gItAqUbJ1lcKUg5b',
    'Story about how a panchayat makes a fair decision. Civics, justice, community vocabulary. Unit 4 - Ups and Downs. Std 5 English.'),
  v('vocation', 'Vocation', 'https://youtu.be/A0a4mHXJ8k0?si=32Fjuunvk9egNkJx',
    'Poem about different occupations and work. Occupations vocabulary, values of labour. Unit 5 - Work is Worship. Std 5 English.'),
  v('glass_bangles', 'Glass Bangles', 'https://youtu.be/AWAcu6e5eaE?si=hG8E1Rt1JHR18URM',
    'Story about the artisan craft of glass bangles. Craft vocabulary, cultural heritage. Unit 5 - Work is Worship. Std 5 English.'),
];

/* ---- MATHS VIDEOS (NCERT Maths Mela / Math-Magic Std 5) ---- */

export const mathsVideos: VideoEntry[] = [
  v('travellers_1', 'We the Travellers — I', 'https://youtu.be/TdhSc4kncxU?si=KXMjMG3JvZazySQ4',
    'Large numbers, place value up to lakhs and crores, reading and writing large numbers for Std 5 Maths.'),
  v('fractions', 'Fractions', 'https://youtu.be/DKanWcCq1B4?si=VF0pTEJ_QK7x7XZJ',
    'Types of fractions, equivalent fractions, comparing fractions, addition and subtraction of fractions for Std 5 Maths.'),
  v('angles_turns', 'Angles as Turns', 'https://youtu.be/QqOfRsMg8Z4?si=e6-vTurXgD8I00sl',
    'Understanding angles as amounts of turn, measuring angles in degrees, right angles for Std 5 Maths.'),
  v('travellers_2', 'We the Travellers — II', 'https://youtu.be/3iH8Ll6SgN4?si=M0l5PVtaiIrpdTOE',
    'Multiplication of large numbers, division with large numbers, factors, multiples for Std 5 Maths.'),
  v('far_near', 'Far and Near', 'https://youtu.be/aOVAqXL5VOw?si=3PlobdhNqEiuWakx',
    'Mental maths strategies, estimation and approximation, rounding numbers, distance and scale for Std 5 Maths.'),
  v('dairy_farm', 'The Dairy Farm', 'https://youtu.be/p73f7vI9nGc?si=iZ6efvB9_9hX19PA',
    'Decimals introduction, decimal place value, reading and writing decimals, comparing decimals for Std 5 Maths.'),
  v('shapes_patterns', 'Shapes and Patterns', 'https://youtu.be/XxBl3Y1sJZY?si=uWRrqdhgLZ8RS_Z0',
    '2D and 3D shapes, tessellations, geometric patterns, area and perimeter for Std 5 Maths.'),
  v('weight_capacity', 'Weight and Capacity', 'https://youtu.be/6M8U69U-IWo?si=HU9wh72d5jTy3smi',
    'Metric units of weight and capacity, gram-kilogram, millilitre-litre, conversion for Std 5 Maths.'),
  v('coconut_farm', 'Coconut Farm', 'https://youtu.be/T1t0lp0sIRk?si=DckAGdUmNf2jfUzT',
    'Average, introduction to percentages, problem solving with averages for Std 5 Maths.'),
  v('symmetrical', 'Symmetrical Designs', 'https://youtu.be/fAsiIdZhMAA?si=NtLt9om_UC4EZgbY',
    'Lines of symmetry, rotational symmetry, reflective symmetry in shapes for Std 5 Maths.'),
  v('grandma_quilt', "Grandmother's Quilt", 'https://youtu.be/w9ffa3yKLZA?si=Sz_5nhfYCLm-h96j',
    'Area of irregular shapes, perimeter activities, fractions and area for Std 5 Maths.'),
  v('racing_seconds', 'Racing Seconds', 'https://youtu.be/tZ-WD9kvr94?si=zHe_Vn0v3wx3MIHQ',
    'Time measurement, seconds-minutes-hours, elapsed time, timetables for Std 5 Maths.'),
  v('animal_jumps', 'Animal Jumps', 'https://youtu.be/_myVbbc-twI?si=MMHa8Z8IivyDm1VJ',
    'Introduction to integers, positive and negative numbers, number line for Std 5 Maths.'),
  v('maps_locations', 'Maps and Locations', 'https://youtu.be/ThLxNcoeuFE?si=WrPmeuB-m8pKn71N',
    'Grid references, coordinates, reading map scales, directions, distances for Std 5 Maths.'),
  v('data_pictures', 'Data Through Pictures', 'https://youtu.be/Mj0S7VxuVsE?si=zUsAkITpy9JXgp3_',
    'Data collection and organisation, pictographs, bar graphs, pie charts for Std 5 Maths.'),
];

/* ---- SCIENCE VIDEOS (NCERT EVS - Looking Around Std 5) ---- */

export const scienceVideos: VideoEntry[] = [
  v('water_essence', 'Water: The Essence of Life', 'https://youtu.be/0vvWmjEdTxU',
    'Water cycle, sources of water, importance of water, water conservation. Unit 1 - Life Around Us. Std 5 EVS.'),
  v('journey_river', 'Journey of a River', 'https://youtu.be/Yye2_nUWmII',
    'River systems, flow of water, erosion and deposition, rivers and human settlements. Unit 1 - Life Around Us. Std 5 EVS.'),
  v('mystery_food', 'The Mystery of Food', 'https://youtu.be/KFQ3xOYnzpM',
    'Photosynthesis, food chains, nutrition in plants and animals, balanced diet. Unit 2 - Health. Std 5 EVS.'),
  v('our_school', 'Our School: A Happy Place', 'https://youtu.be/SKg0MKLm-gI',
    'School environment, safety and hygiene, collaboration and community. Unit 2 - Health. Std 5 EVS.'),
  v('vibrant_country', 'Our Vibrant Country', 'https://youtu.be/dbniKiwT6dA',
    'Cultural diversity, states of India, festivals, traditions, unity in diversity. Unit 3 - Incredible India. Std 5 EVS.'),
  v('unique_places', 'Some Unique Places', 'https://youtu.be/X7lm8_uGgSI',
    'Heritage sites, geographical wonders, biodiversity hotspots, conservation. Unit 3 - Incredible India. Std 5 EVS.'),
  v('energy_work', 'Energy: How Things Work', 'https://youtu.be/V9tQxm71qQg',
    'Sources of energy, renewable and non-renewable energy, electricity, simple machines. Unit 4 - Things Around Us. Std 5 EVS.'),
  v('clothes_made', 'Clothes: How Things are Made', 'https://youtu.be/PjAyz8KB7VY',
    'Textile fibers, weaving and spinning, cotton and silk production. Unit 4 - Things Around Us. Std 5 EVS.'),
  v('rhythms_nature', 'Rhythms of Nature', 'https://youtu.be/jlgFqdX1KUk',
    'Seasons, Earth revolution, day and night, weather patterns, natural cycles. Unit 5 - Our Planet. Std 5 EVS.'),
  v('earth_home', 'Earth: Our Shared Home', 'https://youtu.be/I_A6DrZ--nM',
    'Environmental conservation, ecosystems, biodiversity, pollution, responsibility. Unit 5 - Our Planet. Std 5 EVS.'),
];

/* ---- HINDI VIDEOS (NCERT Veena Std 5) ---- */

export const hindiVideos: VideoEntry[] = [
  v('kiran', 'किरण', 'https://youtu.be/5OLhbq2ot84',
    'किरण की कहानी - चरित्र, वर्णनात्मक लेखन, पठन बोध। Veena Class 5 Chapter 1.'),
  v('nyay_kursi', 'न्याय की कुर्सी', 'https://youtu.be/wlskl_YiRuM',
    'न्याय और नैतिक मूल्य की कहानी, संवाद। Veena Class 5 Chapter 2.'),
  v('chand_kurta', 'चाँद का कुरता', 'https://youtu.be/cMUb6VdxKfQ',
    'काव्य भाषा, रूपक और ताल की कविता। Veena Class 5 Chapter 3.'),
  v('sankken', 'साङकेन', 'https://youtu.be/2L1gOXgohtE',
    'संस्कृति और त्योहार पर आधारित कहानी। Veena Class 5 Chapter 4.'),
  v('sundariya', 'सुंदरीया', 'https://youtu.be/dX4gGCwc1MY',
    'विशेषण और प्रकृति शब्दावली की कहानी। Veena Class 5 Chapter 5.'),
  v('chatur_chitrkar', 'चतुर चित्रकार', 'https://youtu.be/5Rx2nBkmDuM',
    'चतुराई पर आधारित कहानी, शब्द भंडार और कथा लेखन। Veena Class 5 Chapter 6.'),
  v('mera_bachpan', 'मेरा बचपन', 'https://youtu.be/1crls-5aU6A',
    'आत्मकथा, भूतकाल और व्यक्तिगत लेखन। Veena Class 5 Chapter 7.'),
  v('kaziranga', 'काजीरंगा राष्ट्रीय उद्यान की यात्रा', 'https://youtu.be/VEwS1daT7dc',
    'यात्रा वर्णन और वन्यजीव शब्दावली। Veena Class 5 Chapter 8.'),
  v('nyay', 'न्याय', 'https://youtu.be/9G_Cq04Md0Q',
    'न्याय और नैतिक मूल्य, पठन बोध। Veena Class 5 Chapter 9.'),
  v('teen_machhliyan', 'तीन मछलियाँ', 'https://youtu.be/Z2uZIVJ-oe8',
    'लोककथा - बुद्धिमानी और योजना। Veena Class 5 Chapter 10.'),
  v('kalammandir', 'हमारे ये कलामंदिर', 'https://youtu.be/DGUiIPtN7Qg',
    'कला और सांस्कृतिक विरासत, कर्मवाच्य। Veena Class 5 Chapter 11.'),
];

/* ---- GUJARATI VIDEOS (GSEB Kukut Std 5) ---- */

export const gujaratiVideos: VideoEntry[] = [
  v('patanga_pai', 'પતંગા પાઈ', 'https://youtu.be/kesHZel062Q?si=GQl1LnlOzMD8Auwu',
    'પ્રકૃતિ, પતંગ અને કાવ્ય અભિવ્યક્તિ - GSEB Kukut Class 5 Chapter 1.'),
  v('tamaru_man', 'તમારું મન આપો', 'https://youtu.be/BOqRojEumE0?si=FAqV7y0Aa78YHcpw',
    'ધ્યાન, મન અને શીખવું - GSEB Kukut Class 5 Chapter 2.'),
  v('chha_pag', 'છ પગ ને બે પાંખ', 'https://youtu.be/xrg2Nn43sZM?si=0YLKcrndnKvdylE6',
    'કીડા, પ્રાણીઓ અને પ્રકૃતિ - GSEB Kukut Class 5 Chapter 3.'),
  v('aapsho_to', 'આપશો તો બતાવો', 'https://youtu.be/OL1fVnZoDUA?si=KKGKbfZIDUjAffBb',
    'સહયોગ, વહેંચણી અને સામાજિક મૂલ્ય - GSEB Kukut Class 5 Chapter 4.'),
  v('thandak_boltara', 'ઠંડક - બળતરા', 'https://youtu.be/RSnRGi9hvNQ?si=r_BrjSDk6Hsxj6yN',
    'વિરોધી શબ્દો, ઠંડી-ગરમી અને કાવ્ય ભાષા - GSEB Kukut Class 5 Chapter 5.'),
  v('jeevta_ho', 'જીવતા હો અને જીવો', 'https://youtu.be/iaBR8NVeenI?si=5ponDyw932rWBn4p',
    'જીવન, સ્વતંત્રતા અને નૈતિક મૂલ્ય - GSEB Kukut Class 5 Chapter 6.'),
  v('prashno_ma', 'પ્રશ્નોમાં પરાક્રમ', 'https://youtu.be/NCuqCgp-njc?si=rnuB7rz2dwgUhHju',
    'જિજ્ઞાસા, પ્રશ્ન અને સાહસ - GSEB Kukut Class 5 Chapter 7.'),
  v('chhoti_mungi', 'ચોટી મુંગી ઘૂઘૂઘૂ', 'https://youtu.be/blojJfw9LUw?si=9qdaqK6m9aVo_H4G',
    'કીડી, પ્રાણી અને રમૂજ - GSEB Kukut Class 5 Chapter 8.'),
  v('shubhratri', 'શુભ રાત્રી', 'https://youtu.be/xyeDjaHpWJA?si=bRU6irVjMZdHSMfX',
    'રાત, ઊંઘ અને સ્વપ્ન - GSEB Kukut Class 5 Chapter 9.'),
];

/* ---- COMBINED ---- */

export const VIDEO_DATA: Record<VideoSubject, VideoEntry[]> = {
  English: englishVideos,
  Maths: mathsVideos,
  Science: scienceVideos,
  Hindi: hindiVideos,
  Gujarati: gujaratiVideos,
};

export const ALL_VIDEOS: VideoEntry[] = [...englishVideos, ...mathsVideos, ...scienceVideos, ...hindiVideos, ...gujaratiVideos];
