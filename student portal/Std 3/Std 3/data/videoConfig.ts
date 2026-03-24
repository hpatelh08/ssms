/**
 * data/videoConfig.ts
 * Video learning data for AI Buddy - English, Maths, EVS & Hindi.
 * Each video has a YouTube URL, title, and topic context
 * for RAG-grounded AI queries. Aligned to NCERT Std 3.
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

/* ---- ENGLISH VIDEOS (English Reader Std 3) ---- */

export const englishVideos: VideoEntry[] = [
  v('colours', 'Colours', 'https://youtu.be/cs2FqNFsSBA?si=fOSOhAmM4ocoxlcF',
    'Story about colours, imagination and creativity for Std 3 English Unit 1.'),
  v('badal_moti', 'Badal and Moti', 'https://youtu.be/IcVqt7EipJE?si=CGHAQabtg98BziOl',
    'Story about friendship and pets - Badal and his dog Moti for Std 3 English Unit 1.'),
  v('best_friends', 'Best Friends', 'https://youtu.be/r8Y7nFR4_k8?si=S1k8JUZfK83zD3n1',
    'Story about companionship and values of friendship for Std 3 English Unit 1.'),
  v('out_in_garden', 'Out in the Garden', 'https://youtu.be/CnD24-a0BYs?si=uI9p1qaqz2ZkHba0',
    'Story about nature and playtime in the garden for Std 3 English Unit 2.'),
  v('talking_toys', 'Talking Toys', 'https://youtu.be/4fuzKU0Mz2E?si=DZ_4mmz_YokYIouQ',
    'Story about toys and imagination for Std 3 English Unit 2.'),
  v('paper_boats', 'Paper Boats', 'https://youtu.be/7En_cHX6i-0?si=I-Euo9Odz-S2PDQp',
    'Story about creativity and fun with paper boats for Std 3 English Unit 2.'),
  v('big_laddoo', 'The Big Laddoo', 'https://youtu.be/GcHLs8iHjIU?si=Ld7yO9ANDJm7U8Jk',
    'Story about sharing and sweets for Std 3 English Unit 3.'),
  v('thank_you', 'Thank You', 'https://youtu.be/R_DY1LJ3OsI?si=y-AiqfYW7FsBfanl',
    'Story about gratitude and values for Std 3 English Unit 3.'),
  v('madhus_wish', "Madhu's Wish", 'https://youtu.be/XdnRDTvvE9w?si=D_exHchgIdhnzEGH',
    'Story about dreams and kindness for Std 3 English Unit 3.'),
  v('night', 'Night', 'https://youtu.be/Ig6T7GJ2_rc?si=lXEKwu1vNe8H_FGm',
    'Poem about the night sky and wonder for Std 3 English Unit 4.'),
  v('chanda_mama', 'Chanda Mama Counts the Stars', 'https://youtu.be/URF-fsYWRRw?si=INHsTY0zCUIUXbuB',
    'Poem about the moon and stars for Std 3 English Unit 4.'),
  v('chandrayaan', 'Chandrayaan', 'https://youtu.be/f4Lx1QdK0Wc?si=AxKN6igFt83iV0-z',
    'Story about space exploration and Chandrayaan for Std 3 English Unit 4.'),
];

/* ---- MATHS VIDEOS (Math-Magic Std 3) ---- */

export const mathsVideos: VideoEntry[] = [
  v('whats_in_name', "What's in a Name?", 'https://youtu.be/qy02gULMTNE?si=oguFGvShiPRc09M4',
    'Number names, writing numbers in words, place value, ones-tens-hundreds for Std 3.'),
  v('toy_joy', 'Toy Joy', 'https://youtu.be/eEPj6hZQcUk?si=IHKK_jp17Qr3b_m0',
    'Counting toys, number sequences, comparing quantities, addition, subtraction for Std 3.'),
  v('double_century', 'Double Century', 'https://youtu.be/LRwm5hlCTFI?si=yGN5wVC-KxObb_lX',
    'Numbers up to 200, place value system, comparing numbers, ordering, skip counting for Std 3.'),
  v('nani_maa', 'Vacation With My Nani Maa', 'https://youtu.be/YzcCN0h7s0M?si=Tob4oyrPWKwCVCt-',
    'Addition with carrying, subtraction with borrowing, word problems, real-life math for Std 3.'),
  v('fun_shapes', 'Fun With Shapes', 'https://youtu.be/yhwYmqAIxs0?si=0d5IDajg1LPqG1vo',
    '2D shapes, 3D shapes, symmetry, patterns, geometry for Std 3.'),
  v('house_hundreds_1', 'House of Hundreds - 1', 'https://youtu.be/jOzEriAmFZs?si=rpxHj2JqSUyRA6wG',
    'Numbers 100-999, place value of hundreds, three-digit numbers, expanded form for Std 3.'),
  v('raksha_bandhan', 'Raksha Bandhan', 'https://youtu.be/KdF7zk1yfDc?si=V92I1tS5TcLEcF5a',
    'Multiplication introduction, repeated addition, multiplication tables 2-10, arrays for Std 3.'),
  v('fair_share', 'Fair Share', 'https://youtu.be/BZ2lAou0tRM?si=QU_xpyivj_VdGepQ',
    'Division basics, equal sharing, grouping, fair distribution, division by 2-10 for Std 3.'),
  v('house_hundreds_2', 'House of Hundreds - 2', 'https://youtu.be/sjzQCWoGYOc?si=HI71zEwLDieaFMjw',
    'Three-digit addition, three-digit subtraction, carrying and borrowing in hundreds for Std 3.'),
  v('class_party', 'Fun at Class Party', 'https://youtu.be/XbJxIwzBqRU?si=2OTIx1gwGaR9enkQ',
    'Pattern recognition, number sequences, shape patterns, growing patterns for Std 3.'),
  v('filling_lifting', 'Filling and Lifting', 'https://youtu.be/wQ2EfzYcUe8?si=xxjPaRBgGcVYzWZ_',
    'Capacity measurement, volume, liters-milliliters, weight, kilograms-grams for Std 3.'),
  v('give_and_take', 'Give and Take', 'https://youtu.be/-yUNT33A3i4?si=sxi12nBEUqIrwLw9',
    'Advanced addition-subtraction, mixed operations, problem solving, money transactions for Std 3.'),
  v('time_goes_on', 'Time Goes On', 'https://youtu.be/VzWVGdA8PTQ?si=pBgwK0UIbHagwhVR',
    'Reading clocks, telling time, hours-minutes-seconds, AM-PM, calendar for Std 3.'),
  v('surajkund_fair', 'The Surajkund Fair', 'https://youtu.be/YyzI9NVkoOw?si=4C7qZkjD_-xNP6If',
    'Money, Indian currency, rupees-paise, buying-selling, change calculation for Std 3.'),
];

/* ---- SCIENCE VIDEOS (EVS Std 3) ---- */

export const scienceVideos: VideoEntry[] = [
  v('family_friends', 'Family and Friends', 'https://youtu.be/NWc9oYOW7jE?si=54dwV8FhITdXBFxp',
    'Family bonds, friendship, social values for Std 3 EVS Unit 1.'),
  v('going_mela', 'Going to the Mela', 'https://youtu.be/GvQujzn4ddY?si=BDqUBwWr7OLhYaNs',
    'Community, fairs, social life for Std 3 EVS Unit 1.'),
  v('celebrating_festivals', 'Celebrating Festivals', 'https://youtu.be/Z2UGKY22H4Y?si=_6qdI5KxHAHyl8wM',
    'Traditions, culture, celebrations for Std 3 EVS Unit 1.'),
  v('know_plants', 'Getting to Know Plants', 'https://youtu.be/bAKhlrle0kQ?si=OmVtQStC2VF4GLK8',
    'Plant types, growth, observation for Std 3 EVS Unit 2.'),
  v('plants_animals', 'Plants and Animals Live Together', 'https://youtu.be/27BvrHZs8GA?si=I-JegHGzS22hpWNb',
    'Ecosystem, interdependence, balance for Std 3 EVS Unit 2.'),
  v('living_harmony', 'Living in Harmony', 'https://youtu.be/6-VG7Yl6hpo?si=AkeYiObBdVfpcUA9',
    'Cooperation, environment, peaceful living for Std 3 EVS Unit 2.'),
  v('water_precious', 'Water — A Precious Gift', 'https://youtu.be/5s9-zLvhGsc?si=TFSMLtEn63CzUnTG',
    'Water sources, importance, conservation for Std 3 EVS Unit 3.'),
  v('food_we_eat', 'Food We Eat', 'https://youtu.be/8lLLP4aAVJU?si=WksGbWpPQRZ4Jo0x',
    'Nutrition, food habits, healthy living for Std 3 EVS Unit 3.'),
  v('healthy_happy', 'Staying Healthy and Happy', 'https://youtu.be/nRFjJIO08Kg?si=8AvjKm0gd8dEMUk_',
    'Hygiene, exercise, wellness for Std 3 EVS Unit 3.'),
  v('world_of_things', 'This World of Things', 'https://youtu.be/68uXr_kMpd8?si=67xZCeUyr0o06xdl',
    'Objects, materials, daily use for Std 3 EVS Unit 4.'),
  v('making_things', 'Making Things', 'https://youtu.be/dcpdtA4cJLM?si=hnU0CSXmF4kvhRdx',
    'Creativity, craft, construction for Std 3 EVS Unit 4.'),
  v('charge_of_waste', 'Taking Charge of Waste', 'https://youtu.be/nqD19H5ZwuE?si=BewCVA7sK8zCqnir',
    'Waste management, recycling, responsibility for Std 3 EVS Unit 4.'),
];

/* ---- HINDI VIDEOS (NCERT Veena Std 3) ---- */

export const hindiVideos: VideoEntry[] = [
  v('seekho', 'सीखो', 'https://youtu.be/bZVs6WDYoeI?si=8VXrL05iOsC8Sc_f',
    'कविता about learning and knowledge for Std 3 Hindi Unit 1.'),
  v('cheenti', 'चींटी', 'https://youtu.be/hRQW2aoMev8?si=jul-cIed4Wimv0Lp',
    'Story about ants, nature and animals for Std 3 Hindi Unit 1.'),
  v('kitne_pair', 'कितने पैर?', 'https://youtu.be/GLbC4XoVLjQ?si=SQXvQWy_fSUmQhAo',
    'Story about counting animal legs for Std 3 Hindi Unit 1.'),
  v('baya_rani', 'बया हमारी चिड़िया रानी!', 'https://youtu.be/Wkv74hn6SiM?si=5lepXTKJnfodLfZF',
    'Story about weaver bird and nature for Std 3 Hindi Unit 1.'),
  v('aam_ka_ped', 'आम का पेड़', 'https://youtu.be/SDkcryWvk84?si=GGr14IzB04f_7ONk',
    'Story about mango tree, fruits and nature for Std 3 Hindi Unit 1.'),
  v('birbal_khichdi', 'बीरबल की खिचड़ी', 'https://youtu.be/fXAN16c89Qk?si=dYKKsskDueTn82Ro',
    'Birbal story about intelligence and humor for Std 3 Hindi Unit 2.'),
  v('mitra_ko_patra', 'मित्र को पत्र', 'https://youtu.be/tkmG86jIZb8?si=PbjPswYcCW7Wqbh2',
    'Story about friendship and letter writing for Std 3 Hindi Unit 2.'),
  v('chatur_gidar', 'चतुर गीदड़', 'https://youtu.be/8JScgQopCmE?si=eNGUCz0izLrTeq9R',
    'Story about clever jackal for Std 3 Hindi Unit 2.'),
  v('phuldei', 'प्रकृति पर्व — फूलदेई', 'https://youtu.be/7YSwZ30D470?si=NvTesEXpHCJ9wYT5',
    'Story about Phuldei festival and culture for Std 3 Hindi Unit 2.'),
  v('rassakashi', 'रस्साकशी', 'https://youtu.be/GfjVN1GGU88?si=vfa2vjWX2DnPJOII',
    'Story about tug of war and teamwork for Std 3 Hindi Unit 3.'),
  v('jadui_pitara', 'एक जादुई पिटारा', 'https://youtu.be/q2TsJAIcg0s?si=xiv-VKQ-dn0NnIgY',
    'Story about magic box and imagination for Std 3 Hindi Unit 3.'),
  v('apna_kaam', 'अपना-अपना काम', 'https://youtu.be/J-FQ9vu0Zdw?si=5ClsmOP72C31h5eR',
    'Story about work and responsibility for Std 3 Hindi Unit 4.'),
  v('timakka', 'पेड़ों की अम्मा \'तिमक्का\'', 'https://youtu.be/knCzWGqoN0c?si=eYv_KuUlZYmgY8Ae',
    'Inspiring story about Saalumarada Timakka and environment for Std 3 Hindi Unit 4.'),
  v('kisan_hoshiyari', 'किसान की होशियारी', 'https://youtu.be/S5-pR1G7ly8?si=WJ-Oqp1ARc2zPKGL',
    'Story about farmer\'s wisdom for Std 3 Hindi Unit 4.'),
  v('bharat', 'भारत', 'https://youtu.be/nf3_mzrAiQs?si=mYHgFbA0aiqV0BNQ',
    'Poem about patriotism and India for Std 3 Hindi Unit 5.'),
  v('chandrayaan', 'चंद्रयान (संवाद)', 'https://youtu.be/IiXeAK4jUk0?si=mqikdaADJGvog1gq',
    'Dialogue about Chandrayaan and space science for Std 3 Hindi Unit 5.'),
  v('bolne_wali_moond', 'बोलने वाली मूँद', 'https://youtu.be/z6d5AN0tSy8?si=4Rt_cSM6KCC6BO3K',
    'Imaginative story about talking radish for Std 3 Hindi Unit 5.'),
  v('ham_anek', 'हम अनेक किन्तु एक', 'https://youtu.be/Yfb3lBmR4fc?si=owt5rjEcX9T8d_bv',
    'Poem about unity in diversity for Std 3 Hindi Unit 5.'),
];

/* ---- GUJARATI (GSEB Mayur Std 3) ---- */

const gujaratiVideos: VideoEntry[] = [
  v('nak_kan_vagar_ga', 'નાક-કાન વગર ગા', 'https://youtu.be/88lv57KNvNM?si=gW9FXlaxsZS0i4iJ',
    'Gujarati story about imagination and humor.'),
  v('naraj_vanraj', 'નારાજ વનરાજ', 'https://youtu.be/wy2PfHbwjio?si=vEksmwdI4XFOMxYl',
    'Gujarati story about nature and animals.'),
  v('makan_vagar_vanar', 'મકાન વગરના વાનર', 'https://youtu.be/oJ8TZBnn_fY?si=0bJ4Z4FoVMqes5uf',
    'Gujarati story about animals and lifestyle.'),
  v('lalkanne_khai_gai', 'લાલકણને ખાઈ ગઈ બાજરી', 'https://youtu.be/1JTxyu2xxDc?si=2-_NuBELf32LAre1',
    'Gujarati folk tale about food.'),
  v('tinu_tamtamtu_geet', 'તીનું તમતમતું ગીત', 'https://youtu.be/E49SZH55Pm0?si=Us9nueTQC44kVQCe',
    'Gujarati poem about music and joy.'),
  v('marji_bano_maja_karo', 'મરજી બનો, મઝા કરો', 'https://youtu.be/ZUYyyCwK1xQ?si=LHLw335wAblmw-m2',
    'Gujarati story about friendship and fun.'),
  v('miyau_miyau', 'મિયાંઉ...મિયાંઉ, અહી આવ', 'https://youtu.be/Ha37-ydFrLc?si=AJdn-4uROglAkkSK',
    'Gujarati story about animals and humor.'),
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
