/**
 * data/videoConfig.ts
 * Video learning data for AI Buddy - Class 6 subjects.
 */

export type VideoSubject = 'English' | 'Maths' | 'Science' | 'Hindi' | 'Social Science';

export interface VideoEntry {
  id: string;
  title: string;
  url: string;
  embedId: string;
  context: string;
}

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

export const englishVideos: VideoEntry[] = [
  v('en_bottle_dew_p1', 'A Bottle of Dew - Part 1', 'https://youtu.be/i6DJ3LmL78c?si=8O_lMtp6sbgZxdsp', 'Explanation of A Bottle of Dew - Unit 1: Fables and Folk Tales, Class 6 English.'),
  v('en_bottle_dew_p2', 'A Bottle of Dew - Part 2', 'https://youtu.be/RIJq3hqJlTc?si=xfTIgYejPoFoQOtD', 'Part 2 explanation of A Bottle of Dew - Class 6 English.'),
  v('en_bottle_dew_qa1', 'A Bottle of Dew - Q&A Part 1', 'https://youtu.be/U5stebP5i8Q?si=R0gT6s94CAuXw5uF', 'Question and answers for A Bottle of Dew Part 1 - Unit 1, Class 6 English.'),
  v('en_bottle_dew_qa2', 'A Bottle of Dew - Q&A Part 2', 'https://youtu.be/g0dI8Foqj9g?si=jBRFQ8zDkagjVUUG', 'Question and answers for A Bottle of Dew Part 2 - Unit 1, Class 6 English.'),
  v('en_raven_fox', 'The Raven and the Fox', 'https://youtu.be/LhWtgTdygpc?si=xxy2P8BZeF4KDMFK', 'Explanation of The Raven and the Fox - Unit 1 fable, Class 6 English.'),
  v('en_raven_fox_qa', 'The Raven and the Fox - Q&A', 'https://youtu.be/s5oS3nXZ8AE?si=5z1UY2HbnUJvKYu6', 'Question and answers for The Raven and the Fox - Unit 1, Class 6 English.'),
  v('en_rama_rescue_p1', 'Rama to the Rescue - Part 1', 'https://youtu.be/18bD6mfZit8?si=2L9sJcRFRteDIl3p', 'Explanation Part 1 of Rama to the Rescue - Unit 1, Class 6 English.'),
  v('en_rama_rescue_p2', 'Rama to the Rescue - Part 2', 'https://youtu.be/Rm6qJEEiEuQ?si=N-9M5CNIpnduPON8', 'Explanation Part 2 of Rama to the Rescue - Unit 1, Class 6 English.'),
  v('en_unlikely_friends_p1', 'The Unlikely Best Friends - Part 1', 'https://youtu.be/3ELIuSldRcQ?si=SwzSb9Ov-rqDowFp', 'Explanation Part 1 of The Unlikely Best Friends - Unit 2: Friendship, Class 6 English.'),
  v('en_unlikely_friends_p2', 'The Unlikely Best Friends - Part 2', 'https://youtu.be/C-Wpigy5VeQ?si=9YLWkdBCDr0qZf5o', 'Explanation Part 2 of The Unlikely Best Friends - Unit 2, Class 6 English.'),
  v('en_friends_prayer', "A Friend's Prayer", 'https://youtu.be/D8I89vf5Ugs?si=KgbGzQLW5fXf16VG', "A Friend's Prayer poem - Unit 2: Friendship, Class 6 English."),
  v('en_chair', 'The Chair - Explanation', 'https://youtu.be/soXvxIbsXOw?si=OpzXfWxRibFvW771', 'Explanation of The Chair - Unit 2: Friendship, Class 6 English.'),
  v('en_chair_qa', 'The Chair - Q&A', 'https://youtu.be/HA9QUmlMkFA?si=yxl0MIBj-UHHdWc9', 'Question and answers for The Chair - Unit 2, Class 6 English.'),
  v('en_neem_baba', 'Neem Baba', 'https://youtu.be/W4t0O2_v9ZE?si=lMZq0WXx19DpnB_3', 'Neem Baba explanation - Unit 3: Nurturing Nature, Class 6 English.'),
  v('en_neem_baba_qa', 'Neem Baba - Q&A', 'https://youtu.be/3zfyAgqnZ34?si=HfBiBe9XzFNePDl1', 'Question and answers for Neem Baba - Unit 3, Class 6 English.'),
  v('en_bird_thought', 'What a Bird Thought - Explanation', 'https://youtu.be/9QCjbsvrI_g?si=G-8RqNIiVxdbQaMy', 'Explanation of What a Bird Thought - Unit 3: Nurturing Nature, Class 6 English.'),
  v('en_bird_thought_qa', 'What a Bird Thought - Q&A', 'https://youtu.be/40O_iDJ-KRE?si=4kkGBXSTQNcIyD9w', 'Question and answers for What a Bird Thought - Unit 3, Class 6 English.'),
  v('en_spices_heal', 'Spices that Heal Us', 'https://youtu.be/_xJi5ZzxCKI?si=pr5tLjDrKveDtqXT', 'Spices that Heal Us - Unit 3: Nurturing Nature, nature and health, Class 6 English.'),
  v('en_spices_qa', 'Spices that Heal Us - Q&A', 'https://youtu.be/VvGwGE6Ch8I?si=nae8D2e9-jjrQFAq', 'Question and answers for Spices that Heal Us - Unit 3, Class 6 English.'),
  v('en_change_heart_p1', 'Change of Heart - Part 1', 'https://youtu.be/51dh_puziCs?si=fcwUpeD7yKwEbR5a', 'Change of Heart Part 1 - Unit 4: Sports and Wellness, Class 6 English.'),
  v('en_change_heart_p2', 'Change of Heart - Part 2', 'https://youtu.be/0n2erASVaLg?si=4MlEMt-bEdeY0Pdp', 'Change of Heart Part 2 - Unit 4: Sports and Wellness, Class 6 English.'),
  v('en_change_heart_qa', 'Change of Heart - Q&A', 'https://youtu.be/v1QfudEbK4Q?si=f1T7bVSUJJDoFjJk', 'Question and answers for Change of Heart - Unit 4, Class 6 English.'),
  v('en_winner_p1', 'The Winner - Part 1', 'https://youtu.be/KSvj1rqgG4o?si=iARcVKaJ6kYftsjt', 'The Winner Part 1 - Unit 4: Sports and Wellness, Class 6 English.'),
  v('en_winner_p2', 'The Winner - Part 2', 'https://youtu.be/-jMgg1BzAk0?si=gbHB3PLzO318swGy', 'The Winner Part 2 - Unit 4: Sports and Wellness, Class 6 English.'),
  v('en_yoga_p1', 'Yoga - A Way of Life - Part 1', 'https://youtu.be/atL0_ADmbpc?si=c3u-iYnrUZHb8_aY', 'Yoga: A Way of Life Part 1 - Unit 4: Sports and Wellness, Class 6 English.'),
  v('en_yoga_p2', 'Yoga - A Way of Life - Part 2', 'https://youtu.be/V3s7b_w8WYo?si=jC9mWaPJGVSJ7POU', 'Yoga: A Way of Life Part 2 - Unit 4: Sports and Wellness, Class 6 English.'),
  v('en_hamara_bharat_p1', 'Hamara Bharat - Incredible India! Part 1', 'https://youtu.be/gQJMYsW30eM?si=QXFo5dCOdZxNuCFM', 'Hamara Bharat Part 1 - Unit 5: Culture and Tradition, Indian culture, Class 6 English.'),
  v('en_hamara_bharat_p2', 'Hamara Bharat - Incredible India! Part 2', 'https://youtu.be/1XSvf-gVqe8?si=VwFM55mVSEf0HBhS', 'Hamara Bharat Part 2 - Unit 5: Culture and Tradition, Class 6 English.'),
  v('en_kites', 'The Kites', 'https://youtu.be/7Zuw0Lb2fzE?si=-1_q4MXQN6zHi3zQ', 'The Kites poem - Unit 5: Culture and Tradition, Class 6 English.'),
  v('en_ila_sachani', 'Ila Sachani - Embroidering Dreams', 'https://youtu.be/HN2trC_4dE4?si=EBNHdfSSLPe3KiaB', 'Ila Sachani: Embroidering Dreams with her Feet - Unit 5: Culture and Tradition, Class 6 English.'),
  v('en_war_memorial', 'National War Memorial', 'https://youtu.be/dlpfv01s3Vc?si=2vt69isFkJ-foaY_', 'National War Memorial - Unit 5: Culture and Tradition, patriotism, Class 6 English.'),
];

export const mathsVideos: VideoEntry[] = [
  v('ma_ch1_patterns_p1', 'Unit 1: Patterns in Mathematics - Part 1', 'https://youtu.be/HMwD-Y378-Q?si=wr24fVW5S9E87P7I', 'Patterns in Mathematics: What is Mathematics, patterns in numbers and shapes - Class 6 Maths Unit 1 Part 1.'),
  v('ma_ch1_patterns_p2', 'Unit 1: Patterns in Mathematics - Part 2', 'https://youtu.be/YLWl04x9p1w?si=G-U-Z-yaOLJ18Xn_', 'Visualising number sequences, relations among number sequences - Class 6 Maths Unit 1 Part 2.'),
  v('ma_ch1_patterns_p3', 'Unit 1: Patterns in Mathematics - Part 3', 'https://youtu.be/cTLFRIyvqiU?si=YXnuxAoq5oi7EMkC', 'Patterns in shapes and their relation to number sequences - Class 6 Maths Unit 1 Part 3.'),
  v('ma_ch2_lines_p1', 'Unit 2: Lines and Angles - Part 1', 'https://youtu.be/O4bp4HZZaOU?si=ElLZL-njbfg3r-kE', 'Point, line segment, line, ray - Class 6 Maths Unit 2 Part 1.'),
  v('ma_ch2_lines_p2', 'Unit 2: Lines and Angles - Part 2', 'https://youtu.be/SVSeF7rw4ag?si=KHiGKX030__kvqRE', 'Angle, comparing angles, making rotating arms - Class 6 Maths Unit 2 Part 2.'),
  v('ma_ch2_lines_p3', 'Unit 2: Lines and Angles - Part 3', 'https://youtu.be/vI0KbILEJ10?si=rrKeuieWRYqdraTN', 'Special types of angles, measuring angles - Class 6 Maths Unit 2 Part 3.'),
  v('ma_ch2_lines_p4', 'Unit 2: Lines and Angles - Part 4', 'https://youtu.be/kIAiMXc1Hnk?si=iSLKMBehAOaArImZ', 'Drawing angles, types of angles and their measures - Class 6 Maths Unit 2 Part 4.'),
  v('ma_ch2_lines_p5', 'Unit 2: Lines and Angles - Part 5', 'https://youtu.be/qw-2F_5WnOk?si=PXXCo6_X2EfqxCXb', 'Lines and angles continued - Class 6 Maths Unit 2 Part 5.'),
  v('ma_ch2_lines_p6', 'Unit 2: Lines and Angles - Part 6', 'https://youtu.be/MP3bPg32S_w?si=r_mGKi2rKgNY7Dza', 'Lines and angles continued - Class 6 Maths Unit 2 Part 6.'),
  v('ma_ch3_numplay_p1', 'Unit 3: Number Play - Part 1', 'https://youtu.be/oyf5Q8CGhB8?si=vmktfskBhXRmtKEQ', 'Numbers can tell us things, supercells - Class 6 Maths Unit 3 Part 1.'),
  v('ma_ch3_numplay_p2', 'Unit 3: Number Play - Part 2', 'https://youtu.be/9LkFKympMTY?si=PE2odaleK9by0Uzh', 'Patterns on number line, playing with digits - Class 6 Maths Unit 3 Part 2.'),
  v('ma_ch3_numplay_p3', 'Unit 3: Number Play - Part 3', 'https://youtu.be/YwCzfuMDzaw?si=dxWT900ZBQgW6hsI', 'Pretty palindromic patterns, Kaprekar magic number - Class 6 Maths Unit 3 Part 3.'),
  v('ma_ch3_numplay_p4', 'Unit 3: Number Play - Part 4', 'https://youtu.be/8F2kTaiAFoc?si=kEqm9RkJfCHsiFyK', 'Clock and calendar numbers, mental math - Class 6 Maths Unit 3 Part 4.'),
  v('ma_ch3_numplay_p5', 'Unit 3: Number Play - Part 5', 'https://youtu.be/CoczSppCeEs?si=MlzBnhDEzdRc84Ty', 'Collatz Conjecture, simple estimation, games and winning strategies - Class 6 Maths Unit 3 Part 5.'),
  v('ma_ch4_data_p1', 'Unit 4: Data Handling and Presentation - Part 1', 'https://youtu.be/rnUNiCe4LRc?si=MoZLbSKCHKnQty3B', 'Collecting and organising data, pictographs - Class 6 Maths Unit 4 Part 1.'),
  v('ma_ch4_data_p2', 'Unit 4: Data Handling and Presentation - Part 2', 'https://youtu.be/R9RozYMALag?si=5N1UOXG8QmSYXLbf', 'Bar graphs, drawing a bar graph - Class 6 Maths Unit 4 Part 2.'),
  v('ma_ch4_data_p3', 'Unit 4: Data Handling and Presentation - Part 3', 'https://youtu.be/kTv-UHPvTiE?si=Vr9iYRAW1SNRGPVN', 'Artistic and aesthetic considerations in data handling - Class 6 Maths Unit 4 Part 3.'),
  v('ma_ch5_prime_p1', 'Unit 5: Prime Time - Part 1', 'https://youtu.be/AdoeRCqLyh0?si=rvL9S0AqfEEr-ODf', 'Common multiples and common factors - Class 6 Maths Unit 5 Part 1.'),
  v('ma_ch5_prime_p2', 'Unit 5: Prime Time - Part 2', 'https://youtu.be/R6WT9pEsNQU?si=mbCMwsMEiOQbu4ka', 'Prime numbers, co-prime numbers - Class 6 Maths Unit 5 Part 2.'),
  v('ma_ch5_prime_p3', 'Unit 5: Prime Time - Part 3', 'https://youtu.be/1tkn8YAfzTE?si=VNpZ15HLCodICJmV', 'Prime factorisation - Class 6 Maths Unit 5 Part 3.'),
  v('ma_ch5_prime_p4', 'Unit 5: Prime Time - Part 4', 'https://youtu.be/T7awj82r3Lg?si=DAPnuo1pTPrORB51', 'Fun with numbers and prime numbers - Class 6 Maths Unit 5 Part 4.'),
  v('ma_ch6_perimeter_p1', 'Unit 6: Perimeter and Area - Part 1', 'https://youtu.be/cIrqnhqqzLU?si=0Dx_QYQ5LM63fLKw', 'Perimeter of shapes - Class 6 Maths Unit 6 Part 1.'),
  v('ma_ch6_perimeter_p2', 'Unit 6: Perimeter and Area - Part 2', 'https://youtu.be/3vp-WNQr97U?si=rHabQw16w0sfu-oT', 'Area of shapes - Class 6 Maths Unit 6 Part 2.'),
  v('ma_ch6_perimeter_p3', 'Unit 6: Perimeter and Area - Part 3', 'https://youtu.be/OdlHpIKN9aE?si=m0IkdygetHgM0Czm', 'Area of a triangle - Class 6 Maths Unit 6 Part 3.'),
  v('ma_ch6_perimeter_p4', 'Unit 6: Perimeter and Area - Part 4', 'https://youtu.be/_3XJkPdkV24?si=nthCFYqyqm1bnSB8', 'Perimeter and area continued - Class 6 Maths Unit 6 Part 4.'),
  v('ma_ch6_perimeter_p5', 'Unit 6: Perimeter and Area - Part 5', 'https://youtu.be/rkRy3Y1z6VI?si=6CZ0afbwvyYdMh4w', 'Perimeter and area continued - Class 6 Maths Unit 6 Part 5.'),
  v('ma_ch7_fractions_p1', 'Unit 7: Fractions - Part 1', 'https://youtu.be/IQLx3GdLsEg?si=V8LDA3YTLTjYmnaa', 'Fractional units and equal shares, fractional units as parts of a whole - Class 6 Maths Unit 7 Part 1.'),
  v('ma_ch7_fractions_p2', 'Unit 7: Fractions - Part 2', 'https://youtu.be/XPmVpQ0zXq0?si=5HgZEtnTgZvtcmjS', 'Measuring using fractional units, marking fraction lengths on number line - Class 6 Maths Unit 7 Part 2.'),
  v('ma_ch7_fractions_p3', 'Unit 7: Fractions - Part 3', 'https://youtu.be/Kd7O8IEeMko?si=xmOh51GrdH8nLaGu', 'Mixed fractions, equivalent fractions - Class 6 Maths Unit 7 Part 3.'),
  v('ma_ch7_fractions_p4', 'Unit 7: Fractions - Part 4', 'https://youtu.be/5A2EYNGajpA?si=TIHhknHqSIU9UmlS', 'Comparing fractions - Class 6 Maths Unit 7 Part 4.'),
  v('ma_ch7_fractions_p5', 'Unit 7: Fractions - Part 5', 'https://youtu.be/aYJV7TX78II?si=K2sUxwunasZs5UCA', 'Addition and subtraction of fractions - Class 6 Maths Unit 7 Part 5.'),
  v('ma_ch7_fractions_p6', 'Unit 7: Fractions - Part 6', 'https://youtu.be/Fo39m2oRp5Q?si=FUGi_A9P4_xxuK6K', 'Fractions continued, a pinch of history - Class 6 Maths Unit 7 Part 6.'),
  v('ma_ch8_constructions_p1', 'Unit 8: Playing with Constructions - Part 1', 'https://youtu.be/SQctGup79-Y?si=7slC7tbUh0tsTvKv', 'Artwork and constructions, squares and rectangles - Class 6 Maths Unit 8 Part 1.'),
  v('ma_ch8_constructions_p2', 'Unit 8: Playing with Constructions - Part 2', 'https://youtu.be/d0jcZYRcPx0?si=qsQobg3JLHEe6BFH', 'Constructing squares and rectangles - Class 6 Maths Unit 8 Part 2.'),
  v('ma_ch8_constructions_p3', 'Unit 8: Playing with Constructions - Part 3', 'https://youtu.be/-8MozXl9UtM?si=JHe2JZzTe5X4yJGo', 'An exploration in rectangles - Class 6 Maths Unit 8 Part 3.'),
  v('ma_ch8_constructions_p4', 'Unit 8: Playing with Constructions - Part 4', 'https://youtu.be/_iwss0F9hjA?si=U56TBjeQlYVQxrmn', 'Exploring diagonals of rectangles and squares - Class 6 Maths Unit 8 Part 4.'),
  v('ma_ch8_constructions_p5', 'Unit 8: Playing with Constructions - Part 5', 'https://youtu.be/8eyxqAcCbjA?si=b3kMpMPF98qdF5rN', 'Points equidistant from two given points - Class 6 Maths Unit 8 Part 5.'),
  v('ma_ch8_constructions_p6', 'Unit 8: Playing with Constructions - Part 6', 'https://youtu.be/3Jruxp3FPWQ?si=LpZmBnKEx99qGnMs', 'Playing with constructions continued - Class 6 Maths Unit 8 Part 6.'),
  v('ma_ch9_symmetry_p1', 'Unit 9: Symmetry - Part 1', 'https://youtu.be/0ylw2SzuO3M?si=8gYIj6sQhVHjs_ex', 'Line of symmetry - Class 6 Maths Unit 9 Part 1.'),
  v('ma_ch9_symmetry_p2', 'Unit 9: Symmetry - Part 2', 'https://youtu.be/vabdTQblY6M?si=rfn34GgeMacF7SAk', 'Rotational symmetry - Class 6 Maths Unit 9 Part 2.'),
  v('ma_ch10_integers_p1', 'Unit 10: The Other Side of Zero - Part 1', 'https://youtu.be/J2rWiO0MCT0?si=Igp6kfj5NAB324z0', "Bela's Building of Fun, the token model - Class 6 Maths Unit 10 Part 1."),
  v('ma_ch10_integers_p2', 'Unit 10: The Other Side of Zero - Part 2', 'https://youtu.be/ZaBr01Jc_ww?si=BetPEx_io2KqPbhK', 'Integers in other places - Class 6 Maths Unit 10 Part 2.'),
  v('ma_ch10_integers_p3', 'Unit 10: The Other Side of Zero - Part 3', 'https://youtu.be/KCrYdtI9VCM?si=fZGXNLQI5CtRG2-5', 'Explorations with integers - Class 6 Maths Unit 10 Part 3.'),
  v('ma_ch10_integers_p4', 'Unit 10: The Other Side of Zero - Part 4', 'https://youtu.be/inMxYy4qMgY?si=OWHfEBv7lgqbuA4o', 'A pinch of history, integers summary - Class 6 Maths Unit 10 Part 4.'),
];

export const scienceVideos: VideoEntry[] = [
  v('sc_ch1_wonderful_world', 'Unit 1: The Wonderful World of Science', 'https://youtu.be/6UomGsBw9BY?si=V7ZQ_6EPPC-gnqF4', 'The Wonderful World of Science - Unit 1, Class 6 Science.'),
  v('sc_ch2_diversity_p1', 'Unit 2: Diversity in the Living World - Part 1', 'https://youtu.be/ZIMDXbmfoTA?si=HCCyr-ow5Em3y7yH', 'Diversity in the Living World Part 1 - Unit 2, Class 6 Science.'),
  v('sc_ch2_diversity_p2', 'Unit 2: Diversity in the Living World - Part 2', 'https://youtu.be/gpKqQ2-pzYw?si=q4V8ycg7-yO_prlJ', 'Diversity in the Living World Part 2 - Unit 2, Class 6 Science.'),
  v('sc_ch2_diversity_p3', 'Unit 2: Diversity in the Living World - Part 3', 'https://youtu.be/OfuaatS3SR4?si=YQgc2VDKGFFDkQhT', 'Diversity in the Living World Part 3 - Unit 2, Class 6 Science.'),
  v('sc_ch2_diversity_p4', 'Unit 2: Diversity in the Living World - Part 4', 'https://youtu.be/ixFMiLw-c-o?si=53sPDRrV-eJlUhMd', 'Diversity in the Living World Part 4 - Unit 2, Class 6 Science.'),
  v('sc_ch3_mindful_p1', 'Unit 3: Mindful Eating - Part 1', 'https://youtu.be/-izev_7VBQY?si=-fUND113YFPSWqow', 'Mindful Eating: A Path to a Healthy Body Part 1 - Unit 3, Class 6 Science.'),
  v('sc_ch3_mindful_p2', 'Unit 3: Mindful Eating - Part 2', 'https://youtu.be/TmW3eiDwOkA?si=3bhMxCGeDZiNHvjw', 'Mindful Eating Part 2 - Unit 3, Class 6 Science.'),
  v('sc_ch3_mindful_p3', 'Unit 3: Mindful Eating - Part 3', 'https://youtu.be/cz9EAm5ODUA?si=gEj4g-L6lex7-A_B', 'Mindful Eating Part 3 - Unit 3, Class 6 Science.'),
  v('sc_ch4_magnets_p1', 'Unit 4: Exploring Magnets - Part 1', 'https://youtu.be/FjGeY5JxPOw?si=SFKJPTqarxwkwNO5', 'Exploring Magnets Part 1 - Unit 4, Class 6 Science.'),
  v('sc_ch4_magnets_p2', 'Unit 4: Exploring Magnets - Part 2', 'https://youtu.be/8u2LbF3SHTE?si=FdKIKgbuuGlQyIAN', 'Exploring Magnets Part 2 - Unit 4, Class 6 Science.'),
  v('sc_ch5_measurement_p1', 'Unit 5: Measurement of Length and Motion - Part 1', 'https://youtu.be/YrcG1ebaeS4?si=AE5G7U38vLCY5kxm', 'Measurement of Length and Motion Part 1 - Unit 5, Class 6 Science.'),
  v('sc_ch5_measurement_p2', 'Unit 5: Measurement of Length and Motion - Part 2', 'https://youtu.be/M9xSP3YIE6U?si=WTiqHiZM1AcVFwFr', 'Measurement of Length and Motion Part 2 - Unit 5, Class 6 Science.'),
  v('sc_ch6_materials_p1', 'Unit 6: Materials Around Us - Part 1', 'https://youtu.be/Y4mdNb90GKY?si=oakPiD7AS0Le_wcR', 'Materials Around Us Part 1 - Unit 6, Class 6 Science.'),
  v('sc_ch6_materials_p2', 'Unit 6: Materials Around Us - Part 2', 'https://youtu.be/W7dmfDwbdtQ?si=Ya1VgQcTuDDMRqfI', 'Materials Around Us Part 2 - Unit 6, Class 6 Science.'),
  v('sc_ch6_materials_p3', 'Unit 6: Materials Around Us - Part 3', 'https://youtu.be/W8CU7MpAwcc?si=w2jC6yC38L3NmD0A', 'Materials Around Us Part 3 - Unit 6, Class 6 Science.'),
  v('sc_ch7_temperature_p1', 'Unit 7: Temperature and its Measurement - Part 1', 'https://youtu.be/ix-Yk414ub8?si=F4a8MDevYlNu19SH', 'Temperature and its Measurement Part 1 - Unit 7, Class 6 Science.'),
  v('sc_ch7_temperature_p2', 'Unit 7: Temperature and its Measurement - Part 2', 'https://youtu.be/HzCdrLKF3VY?si=tRfYIVvBNKK1T76P', 'Temperature and its Measurement Part 2 - Unit 7, Class 6 Science.'),
  v('sc_ch7_temperature_p3', 'Unit 7: Temperature and its Measurement - Part 3', 'https://youtu.be/JbEHAm5Pbuo?si=9WJcOxehLvoke5DZ', 'Temperature and its Measurement Part 3 - Unit 7, Class 6 Science.'),
  v('sc_ch8_water_p1', 'Unit 8: States of Water - Part 1', 'https://youtu.be/NzEblAtA4jo?si=pbZFlZW60bcO5YiJ', 'A Journey through States of Water Part 1 - Unit 8, Class 6 Science.'),
  v('sc_ch8_water_p2', 'Unit 8: States of Water - Part 2', 'https://youtu.be/p5DwrzILLyk?si=5QzRqBUQD3w4J2IS', 'A Journey through States of Water Part 2 - Unit 8, Class 6 Science.'),
  v('sc_ch8_water_p3', 'Unit 8: States of Water - Part 3', 'https://youtu.be/iVH1Pig566c?si=PBjlzirRxXN8f6MI', 'A Journey through States of Water Part 3 - Unit 8, Class 6 Science.'),
  v('sc_ch8_water_p4', 'Unit 8: States of Water - Part 4', 'https://youtu.be/M_2jeVjkk64?si=VZ3lVtjk216pNnt_', 'A Journey through States of Water Part 4 - Unit 8, Class 6 Science.'),
  v('sc_ch9_separation_p1', 'Unit 9: Methods of Separation - Part 1', 'https://youtu.be/DARa8IQYiWI?si=pXa2zlCXyXSXLkhz', 'Methods of Separation in Everyday Life Part 1 - Unit 9, Class 6 Science.'),
  v('sc_ch9_separation_p2', 'Unit 9: Methods of Separation - Part 2', 'https://youtu.be/IjKJdfOmK1U?si=N3QKwcgOSCGNRkPW', 'Methods of Separation Part 2 - Unit 9, Class 6 Science.'),
  v('sc_ch9_separation_p3', 'Unit 9: Methods of Separation - Part 3', 'https://youtu.be/cSNKdODaesc?si=tMgX3NLUqI82Q9IE', 'Methods of Separation Part 3 - Unit 9, Class 6 Science.'),
  v('sc_ch9_separation_p4', 'Unit 9: Methods of Separation - Part 4', 'https://youtu.be/lHQAT40AaFQ?si=RNSqJuPXOHHX5LNN', 'Methods of Separation Part 4 - Unit 9, Class 6 Science.'),
  v('sc_ch9_separation_p5', 'Unit 9: Methods of Separation - Part 5', 'https://youtu.be/mgBkjENfosE?si=JA5rtqfAinl481EC', 'Methods of Separation Part 5 - Unit 9, Class 6 Science.'),
  v('sc_ch10_living_p1', 'Unit 10: Living Creatures - Part 1', 'https://youtu.be/mO8zjYC5kLw?si=ValNbuamqcQfnpqc', 'Living Creatures: Exploring their Characteristics Part 1 - Unit 10, Class 6 Science.'),
  v('sc_ch10_living_p2', 'Unit 10: Living Creatures - Part 2', 'https://youtu.be/FR1kRd02gAg?si=HDIGHWBj__VgOmYr', 'Living Creatures Part 2 - Unit 10, Class 6 Science.'),
  v('sc_ch10_living_p3', 'Unit 10: Living Creatures - Part 3', 'https://youtu.be/yNPvvZgh60k?si=QWG3FyeorV5NawoX', 'Living Creatures Part 3 - Unit 10, Class 6 Science.'),
  v('sc_ch10_living_p4', 'Unit 10: Living Creatures - Part 4', 'https://youtu.be/TkJ3-qS4lt4?si=zkamvWj3BCrMKJ08', 'Living Creatures Part 4 - Unit 10, Class 6 Science.'),
  v('sc_ch10_living_p5', 'Unit 10: Living Creatures - Part 5', 'https://youtu.be/gAJuEmrv1mw?si=Lp_aQ5P9R0u24nnL', 'Living Creatures Part 5 - Unit 10, Class 6 Science.'),
  v('sc_ch11_nature_p1', "Unit 11: Nature's Treasures - Part 1", 'https://youtu.be/LLgs5g3OfDE?si=0iyjUe1odlS87CMH', "Nature's Treasures Part 1 - Unit 11, Class 6 Science."),
  v('sc_ch11_nature_p2', "Unit 11: Nature's Treasures - Part 2", 'https://youtu.be/af220BBK4Os?si=KqVG_igKQitBekAd', "Nature's Treasures Part 2 - Unit 11, Class 6 Science."),
  v('sc_ch11_nature_p3', "Unit 11: Nature's Treasures - Part 3", 'https://youtu.be/2LDc0MfEy3w?si=cRTV3j86Bhn3iHd5', "Nature's Treasures Part 3 - Unit 11, Class 6 Science."),
  v('sc_ch11_nature_p4', "Unit 11: Nature's Treasures - Part 4", 'https://youtu.be/paXO2TIpIUQ?si=jf6rTC9nKgtT5sf7', "Nature's Treasures Part 4 - Unit 11, Class 6 Science."),
  v('sc_ch11_nature_p5', "Unit 11: Nature's Treasures - Part 5", 'https://youtu.be/Rf5NnN7oi3U?si=FFQHH0Ywz09GYPGr', "Nature's Treasures Part 5 - Unit 11, Class 6 Science."),
  v('sc_ch12_beyond_p1', 'Unit 12: Beyond Earth - Part 1', 'https://youtu.be/o9SBjXeYMzE?si=WYEwYDzSrS9TEwKN', 'Beyond Earth Part 1 - Unit 12, Class 6 Science.'),
  v('sc_ch12_beyond_p2', 'Unit 12: Beyond Earth - Part 2', 'https://youtu.be/CPEptxedlOQ?si=Ng8h2TT464owgRkS', 'Beyond Earth Part 2 - Unit 12, Class 6 Science.'),
  v('sc_ch12_beyond_p3', 'Unit 12: Beyond Earth - Part 3', 'https://youtu.be/iAmQFT8zfsE?si=D6Fk0xFKTfrcFoXw', 'Beyond Earth Part 3 - Unit 12, Class 6 Science.'),
];

export const hindiVideos: VideoEntry[] = [
  v('hi_ch1_matribhumi', 'Unit 1: मातृभूमि (कविता)', 'https://youtu.be/SpRa_Ok3Weg?si=ifeQqSbseQ5xLJ46', 'मातृभूमि कविता - Unit 1, Class 6 Hindi. कवि: सोहनलाल द्विवेदी।'),
  v('hi_ch2_gol', 'Unit 2: गोल (संस्मरण)', 'https://youtu.be/78Gg8TxSKtw?si=Eb32EgH9JhRNHXIv', 'गोल संस्मरण - Unit 2, Class 6 Hindi. लेखक: मेजर ध्यानचंद।'),
  v('hi_ch3_pehli_boond', 'Unit 3: पहली बूंद (कविता)', 'https://youtu.be/RtM0JcQHTCY?si=W7EyisNiRJ4aruIL', 'पहली बूंद कविता - Unit 3, Class 6 Hindi. कवि: गोपालकृष्ण कौल।'),
  v('hi_ch4_haar_ki_jeet', 'Unit 4: हार की जीत (कहानी)', 'https://youtu.be/nMINKxm3nks?si=vPXEfr7PRRxA5Naz', 'हार की जीत कहानी - Unit 4, Class 6 Hindi. लेखक: सुदर्शन।'),
  v('hi_ch5_rahim_dohe', 'Unit 5: रहीम के दोहे', 'https://youtu.be/6bCSqdrTd5U?si=dM99kjdIMM1MM1dO', 'रहीम के दोहे - Unit 5, Class 6 Hindi. कवि: अब्दुर्रहीम खानखाना।'),
  v('hi_ch6_meri_maa', 'Unit 6: मेरी माँ (आत्मकथा)', 'https://youtu.be/EWkNUAtyOkM?si=Uz7CWzhlB1jho2cL', 'मेरी माँ आत्मकथा - Unit 6, Class 6 Hindi. लेखक: रामप्रसाद बिस्मिल।'),
  v('hi_ch7_jalate_chalo_p1', 'Unit 7: जलाते चलो - Part 1', 'https://youtu.be/0WGnyzsGmcU?si=hAev-apTdTwk2dgi', 'जलाते चलो कविता Part 1 - Unit 7, Class 6 Hindi. कवि: द्वारिका प्रसाद माहेश्वरी।'),
  v('hi_ch7_jalate_chalo_p2', 'Unit 7: जलाते चलो - Part 2', 'https://youtu.be/vMS6096YyKA?si=pBkp0K4dVoMwh2zJ', 'जलाते चलो कविता Part 2 - Unit 7, Class 6 Hindi।'),
  v('hi_ch8_satriya_p1', 'Unit 8: सत्रिया और बिहू नृत्य - Part 1', 'https://youtu.be/jkvvIpo-1Rg?si=MAz99Un8eP1iGxlR', 'सत्रिया और बिहू नृत्य Part 1 - Unit 8, Class 6 Hindi. लेखक: जया मेहता।'),
  v('hi_ch8_satriya_p2', 'Unit 8: सत्रिया और बिहू नृत्य - Part 2', 'https://youtu.be/IX9oSsGeZrE?si=P0Dg9iVmVroqkezN', 'सत्रिया और बिहू नृत्य Part 2 - Unit 8, Class 6 Hindi।'),
  v('hi_ch8_satriya_p3', 'Unit 8: सत्रिया और बिहू नृत्य - Part 3', 'https://youtu.be/S-CAuU-NdPY?si=uciKsUNd7u8yxP8P', 'सत्रिया और बिहू नृत्य Part 3 - Unit 8, Class 6 Hindi।'),
  v('hi_ch9_maiya_p1', 'Unit 9: मैया मैं नहीं माखन खायो - Part 1', 'https://youtu.be/NhKsdlWaVr8?si=vUn-psHE2m1LFKu6', 'मैया मैं नहीं माखन खायो पद Part 1 - Unit 9, Class 6 Hindi. कवि: सूरदास।'),
  v('hi_ch9_maiya_p2', 'Unit 9: मैया मैं नहीं माखन खायो - Part 2', 'https://youtu.be/B5SeKyBPWU8?si=kh7AkfzXS33sxHki', 'मैया मैं नहीं माखन खायो पद Part 2 - Unit 9, Class 6 Hindi।'),
  v('hi_ch10_pariksha_p1', 'Unit 10: परीक्षा (कहानी) - Part 1', 'https://youtu.be/koJlm5zTCZQ?si=MqHn89JeF3WIO6fW', 'परीक्षा कहानी Part 1 - Unit 10, Class 6 Hindi. लेखक: प्रेमचंद।'),
  v('hi_ch10_pariksha_p2', 'Unit 10: परीक्षा (कहानी) - Part 2', 'https://youtu.be/Ofk7lB_Jeu4?si=bvst1a5SVhLNMBid', 'परीक्षा कहानी Part 2 - Unit 10, Class 6 Hindi।'),
  v('hi_ch11_chetak_p1', 'Unit 11: चेतक की वीरता - Part 1', 'https://youtu.be/ZqHu696vhVU?si=xD3-VXFOxVA1uSlG', 'चेतक की वीरता कविता Part 1 - Unit 11, Class 6 Hindi. कवि: श्यामनारायण पांडेय।'),
  v('hi_ch11_chetak_p2', 'Unit 11: चेतक की वीरता - Part 2', 'https://youtu.be/Rl1CIsQc6Qg?si=N8f56xf8fxhiuvW5', 'चेतक की वीरता कविता Part 2 - Unit 11, Class 6 Hindi।'),
  v('hi_ch12_hind_p1', 'Unit 12: हिंद महासागर में छोटा-सा हिंदुस्तान - Part 1', 'https://youtu.be/a8hWy6Bp84Q?si=2m-p-850t6rmc0fN', 'हिंद महासागर में छोटा-सा हिंदुस्तान Part 1 - Unit 12, Class 6 Hindi।'),
  v('hi_ch12_hind_p2', 'Unit 12: हिंद महासागर में छोटा-सा हिंदुस्तान - Part 2', 'https://youtu.be/kuvW6a6uELc?si=oFUtbvek0kA4pcpM', 'हिंद महासागर में छोटा-सा हिंदुस्तान Part 2 - Unit 12, Class 6 Hindi।'),
  v('hi_ch13_ped_ki_baat', 'Unit 13: पेड़ की बात (निबंध)', 'https://youtu.be/nh1W-hb24LE?si=IpBGUhbrw2iCzMDT', 'पेड़ की बात निबंध - Unit 13, Class 6 Hindi. लेखक: जगदीशचंद्र बसु।'),
];

export const socialScienceVideos: VideoEntry[] = [
  v('ss_ch1_locating_p1', 'Unit 1: Locating Places on the Earth - Part 1', 'https://youtu.be/NNRHbzcCj7M?si=lf76S_zttWIIgQBX', 'Locating Places on the Earth Part 1 - Unit 1, Class 6 Social Science.'),
  v('ss_ch1_locating_p2', 'Unit 1: Locating Places on the Earth - Part 2', 'https://youtu.be/P5JPYUE3yNU?si=zV5jjkJN6QiSiBU7', 'Locating Places on the Earth Part 2 - Unit 1, Class 6 Social Science.'),
  v('ss_ch1_locating_p3', 'Unit 1: Locating Places on the Earth - Part 3', 'https://youtu.be/tajowD4rkIs?si=nnzaxgyppINRDR6y', 'Locating Places on the Earth Part 3 - Unit 1, Class 6 Social Science.'),
  v('ss_ch1_locating_p4', 'Unit 1: Locating Places on the Earth - Part 4', 'https://youtu.be/vRwgXiYx0kA?si=mZFpaiYi9waOYIAe', 'Locating Places on the Earth Part 4 - Unit 1, Class 6 Social Science.'),
  v('ss_ch2_oceans_p1', 'Unit 2: Oceans and Continents - Part 1', 'https://youtu.be/SOrmVlz55BM?si=QFpNvJ4hGJBdOoKg', 'Oceans and Continents Part 1 - Unit 2, Class 6 Social Science.'),
  v('ss_ch2_oceans_p2', 'Unit 2: Oceans and Continents - Part 2', 'https://youtu.be/CY9w9GbZh5c?si=0fBWvuN0YE9o91LJ', 'Oceans and Continents Part 2 - Unit 2, Class 6 Social Science.'),
  v('ss_ch2_oceans_p3', 'Unit 2: Oceans and Continents - Part 3', 'https://youtu.be/bIKEc0uCOCs?si=hyrlLWMSFRR1pWAz', 'Oceans and Continents Part 3 - Unit 2, Class 6 Social Science.'),
  v('ss_ch3_landforms_p1', 'Unit 3: Landforms and Life - Part 1', 'https://youtu.be/PrqAp1UquFI?si=UZke-DJx6GsNIZfo', 'Landforms and Life Part 1 - Unit 3, Class 6 Social Science.'),
  v('ss_ch3_landforms_p2', 'Unit 3: Landforms and Life - Part 2', 'https://youtu.be/ZKAsNyG682A?si=oxFCUvg7NeX7FE73', 'Landforms and Life Part 2 - Unit 3, Class 6 Social Science.'),
  v('ss_ch3_landforms_p3', 'Unit 3: Landforms and Life - Part 3', 'https://youtu.be/NUKL0zWnBw4?si=8Jz-o-5eC8TR7AK4', 'Landforms and Life Part 3 - Unit 3, Class 6 Social Science.'),
  v('ss_ch3_landforms_p4', 'Unit 3: Landforms and Life - Part 4', 'https://youtu.be/XwHTtrZiFA8?si=PFHoorydN8xtubQL', 'Landforms and Life Part 4 - Unit 3, Class 6 Social Science.'),
  v('ss_ch4_timeline_p1', 'Unit 4: Timeline and Sources of History - Part 1', 'https://youtu.be/d1r8WgTlpec?si=oKvP-fMWmwkg0z7o', 'Timeline and Sources of History Part 1 - Unit 4, Class 6 Social Science.'),
  v('ss_ch4_timeline_p2', 'Unit 4: Timeline and Sources of History - Part 2', 'https://youtu.be/JFiOG4kG9Bk?si=Bnw29MjqrvXcjgaN', 'Timeline and Sources of History Part 2 - Unit 4, Class 6 Social Science.'),
  v('ss_ch4_timeline_p3', 'Unit 4: Timeline and Sources of History - Part 3', 'https://youtu.be/1GysS_ryYAE?si=ZjEvVyzoooKPvhGD', 'Timeline and Sources of History Part 3 - Unit 4, Class 6 Social Science.'),
  v('ss_ch5_india_p1', 'Unit 5: India, That Is Bharat - Part 1', 'https://youtu.be/EkLD4YwIk60?si=2hsuMLwYFtGcBHec', 'India, That Is Bharat Part 1 - Unit 5, Class 6 Social Science.'),
  v('ss_ch5_india_p2', 'Unit 5: India, That Is Bharat - Part 2', 'https://youtu.be/ebErrfXTCfQ?si=ocwkS5hhX_bEOU52', 'India, That Is Bharat Part 2 - Unit 5, Class 6 Social Science.'),
  v('ss_ch6_civilisation_p1', 'Unit 6: The Beginnings of Indian Civilisation - Part 1', 'https://youtu.be/E3DR_ZsJuEA?si=FuPhwoUGKD0l8YmY', 'The Beginnings of Indian Civilisation Part 1 - Unit 6, Class 6 Social Science.'),
  v('ss_ch6_civilisation_p2', 'Unit 6: The Beginnings of Indian Civilisation - Part 2', 'https://youtu.be/LKIO5PhYaM0?si=YjOYGKPyD9lcX9vF', 'The Beginnings of Indian Civilisation Part 2 - Unit 6, Class 6 Social Science.'),
  v('ss_ch6_civilisation_p3', 'Unit 6: The Beginnings of Indian Civilisation - Part 3', 'https://youtu.be/jUdh8rkwf0Y?si=vILqqitCjsEu9MmG', 'The Beginnings of Indian Civilisation Part 3 - Unit 6, Class 6 Social Science.'),
  v('ss_ch7_cultural_p1', "Unit 7: India's Cultural Roots - Part 1", 'https://youtu.be/NsVff3D2lXc?si=3vyGp5xSqWZrMIFX', "India's Cultural Roots Part 1 - Unit 7, Class 6 Social Science."),
  v('ss_ch7_cultural_p2', "Unit 7: India's Cultural Roots - Part 2", 'https://youtu.be/DpC89SCEGYM?si=7mjw0B7mUzzk1xkq', "India's Cultural Roots Part 2 - Unit 7, Class 6 Social Science."),
  v('ss_ch7_cultural_p3', "Unit 7: India's Cultural Roots - Part 3", 'https://youtu.be/7euIX5kXX7g?si=xINcr_pb-oaDys_D', "India's Cultural Roots Part 3 - Unit 7, Class 6 Social Science."),
  v('ss_ch7_cultural_p4', "Unit 7: India's Cultural Roots - Part 4", 'https://youtu.be/Q5WtPoUPjGM?si=47bNt0e-YDKUif0x', "India's Cultural Roots Part 4 - Unit 7, Class 6 Social Science."),
  v('ss_ch8_unity_p1', "Unit 8: Unity in Diversity - Part 1", 'https://youtu.be/vksFgH3OmGk?si=2CPmo1jpHBWdvXqa', "Unity in Diversity Part 1 - Unit 8, Class 6 Social Science."),
  v('ss_ch8_unity_p2', "Unit 8: Unity in Diversity - Part 2", 'https://youtu.be/td_sZZWCdbg?si=1u5TGVYqkEvYqyee', "Unity in Diversity Part 2 - Unit 8, Class 6 Social Science."),
  v('ss_ch8_unity_p3', "Unit 8: Unity in Diversity - Part 3", 'https://youtu.be/I5QbF_sgQNQ?si=wSItZQ6R3esYlDTi', "Unity in Diversity Part 3 - Unit 8, Class 6 Social Science."),
  v('ss_ch9_family_p1', 'Unit 9: Family and Community - Part 1', 'https://youtu.be/gVqs_8AGvO8?si=WhcAl6dmMvGgP6R0', 'Family and Community Part 1 - Unit 9, Class 6 Social Science.'),
  v('ss_ch9_family_p2', 'Unit 9: Family and Community - Part 2', 'https://youtu.be/naIR6mRBRZU?si=_0gVGxJGVHxnkFhI', 'Family and Community Part 2 - Unit 9, Class 6 Social Science.'),
  v('ss_ch10_governance_p1', 'Unit 10: Grassroots Democracy - Governance - Part 1', 'https://youtu.be/tYB70zBJYP8?si=C2mwrxuCEgA2hZMV', 'Grassroots Democracy - Governance Part 1 - Unit 10, Class 6 Social Science.'),
  v('ss_ch10_governance_p2', 'Unit 10: Grassroots Democracy - Governance - Part 2', 'https://youtu.be/ot_Tg0_80wM?si=6WT754mAJ0kXZ8Si', 'Grassroots Democracy - Governance Part 2 - Unit 10, Class 6 Social Science.'),
  v('ss_ch10_governance_p3', 'Unit 10: Grassroots Democracy - Governance - Part 3', 'https://youtu.be/NIvuNdMbkfM?si=Gyu0Q5C0XsLsVsEC', 'Grassroots Democracy - Governance Part 3 - Unit 10, Class 6 Social Science.'),
  v('ss_ch11_rural_p1', 'Unit 11: Local Government in Rural Areas - Part 1', 'https://youtu.be/B-ijHkS3_H8?si=bZn07hDT-pESzHCw', 'Local Government in Rural Areas Part 1 - Unit 11, Class 6 Social Science.'),
  v('ss_ch11_rural_p2', 'Unit 11: Local Government in Rural Areas - Part 2', 'https://youtu.be/HPOz4lQzcuw?si=E1GTrGQyerFYmRX-', 'Local Government in Rural Areas Part 2 - Unit 11, Class 6 Social Science.'),
  v('ss_ch12_urban_p1', 'Unit 12: Local Government in Urban Areas - Part 1', 'https://youtu.be/lSVj9gs-DcE?si=D33iq1dCpUTjWXYT', 'Local Government in Urban Areas Part 1 - Unit 12, Class 6 Social Science.'),
  v('ss_ch12_urban_p2', 'Unit 12: Local Government in Urban Areas - Part 2', 'https://youtu.be/SKLu00DnfR4?si=e0TZObj8pj5f7P__', 'Local Government in Urban Areas Part 2 - Unit 12, Class 6 Social Science.'),
  v('ss_ch13_value_p1', 'Unit 13: The Value of Work - Part 1', 'https://youtu.be/3Q8MCi8LbA8?si=5YXxFJO08LSX_aNv', 'The Value of Work Part 1 - Unit 13, Class 6 Social Science.'),
  v('ss_ch13_value_p2', 'Unit 13: The Value of Work - Part 2', 'https://youtu.be/eNNp886LfAU?si=4Nxnf1lFLHxr9wiw', 'The Value of Work Part 2 - Unit 13, Class 6 Social Science.'),
  v('ss_ch13_value_p3', 'Unit 13: The Value of Work - Part 3', 'https://youtu.be/a4I-TgXYeCk?si=QK3GpmUSqEQqymQG', 'The Value of Work Part 3 - Unit 13, Class 6 Social Science.'),
  v('ss_ch14_economic_p1', 'Unit 14: Economic Activities Around Us - Part 1', 'https://youtu.be/yO_hWQ49VPg?si=97tVGakncTGtPIww', 'Economic Activities Around Us Part 1 - Unit 14, Class 6 Social Science.'),
  v('ss_ch14_economic_p2', 'Unit 14: Economic Activities Around Us - Part 2', 'https://youtu.be/eSsEVG3ZNJQ?si=Srnmhbbf6k_bc8l5', 'Economic Activities Around Us Part 2 - Unit 14, Class 6 Social Science.'),
  v('ss_ch14_economic_p3', 'Unit 14: Economic Activities Around Us - Part 3', 'https://youtu.be/u9RfLgOpco4?si=DaKwteqTDGGhF56K', 'Economic Activities Around Us Part 3 - Unit 14, Class 6 Social Science.'),
];

export const VIDEO_DATA: Record<VideoSubject, VideoEntry[]> = {
  English: englishVideos,
  Maths: mathsVideos,
  Science: scienceVideos,
  Hindi: hindiVideos,
  'Social Science': socialScienceVideos,
};

export const ALL_VIDEOS: VideoEntry[] = [...englishVideos, ...mathsVideos, ...scienceVideos, ...hindiVideos, ...socialScienceVideos];
