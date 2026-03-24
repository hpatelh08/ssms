/**
 * data/englishUnits.ts
 * English syllabus units for Class 6 (Poorvi)
 * Each unit has a YouTube video link + embed ID for inline player.
 */

export interface UnitEntry {
  id: string;
  title: string;
  url: string;
  embedId: string;
}

function extractYTId(url: string): string {
  const short = url.match(/youtu\.be\/([^?&]+)/);
  if (short) return short[1];
  const long = url.match(/[?&]v=([^?&]+)/);
  if (long) return long[1];
  return '';
}

export const englishUnits: UnitEntry[] = [
  {
    id: 'en_unit1_bottle_dew_p1',
    title: 'Unit 1: A Bottle of Dew - Explanation Part 1',
    url: 'https://youtu.be/i6DJ3LmL78c?si=8O_lMtp6sbgZxdsp',
    embedId: extractYTId('https://youtu.be/i6DJ3LmL78c?si=8O_lMtp6sbgZxdsp'),
  },
  {
    id: 'en_unit1_bottle_dew_p2',
    title: 'Unit 1: A Bottle of Dew - Explanation Part 2',
    url: 'https://youtu.be/RIJq3hqJlTc?si=xfTIgYejPoFoQOtD',
    embedId: extractYTId('https://youtu.be/RIJq3hqJlTc?si=xfTIgYejPoFoQOtD'),
  },
  {
    id: 'en_unit1_bottle_dew_qa1',
    title: 'Unit 1: A Bottle of Dew - Q&A Part 1',
    url: 'https://youtu.be/U5stebP5i8Q?si=R0gT6s94CAuXw5uF',
    embedId: extractYTId('https://youtu.be/U5stebP5i8Q?si=R0gT6s94CAuXw5uF'),
  },
  {
    id: 'en_unit1_raven_fox',
    title: 'Unit 1: The Raven and the Fox - Explanation',
    url: 'https://youtu.be/LhWtgTdygpc?si=xxy2P8BZeF4KDMFK',
    embedId: extractYTId('https://youtu.be/LhWtgTdygpc?si=xxy2P8BZeF4KDMFK'),
  },
  {
    id: 'en_unit1_raven_fox_qa',
    title: 'Unit 1: The Raven and the Fox - Q&A',
    url: 'https://youtu.be/s5oS3nXZ8AE?si=5z1UY2HbnUJvKYu6',
    embedId: extractYTId('https://youtu.be/s5oS3nXZ8AE?si=5z1UY2HbnUJvKYu6'),
  },
  {
    id: 'en_unit1_rama_rescue_p1',
    title: 'Unit 1: Rama to the Rescue - Part 1',
    url: 'https://youtu.be/18bD6mfZit8?si=2L9sJcRFRteDIl3p',
    embedId: extractYTId('https://youtu.be/18bD6mfZit8?si=2L9sJcRFRteDIl3p'),
  },
  {
    id: 'en_unit2_unlikely_friends_p1',
    title: 'Unit 2: The Unlikely Best Friends - Part 1',
    url: 'https://youtu.be/3ELIuSldRcQ?si=SwzSb9Ov-rqDowFp',
    embedId: extractYTId('https://youtu.be/3ELIuSldRcQ?si=SwzSb9Ov-rqDowFp'),
  },
  {
    id: 'en_unit2_friends_prayer',
    title: "Unit 2: A Friend's Prayer",
    url: 'https://youtu.be/D8I89vf5Ugs?si=KgbGzQLW5fXf16VG',
    embedId: extractYTId('https://youtu.be/D8I89vf5Ugs?si=KgbGzQLW5fXf16VG'),
  },
  {
    id: 'en_unit2_chair',
    title: 'Unit 2: The Chair - Explanation',
    url: 'https://youtu.be/soXvxIbsXOw?si=OpzXfWxRibFvW771',
    embedId: extractYTId('https://youtu.be/soXvxIbsXOw?si=OpzXfWxRibFvW771'),
  },
  {
    id: 'en_unit3_neem_baba',
    title: 'Unit 3: Neem Baba - Explanation',
    url: 'https://youtu.be/W4t0O2_v9ZE?si=lMZq0WXx19DpnB_3',
    embedId: extractYTId('https://youtu.be/W4t0O2_v9ZE?si=lMZq0WXx19DpnB_3'),
  },
  {
    id: 'en_unit3_bird_thought',
    title: 'Unit 3: What a Bird Thought - Explanation',
    url: 'https://youtu.be/9QCjbsvrI_g?si=G-8RqNIiVxdbQaMy',
    embedId: extractYTId('https://youtu.be/9QCjbsvrI_g?si=G-8RqNIiVxdbQaMy'),
  },
  {
    id: 'en_unit3_spices',
    title: 'Unit 3: Spices that Heal Us - Explanation',
    url: 'https://youtu.be/_xJi5ZzxCKI?si=pr5tLjDrKveDtqXT',
    embedId: extractYTId('https://youtu.be/_xJi5ZzxCKI?si=pr5tLjDrKveDtqXT'),
  },
  {
    id: 'en_unit4_change_heart_p1',
    title: 'Unit 4: Change of Heart - Explanation Part 1',
    url: 'https://youtu.be/51dh_puziCs?si=fcwUpeD7yKwEbR5a',
    embedId: extractYTId('https://youtu.be/51dh_puziCs?si=fcwUpeD7yKwEbR5a'),
  },
  {
    id: 'en_unit4_change_heart_p2',
    title: 'Unit 4: Change of Heart - Explanation Part 2',
    url: 'https://youtu.be/0n2erASVaLg?si=4MlEMt-bEdeY0Pdp',
    embedId: extractYTId('https://youtu.be/0n2erASVaLg?si=4MlEMt-bEdeY0Pdp'),
  },
  {
    id: 'en_unit4_winner_p1',
    title: 'Unit 4: The Winner - Explanation Part 1',
    url: 'https://youtu.be/KSvj1rqgG4o?si=iARcVKaJ6kYftsjt',
    embedId: extractYTId('https://youtu.be/KSvj1rqgG4o?si=iARcVKaJ6kYftsjt'),
  },
  {
    id: 'en_unit4_winner_p2',
    title: 'Unit 4: The Winner - Explanation Part 2',
    url: 'https://youtu.be/-jMgg1BzAk0?si=gbHB3PLzO318swGy',
    embedId: extractYTId('https://youtu.be/-jMgg1BzAk0?si=gbHB3PLzO318swGy'),
  },
  {
    id: 'en_unit4_yoga_p1',
    title: 'Unit 4: Yoga - A Way of Life - Part 1',
    url: 'https://youtu.be/atL0_ADmbpc?si=c3u-iYnrUZHb8_aY',
    embedId: extractYTId('https://youtu.be/atL0_ADmbpc?si=c3u-iYnrUZHb8_aY'),
  },
  {
    id: 'en_unit4_yoga_p2',
    title: 'Unit 4: Yoga - A Way of Life - Part 2',
    url: 'https://youtu.be/V3s7b_w8WYo?si=jC9mWaPJGVSJ7POU',
    embedId: extractYTId('https://youtu.be/V3s7b_w8WYo?si=jC9mWaPJGVSJ7POU'),
  },
  {
    id: 'en_unit5_hamara_bharat_p1',
    title: 'Unit 5: Hamara Bharat - Incredible India! Part 1',
    url: 'https://youtu.be/gQJMYsW30eM?si=QXFo5dCOdZxNuCFM',
    embedId: extractYTId('https://youtu.be/gQJMYsW30eM?si=QXFo5dCOdZxNuCFM'),
  },
  {
    id: 'en_unit5_hamara_bharat_p2',
    title: 'Unit 5: Hamara Bharat - Incredible India! Part 2',
    url: 'https://youtu.be/1XSvf-gVqe8?si=VwFM55mVSEf0HBhS',
    embedId: extractYTId('https://youtu.be/1XSvf-gVqe8?si=VwFM55mVSEf0HBhS'),
  },
  {
    id: 'en_unit5_kites',
    title: 'Unit 5: The Kites - Explanation',
    url: 'https://youtu.be/7Zuw0Lb2fzE?si=-1_q4MXQN6zHi3zQ',
    embedId: extractYTId('https://youtu.be/7Zuw0Lb2fzE?si=-1_q4MXQN6zHi3zQ'),
  },
  {
    id: 'en_unit5_ila_sachani',
    title: 'Unit 5: Ila Sachani - Embroidering Dreams',
    url: 'https://youtu.be/HN2trC_4dE4?si=EBNHdfSSLPe3KiaB',
    embedId: extractYTId('https://youtu.be/HN2trC_4dE4?si=EBNHdfSSLPe3KiaB'),
  },
  {
    id: 'en_unit5_war_memorial',
    title: 'Unit 5: National War Memorial',
    url: 'https://youtu.be/dlpfv01s3Vc?si=2vt69isFkJ-foaY_',
    embedId: extractYTId('https://youtu.be/dlpfv01s3Vc?si=2vt69isFkJ-foaY_'),
  },
];
