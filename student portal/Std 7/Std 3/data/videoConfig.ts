/**
 * data/videoConfig.ts
 * Video learning data for Std 7 - English, Maths, Science, Hindi, Gujarati.
 * Each video has a YouTube URL, title, and topic context for AI grounding.
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

/* ---- ENGLISH VIDEOS (Std 7) ---- */

export const englishVideos: VideoEntry[] = [
  // Unit 1: Learning Together
  v('eng_u1_river_main', 'The Day the River Spoke', 'https://www.youtube.com/watch?v=s7xKSKsvHhA', 'Unit 1 prose lesson: The Day the River Spoke.'),
  v('eng_u1_river_qa1', 'The Day the River Spoke - Q&A (Part 1)', 'https://www.youtube.com/watch?v=qARQJUYXCiY', 'Question-answer support for The Day the River Spoke (Part 1).'),
  v('eng_u1_river_qa2', 'The Day the River Spoke - Q&A (Part 2)', 'https://www.youtube.com/watch?v=HULGLbitzwA', 'Question-answer support for The Day the River Spoke (Part 2).'),
  v('eng_u1_try_again_poem', 'Try Again (Poem)', 'https://www.youtube.com/watch?v=lyt90mR5a0w', 'Unit 1 poem: Try Again.'),
  v('eng_u1_try_again_qa', 'Try Again (Poem) - Q&A', 'https://www.youtube.com/watch?v=MBoaOZkuUZ8', 'Question-answer support for the poem Try Again.'),
  v('eng_u1_three_days_main', 'Three Days to See', 'https://www.youtube.com/watch?v=VzVkqrjwh-c', 'Unit 1 prose lesson: Three Days to See.'),
  v('eng_u1_three_days_qa', 'Three Days to See - Q&A', 'https://www.youtube.com/watch?v=2i_qbqkBVVc', 'Question-answer support for Three Days to See.'),

  // Unit 2: Wit and Humour
  v('eng_u2_dolittle_main', 'Animals, Birds and Dr. Dolittle', 'https://www.youtube.com/watch?v=F5rd7mL_2Uo', 'Unit 2 prose lesson: Animals, Birds and Dr. Dolittle.'),
  v('eng_u2_dolittle_qa', 'Animals, Birds and Dr. Dolittle - Q&A', 'https://www.youtube.com/watch?v=9t2GW8MPFB8', 'Question-answer support for Dr. Dolittle lesson.'),
  v('eng_u2_funny_man_poem', 'A Funny Man (Poem)', 'https://www.youtube.com/watch?v=Pn6l40V1Hhk', 'Unit 2 poem: A Funny Man.'),
  v('eng_u2_funny_man_qa', 'A Funny Man (Poem) - Q&A', 'https://www.youtube.com/watch?v=1qFBLIRNOV4', 'Question-answer support for A Funny Man poem.'),
  v('eng_u2_say_right_main', 'Say the Right Thing', 'https://www.youtube.com/watch?v=9Zm_OLamY1s', 'Unit 2 prose lesson: Say the Right Thing.'),
  v('eng_u2_say_right_qa', 'Say the Right Thing - Q&A', 'https://www.youtube.com/watch?v=TJP4-B8YpEc', 'Question-answer support for Say the Right Thing.'),

  // Unit 3: Dreams and Discoveries
  v('eng_u3_invention_main', "My Brother's Great Invention", 'https://www.youtube.com/watch?v=P8Dhdm08ZYE', 'Unit 3 prose lesson: My Brother\'s Great Invention.'),
  v('eng_u3_invention_qa', "My Brother's Great Invention - Q&A", 'https://www.youtube.com/watch?v=7MGuS2eGWHw', 'Question-answer support for My Brother\'s Great Invention.'),
  v('eng_u3_paper_boats_poem', 'Paper Boats (Poem)', 'https://www.youtube.com/watch?v=eFr-RbpDHew', 'Unit 3 poem: Paper Boats.'),
  v('eng_u3_paper_boats_qa', 'Paper Boats (Poem) - Q&A', 'https://www.youtube.com/watch?v=NUgZJidAdm0', 'Question-answer support for Paper Boats poem.'),
  v('eng_u3_directions_main', 'North, South, East, West', 'https://www.youtube.com/watch?v=op2BGHspc5A', 'Unit 3 prose lesson: North, South, East, West.'),
  v('eng_u3_directions_qa', 'North, South, East, West - Q&A', 'https://www.youtube.com/watch?v=d3s23_cQyNk', 'Question-answer support for North, South, East, West.'),

  // Unit 4: Travel and Adventure
  v('eng_u4_tunnel_main', 'The Tunnel', 'https://www.youtube.com/watch?v=w1fSnLSW9aA', 'Unit 4 prose lesson: The Tunnel.'),
  v('eng_u4_tunnel_qa', 'The Tunnel - Q&A', 'https://www.youtube.com/watch?v=UQ5hhbq6j7I', 'Question-answer support for The Tunnel.'),
  v('eng_u4_travel_poem', 'Travel (Poem)', 'https://www.youtube.com/watch?v=_PKHBy-DN0M', 'Unit 4 poem: Travel.'),
  v('eng_u4_travel_qa', 'Travel (Poem) - Q&A', 'https://www.youtube.com/watch?v=yZWcvu6TZ8o', 'Question-answer support for Travel poem.'),
  v('eng_u4_summit_main', 'Conquering the Summit', 'https://www.youtube.com/watch?v=JMXsbbNTNyE', 'Unit 4 prose lesson: Conquering the Summit.'),
  v('eng_u4_summit_qa', 'Conquering the Summit - Q&A', 'https://www.youtube.com/watch?v=_oYF_RekAUU', 'Question-answer support for Conquering the Summit.'),

  // Unit 5: Bravehearts
  v('eng_u5_homage_main', 'A Homage to Our Brave Soldiers', 'https://www.youtube.com/watch?v=nVyK-ZVtXV0', 'Unit 5 prose lesson: A Homage to Our Brave Soldiers.'),
  v('eng_u5_homage_qa', 'A Homage to Our Brave Soldiers - Q&A', 'https://www.youtube.com/watch?v=VtL-IIvIwNo', 'Question-answer support for A Homage to Our Brave Soldiers.'),
  v('eng_u5_my_dear_poem', 'My Dear Soldiers (Poem)', 'https://www.youtube.com/watch?v=5IeBj3l86-g', 'Unit 5 poem: My Dear Soldiers.'),
  v('eng_u5_my_dear_qa', 'My Dear Soldiers (Poem) - Q&A', 'https://www.youtube.com/watch?v=lqfmRfgLBr4', 'Question-answer support for My Dear Soldiers poem.'),
  v('eng_u5_rani_main', 'Rani Abbakka', 'https://www.youtube.com/watch?v=uZGyXK9WIV4', 'Unit 5 prose lesson: Rani Abbakka.'),
  v('eng_u5_rani_part2', 'Rani Abbakka (Part 2)', 'https://www.youtube.com/watch?v=0eBIu5dSlyU', 'Continuation lesson for Rani Abbakka.'),
];

/* ---- HINDI VIDEOS (Std 7) ---- */

export const hindiVideos: VideoEntry[] = [
  v('hin_maa_kahani_main', 'माँ कह एक कहानी - Main Video', 'https://www.youtube.com/watch?v=2VUXWOMsI9M', 'Hindi lesson: माँ कह एक कहानी.'),
  v('hin_maa_kahani_qa', 'माँ कह एक कहानी - Question Answer', 'https://www.youtube.com/watch?v=pWA8ngaapak', 'Question-answer support for माँ कह एक कहानी.'),
  v('hin_teen_buddhiman_main', 'तीन बुद्धिमान - Main Video', 'https://www.youtube.com/watch?v=WAEQK_Ee0gc', 'Hindi lesson: तीन बुद्धिमान.'),
  v('hin_teen_buddhiman_qa', 'तीन बुद्धिमान - Question Answer', 'https://www.youtube.com/watch?v=G5qcBgQxSGM', 'Question-answer support for तीन बुद्धिमान.'),
  v('hin_phool_kanta_main', 'फूल और काँटा - Main Video', 'https://www.youtube.com/watch?v=_6ZT2NbYEmE', 'Hindi lesson: फूल और काँटा.'),
  v('hin_phool_kanta_qa', 'फूल और काँटा - Question Answer', 'https://www.youtube.com/watch?v=iLoABwzEXV4', 'Question-answer support for फूल और काँटा.'),
  v('hin_pani_re_main', 'पानी रे पानी - Main Video', 'https://www.youtube.com/watch?v=mbHShp0oH3c', 'Hindi lesson: पानी रे पानी.'),
  v('hin_pani_re_qa', 'पानी रे पानी - Question Answer', 'https://www.youtube.com/watch?v=2iTw4R4ChsY', 'Question-answer support for पानी रे पानी.'),
  v('hin_bimar_main', 'नहीं होना बीमार - Main Video', 'https://www.youtube.com/watch?v=1ELKeb6PJhY', 'Hindi lesson: नहीं होना बीमार.'),
  v('hin_bimar_qa', 'नहीं होना बीमार - Question Answer', 'https://www.youtube.com/watch?v=XbcqI39aYBI', 'Question-answer support for नहीं होना बीमार.'),
  v('hin_kundaliya_main', 'गिरधर कविराय की कुंडलिया - Main Video', 'https://www.youtube.com/watch?v=UBX9q4ZrrPc', 'Hindi lesson: गिरधर कविराय की कुंडलिया.'),
  v('hin_kundaliya_qa', 'गिरधर कविराय की कुंडलिया - Question Answer', 'https://www.youtube.com/watch?v=AfG3D1ll_28', 'Question-answer support for गिरधर कविराय की कुंडलिया.'),
  v('hin_varsha_main', 'वर्षा बहारी - Main Video', 'https://www.youtube.com/watch?v=bXI-exWj600', 'Hindi lesson: वर्षा बहारी.'),
  v('hin_varsha_qa', 'वर्षा बहारी - Question Answer', 'https://www.youtube.com/watch?v=AeExd3lwXVU', 'Question-answer support for वर्षा बहारी.'),
  v('hin_birju_main', 'बिरजू महाराज साक्षात्कार - Main Video', 'https://www.youtube.com/watch?v=ZQzfSIgEp70', 'Hindi lesson: बिरजू महाराज साक्षात्कार.'),
  v('hin_birju_qa', 'बिरजू महाराज साक्षात्कार - Question Answer', 'https://www.youtube.com/watch?v=lykDSicfVek', 'Question-answer support for बिरजू महाराज साक्षात्कार.'),
  v('hin_chidiya_main', 'चिड़िया - Main Video', 'https://www.youtube.com/watch?v=sOLG1rp1lVQ', 'Hindi lesson: चिड़िया.'),
  v('hin_chidiya_qna1', 'चिड़िया - QnA 1', 'https://www.youtube.com/watch?v=4iSITXlnH1I&t=614s', 'Question-answer support for चिड़िया (Part 1).'),
  v('hin_chidiya_qna2', 'चिड़िया - QnA 2', 'https://www.youtube.com/watch?v=HQMfIvQwH8I&t=261s', 'Question-answer support for चिड़िया (Part 2).'),
  v('hin_meera_main', 'मीरा के पद - Main Video', 'https://www.youtube.com/watch?v=mG1wmt_pyBk', 'Hindi lesson: मीरा के पद.'),
  v('hin_meera_qa', 'मीरा के पद - Question Answer', 'https://www.youtube.com/watch?v=oLwiVPNRVt4', 'Question-answer support for मीरा के पद.'),
];

/* ---- MATHS VIDEOS (Std 7) ---- */

export const mathsVideos: VideoEntry[] = [
  // Chapter 1
  v('math_ch1_p1', 'Large Numbers Around Us - Part 1', 'https://www.youtube.com/watch?v=_6KqwSPyaN8', 'Maths Chapter 1: Large Numbers Around Us (Part 1).'),
  v('math_ch1_p2', 'Large Numbers Around Us - Part 2', 'https://www.youtube.com/watch?v=YUSUg6moXPQ', 'Maths Chapter 1: Large Numbers Around Us (Part 2).'),
  v('math_ch1_p3', 'Large Numbers Around Us - Part 3', 'https://www.youtube.com/watch?v=TXKGK4ZTgC0', 'Maths Chapter 1: Large Numbers Around Us (Part 3).'),
  v('math_ch1_p4', 'Large Numbers Around Us - Part 4', 'https://www.youtube.com/watch?v=r-3wagmA2Qo', 'Maths Chapter 1: Large Numbers Around Us (Part 4).'),

  // Chapter 2
  v('math_ch2_p1', 'Arithmetic Expressions - Part 1', 'https://www.youtube.com/watch?v=5dUH1H83iPg', 'Maths Chapter 2: Arithmetic Expressions (Part 1).'),
  v('math_ch2_p2', 'Arithmetic Expressions - Part 2', 'https://www.youtube.com/watch?v=Kh_s_jlrUsQ', 'Maths Chapter 2: Arithmetic Expressions (Part 2).'),
  v('math_ch2_p3', 'Arithmetic Expressions - Part 3', 'https://www.youtube.com/watch?v=bflAg8fTd3s', 'Maths Chapter 2: Arithmetic Expressions (Part 3).'),

  // Chapter 3
  v('math_ch3_p1', 'Decimals - Part 1', 'https://www.youtube.com/watch?v=pKoq22uHCY4', 'Maths Chapter 3: Decimals (Part 1).'),
  v('math_ch3_p2', 'Decimals - Part 2', 'https://www.youtube.com/watch?v=s_pJXDQdX-M', 'Maths Chapter 3: Decimals (Part 2).'),
  v('math_ch3_p3', 'Decimals - Part 3', 'https://www.youtube.com/watch?v=DkY5aDevp64', 'Maths Chapter 3: Decimals (Part 3).'),
  v('math_ch3_p4', 'Decimals - Part 4', 'https://www.youtube.com/watch?v=61pRam-FNbs', 'Maths Chapter 3: Decimals (Part 4).'),
  v('math_ch3_p5', 'Decimals - Part 5', 'https://www.youtube.com/watch?v=4qyDYniFlmg', 'Maths Chapter 3: Decimals (Part 5).'),

  // Chapter 4
  v('math_ch4_p1', 'Basic Algebra - Part 1', 'https://www.youtube.com/watch?v=u_CFoVVQKXE', 'Maths Chapter 4: Basic Algebra (Part 1).'),
  v('math_ch4_p2', 'Basic Algebra - Part 2', 'https://www.youtube.com/watch?v=8I08h-HfaP0', 'Maths Chapter 4: Basic Algebra (Part 2).'),
  v('math_ch4_p3', 'Basic Algebra - Part 3', 'https://www.youtube.com/watch?v=Z43RKq0QN4o', 'Maths Chapter 4: Basic Algebra (Part 3).'),

  // Chapter 5
  v('math_ch5_p1', 'Parallel & Intersecting Lines - Part 1', 'https://www.youtube.com/watch?v=gy2mp2LijK4', 'Maths Chapter 5: Parallel & Intersecting Lines (Part 1).'),
  v('math_ch5_p2', 'Parallel & Intersecting Lines - Part 2', 'https://www.youtube.com/watch?v=dyph9C7w2zQ', 'Maths Chapter 5: Parallel & Intersecting Lines (Part 2).'),

  // Chapter 6
  v('math_ch6_p1', 'Number Play - Part 1', 'https://www.youtube.com/watch?v=jzHMDIYtV0g', 'Maths Chapter 6: Number Play (Part 1).'),
  v('math_ch6_p2', 'Number Play - Part 2', 'https://www.youtube.com/watch?v=QOYO0l_7n5s', 'Maths Chapter 6: Number Play (Part 2).'),

  // Chapter 7
  v('math_ch7_p1', 'Three Intersecting Lines - Part 1', 'https://www.youtube.com/watch?v=jv-qFdaW5v4', 'Maths Chapter 7: Three Intersecting Lines (Part 1).'),
  v('math_ch7_p2', 'Three Intersecting Lines - Part 2', 'https://www.youtube.com/watch?v=XgsQX7tyytA', 'Maths Chapter 7: Three Intersecting Lines (Part 2).'),

  // Chapter 8
  v('math_ch8_p1', 'Working with Fractions - Part 1', 'https://www.youtube.com/watch?v=3I9j59yxenQ', 'Maths Chapter 8: Working with Fractions (Part 1).'),
  v('math_ch8_p2', 'Working with Fractions - Part 2', 'https://www.youtube.com/watch?v=mBzSIRlSZY8', 'Maths Chapter 8: Working with Fractions (Part 2).'),
  v('math_ch8_p3', 'Working with Fractions - Part 3', 'https://www.youtube.com/watch?v=FeEvyQ1e-p4', 'Maths Chapter 8: Working with Fractions (Part 3).'),
];

/* ---- SCIENCE VIDEOS (Std 7) ---- */

export const scienceVideos: VideoEntry[] = [
  v('sci_ch1_main', 'The Ever-Evolving World of Science - Main', 'https://www.youtube.com/watch?v=_gGy0hijRAs', 'Science Chapter 1 main lesson.'),
  v('sci_ch1_qa', 'The Ever-Evolving World of Science - Q&A', 'https://www.youtube.com/watch?v=_FJdigVOKkE', 'Science Chapter 1 question-answer session.'),

  v('sci_ch2_main', 'Exploring Substances: Acidic, Basic, and Neutral - Main', 'https://www.youtube.com/watch?v=rmeIIxifZn4', 'Science Chapter 2 main lesson.'),
  v('sci_ch2_qa', 'Exploring Substances: Acidic, Basic, and Neutral - Q&A', 'https://www.youtube.com/watch?v=xrDqdP6peUU', 'Science Chapter 2 question-answer session.'),

  v('sci_ch3_main', 'Electricity: Circuits and their Components - Main', 'https://www.youtube.com/watch?v=p2DgQuPRQpE', 'Science Chapter 3 main lesson.'),
  v('sci_ch3_mcq', 'Electricity: Circuits and their Components - MCQ', 'https://www.youtube.com/watch?v=6Qwgset5Ulk', 'Science Chapter 3 MCQ practice video.'),
  v('sci_ch3_qa', 'Electricity: Circuits and their Components - Q&A', 'https://www.youtube.com/watch?v=x3AdtbAA71Q', 'Science Chapter 3 question-answer session.'),

  v('sci_ch4_main', 'The World of Metals and Non-metals - Main', 'https://www.youtube.com/watch?v=AprzJk6su2k', 'Science Chapter 4 main lesson.'),
  v('sci_ch4_qa', 'The World of Metals and Non-metals - Q&A', 'https://www.youtube.com/watch?v=An0JUhYAnUU', 'Science Chapter 4 question-answer session.'),

  v('sci_ch5_main', 'Changes Around Us: Physical and Chemical - Main', 'https://www.youtube.com/watch?v=MTHKC0VpyPI', 'Science Chapter 5 main lesson.'),
  v('sci_ch5_qa', 'Changes Around Us: Physical and Chemical - Q&A', 'https://www.youtube.com/watch?v=UIbYS2DEC_w', 'Science Chapter 5 question-answer session.'),

  v('sci_ch6_main', 'Adolescence: A Stage of Growth and Change - Main', 'https://www.youtube.com/watch?v=oGartJFZMNo', 'Science Chapter 6 main lesson.'),
  v('sci_ch6_qa', 'Adolescence: A Stage of Growth and Change - Q&A', 'https://www.youtube.com/watch?v=FZudA_wW9z4', 'Science Chapter 6 question-answer session.'),

  v('sci_ch7_main', 'Heat Transfer in Nature - Main', 'https://www.youtube.com/watch?v=UU2VYFK3Hqw', 'Science Chapter 7 main lesson.'),
  v('sci_ch7_qa', 'Heat Transfer in Nature - Q&A', 'https://www.youtube.com/watch?v=vha8m5OHRgw', 'Science Chapter 7 question-answer session.'),

  v('sci_ch8_main', 'Measurement of Time and Motion - Main', 'https://www.youtube.com/watch?v=ZNtZ88tvw6o', 'Science Chapter 8 main lesson.'),
  v('sci_ch8_qa', 'Measurement of Time and Motion - Q&A', 'https://www.youtube.com/watch?v=AWiJU-SKieg', 'Science Chapter 8 question-answer session.'),

  v('sci_ch9_main', 'Life Processes in Animals - Main', 'https://www.youtube.com/watch?v=UACAt4gT8II', 'Science Chapter 9 main lesson.'),
  v('sci_ch9_qa', 'Life Processes in Animals - Q&A', 'https://www.youtube.com/watch?v=SwUQhLEc9eM', 'Science Chapter 9 question-answer session.'),

  v('sci_ch10_main', 'Life Processes in Plants - Main', 'https://www.youtube.com/watch?v=sGmvKKnzh24', 'Science Chapter 10 main lesson.'),
  v('sci_ch10_qa', 'Life Processes in Plants - Q&A', 'https://www.youtube.com/watch?v=k4jB5HiWjbE', 'Science Chapter 10 question-answer session.'),

  v('sci_ch11_main', 'Light: Shadows and Reflections - Main', 'https://www.youtube.com/watch?v=rUilGelxKUU', 'Science Chapter 11 main lesson.'),
  v('sci_ch11_qa', 'Light: Shadows and Reflections - Q&A', 'https://www.youtube.com/watch?v=BxgDp2OSyOs', 'Science Chapter 11 question-answer session.'),

  v('sci_ch12_main', 'Earth, Moon, and the Sun - Main', 'https://www.youtube.com/watch?v=hZ7bvl323SI', 'Science Chapter 12 main lesson.'),
  v('sci_ch12_qa', 'Earth, Moon, and the Sun - Q&A', 'https://www.youtube.com/watch?v=SRKCe5lFrJU', 'Science Chapter 12 question-answer session.'),
];

/* ---- GUJARATI (kept as existing set until new list is provided) ---- */

const gujaratiVideos: VideoEntry[] = [
  v('nak_kan_vagar_ga', 'નાક-કાન વગર ગા', 'https://youtu.be/88lv57KNvNM?si=gW9FXlaxsZS0i4iJ', 'Gujarati story about imagination and humor.'),
  v('naraj_vanraj', 'નારાજ વનરાજ', 'https://youtu.be/wy2PfHbwjio?si=vEksmwdI4XFOMxYl', 'Gujarati story about nature and animals.'),
  v('makan_vagar_vanar', 'મકાન વગરના વાનર', 'https://youtu.be/oJ8TZBnn_fY?si=0bJ4Z4FoVMqes5uf', 'Gujarati story about animals and lifestyle.'),
  v('lalkanne_khai_gai', 'લાલકણને ખાઈ ગઈ બાજરી', 'https://youtu.be/1JTxyu2xxDc?si=2-_NuBELf32LAre1', 'Gujarati folk tale about food.'),
  v('tinu_tamtamtu_geet', 'તીનું તમતમતું ગીત', 'https://youtu.be/E49SZH55Pm0?si=Us9nueTQC44kVQCe', 'Gujarati poem about music and joy.'),
  v('marji_bano_maja_karo', 'મરજી બનો, મઝા કરો', 'https://youtu.be/ZUYyyCwK1xQ?si=LHLw335wAblmw-m2', 'Gujarati story about friendship and fun.'),
  v('miyau_miyau', 'મિયાંઉ...મિયાંઉ, અહી આવ', 'https://youtu.be/Ha37-ydFrLc?si=AJdn-4uROglAkkSK', 'Gujarati story about animals and humor.'),
];

/* ---- COMBINED ---- */

export const VIDEO_DATA: Record<VideoSubject, VideoEntry[]> = {
  English: englishVideos,
  Maths: mathsVideos,
  Science: scienceVideos,
  Hindi: hindiVideos,
  Gujarati: gujaratiVideos,
};

export const ALL_VIDEOS: VideoEntry[] = [
  ...englishVideos,
  ...mathsVideos,
  ...scienceVideos,
  ...hindiVideos,
  ...gujaratiVideos,
];
