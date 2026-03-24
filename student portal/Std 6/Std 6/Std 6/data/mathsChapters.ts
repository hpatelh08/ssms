/**
 * data/mathsChapters.ts
 * Maths syllabus chapters for Class 6 (Ganita Prakash)
 */

export interface MathsChapterEntry {
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

export const mathsChapters: MathsChapterEntry[] = [
  { id: 'ma_ch1_patterns_p1', title: 'Unit 1: Patterns in Mathematics - Part 1', url: 'https://youtu.be/HMwD-Y378-Q?si=wr24fVW5S9E87P7I', embedId: extractYTId('https://youtu.be/HMwD-Y378-Q?si=wr24fVW5S9E87P7I') },
  { id: 'ma_ch1_patterns_p2', title: 'Unit 1: Patterns in Mathematics - Part 2', url: 'https://youtu.be/YLWl04x9p1w?si=G-U-Z-yaOLJ18Xn_', embedId: extractYTId('https://youtu.be/YLWl04x9p1w?si=G-U-Z-yaOLJ18Xn_') },
  { id: 'ma_ch1_patterns_p3', title: 'Unit 1: Patterns in Mathematics - Part 3', url: 'https://youtu.be/cTLFRIyvqiU?si=YXnuxAoq5oi7EMkC', embedId: extractYTId('https://youtu.be/cTLFRIyvqiU?si=YXnuxAoq5oi7EMkC') },
  { id: 'ma_ch2_lines_p1', title: 'Unit 2: Lines and Angles - Part 1', url: 'https://youtu.be/O4bp4HZZaOU?si=ElLZL-njbfg3r-kE', embedId: extractYTId('https://youtu.be/O4bp4HZZaOU?si=ElLZL-njbfg3r-kE') },
  { id: 'ma_ch2_lines_p2', title: 'Unit 2: Lines and Angles - Part 2', url: 'https://youtu.be/SVSeF7rw4ag?si=KHiGKX030__kvqRE', embedId: extractYTId('https://youtu.be/SVSeF7rw4ag?si=KHiGKX030__kvqRE') },
  { id: 'ma_ch2_lines_p3', title: 'Unit 2: Lines and Angles - Part 3', url: 'https://youtu.be/vI0KbILEJ10?si=rrKeuieWRYqdraTN', embedId: extractYTId('https://youtu.be/vI0KbILEJ10?si=rrKeuieWRYqdraTN') },
  { id: 'ma_ch2_lines_p4', title: 'Unit 2: Lines and Angles - Part 4', url: 'https://youtu.be/kIAiMXc1Hnk?si=iSLKMBehAOaArImZ', embedId: extractYTId('https://youtu.be/kIAiMXc1Hnk?si=iSLKMBehAOaArImZ') },
  { id: 'ma_ch2_lines_p5', title: 'Unit 2: Lines and Angles - Part 5', url: 'https://youtu.be/qw-2F_5WnOk?si=PXXCo6_X2EfqxCXb', embedId: extractYTId('https://youtu.be/qw-2F_5WnOk?si=PXXCo6_X2EfqxCXb') },
  { id: 'ma_ch2_lines_p6', title: 'Unit 2: Lines and Angles - Part 6', url: 'https://youtu.be/MP3bPg32S_w?si=r_mGKi2rKgNY7Dza', embedId: extractYTId('https://youtu.be/MP3bPg32S_w?si=r_mGKi2rKgNY7Dza') },
  { id: 'ma_ch3_numplay_p1', title: 'Unit 3: Number Play - Part 1', url: 'https://youtu.be/oyf5Q8CGhB8?si=vmktfskBhXRmtKEQ', embedId: extractYTId('https://youtu.be/oyf5Q8CGhB8?si=vmktfskBhXRmtKEQ') },
  { id: 'ma_ch3_numplay_p2', title: 'Unit 3: Number Play - Part 2', url: 'https://youtu.be/9LkFKympMTY?si=PE2odaleK9by0Uzh', embedId: extractYTId('https://youtu.be/9LkFKympMTY?si=PE2odaleK9by0Uzh') },
  { id: 'ma_ch3_numplay_p3', title: 'Unit 3: Number Play - Part 3', url: 'https://youtu.be/YwCzfuMDzaw?si=dxWT900ZBQgW6hsI', embedId: extractYTId('https://youtu.be/YwCzfuMDzaw?si=dxWT900ZBQgW6hsI') },
  { id: 'ma_ch3_numplay_p4', title: 'Unit 3: Number Play - Part 4', url: 'https://youtu.be/8F2kTaiAFoc?si=kEqm9RkJfCHsiFyK', embedId: extractYTId('https://youtu.be/8F2kTaiAFoc?si=kEqm9RkJfCHsiFyK') },
  { id: 'ma_ch3_numplay_p5', title: 'Unit 3: Number Play - Part 5', url: 'https://youtu.be/CoczSppCeEs?si=MlzBnhDEzdRc84Ty', embedId: extractYTId('https://youtu.be/CoczSppCeEs?si=MlzBnhDEzdRc84Ty') },
  { id: 'ma_ch4_data_p1', title: 'Unit 4: Data Handling and Presentation - Part 1', url: 'https://youtu.be/rnUNiCe4LRc?si=MoZLbSKCHKnQty3B', embedId: extractYTId('https://youtu.be/rnUNiCe4LRc?si=MoZLbSKCHKnQty3B') },
  { id: 'ma_ch4_data_p2', title: 'Unit 4: Data Handling and Presentation - Part 2', url: 'https://youtu.be/R9RozYMALag?si=5N1UOXG8QmSYXLbf', embedId: extractYTId('https://youtu.be/R9RozYMALag?si=5N1UOXG8QmSYXLbf') },
  { id: 'ma_ch4_data_p3', title: 'Unit 4: Data Handling and Presentation - Part 3', url: 'https://youtu.be/kTv-UHPvTiE?si=Vr9iYRAW1SNRGPVN', embedId: extractYTId('https://youtu.be/kTv-UHPvTiE?si=Vr9iYRAW1SNRGPVN') },
  { id: 'ma_ch5_prime_p1', title: 'Unit 5: Prime Time - Part 1', url: 'https://youtu.be/AdoeRCqLyh0?si=rvL9S0AqfEEr-ODf', embedId: extractYTId('https://youtu.be/AdoeRCqLyh0?si=rvL9S0AqfEEr-ODf') },
  { id: 'ma_ch5_prime_p2', title: 'Unit 5: Prime Time - Part 2', url: 'https://youtu.be/R6WT9pEsNQU?si=mbCMwsMEiOQbu4ka', embedId: extractYTId('https://youtu.be/R6WT9pEsNQU?si=mbCMwsMEiOQbu4ka') },
  { id: 'ma_ch5_prime_p3', title: 'Unit 5: Prime Time - Part 3', url: 'https://youtu.be/1tkn8YAfzTE?si=VNpZ15HLCodICJmV', embedId: extractYTId('https://youtu.be/1tkn8YAfzTE?si=VNpZ15HLCodICJmV') },
  { id: 'ma_ch5_prime_p4', title: 'Unit 5: Prime Time - Part 4', url: 'https://youtu.be/T7awj82r3Lg?si=DAPnuo1pTPrORB51', embedId: extractYTId('https://youtu.be/T7awj82r3Lg?si=DAPnuo1pTPrORB51') },
  { id: 'ma_ch6_perimeter_p1', title: 'Unit 6: Perimeter and Area - Part 1', url: 'https://youtu.be/cIrqnhqqzLU?si=0Dx_QYQ5LM63fLKw', embedId: extractYTId('https://youtu.be/cIrqnhqqzLU?si=0Dx_QYQ5LM63fLKw') },
  { id: 'ma_ch6_perimeter_p2', title: 'Unit 6: Perimeter and Area - Part 2', url: 'https://youtu.be/3vp-WNQr97U?si=rHabQw16w0sfu-oT', embedId: extractYTId('https://youtu.be/3vp-WNQr97U?si=rHabQw16w0sfu-oT') },
  { id: 'ma_ch6_perimeter_p3', title: 'Unit 6: Perimeter and Area - Part 3', url: 'https://youtu.be/OdlHpIKN9aE?si=m0IkdygetHgM0Czm', embedId: extractYTId('https://youtu.be/OdlHpIKN9aE?si=m0IkdygetHgM0Czm') },
  { id: 'ma_ch6_perimeter_p4', title: 'Unit 6: Perimeter and Area - Part 4', url: 'https://youtu.be/_3XJkPdkV24?si=nthCFYqyqm1bnSB8', embedId: extractYTId('https://youtu.be/_3XJkPdkV24?si=nthCFYqyqm1bnSB8') },
  { id: 'ma_ch6_perimeter_p5', title: 'Unit 6: Perimeter and Area - Part 5', url: 'https://youtu.be/rkRy3Y1z6VI?si=6CZ0afbwvyYdMh4w', embedId: extractYTId('https://youtu.be/rkRy3Y1z6VI?si=6CZ0afbwvyYdMh4w') },
  { id: 'ma_ch7_fractions_p1', title: 'Unit 7: Fractions - Part 1', url: 'https://youtu.be/IQLx3GdLsEg?si=V8LDA3YTLTjYmnaa', embedId: extractYTId('https://youtu.be/IQLx3GdLsEg?si=V8LDA3YTLTjYmnaa') },
  { id: 'ma_ch7_fractions_p2', title: 'Unit 7: Fractions - Part 2', url: 'https://youtu.be/XPmVpQ0zXq0?si=5HgZEtnTgZvtcmjS', embedId: extractYTId('https://youtu.be/XPmVpQ0zXq0?si=5HgZEtnTgZvtcmjS') },
  { id: 'ma_ch7_fractions_p3', title: 'Unit 7: Fractions - Part 3', url: 'https://youtu.be/Kd7O8IEeMko?si=xmOh51GrdH8nLaGu', embedId: extractYTId('https://youtu.be/Kd7O8IEeMko?si=xmOh51GrdH8nLaGu') },
  { id: 'ma_ch7_fractions_p4', title: 'Unit 7: Fractions - Part 4', url: 'https://youtu.be/5A2EYNGajpA?si=TIHhknHqSIU9UmlS', embedId: extractYTId('https://youtu.be/5A2EYNGajpA?si=TIHhknHqSIU9UmlS') },
  { id: 'ma_ch7_fractions_p5', title: 'Unit 7: Fractions - Part 5', url: 'https://youtu.be/aYJV7TX78II?si=K2sUxwunasZs5UCA', embedId: extractYTId('https://youtu.be/aYJV7TX78II?si=K2sUxwunasZs5UCA') },
  { id: 'ma_ch7_fractions_p6', title: 'Unit 7: Fractions - Part 6', url: 'https://youtu.be/Fo39m2oRp5Q?si=FUGi_A9P4_xxuK6K', embedId: extractYTId('https://youtu.be/Fo39m2oRp5Q?si=FUGi_A9P4_xxuK6K') },
  { id: 'ma_ch8_constructions_p1', title: 'Unit 8: Playing with Constructions - Part 1', url: 'https://youtu.be/SQctGup79-Y?si=7slC7tbUh0tsTvKv', embedId: extractYTId('https://youtu.be/SQctGup79-Y?si=7slC7tbUh0tsTvKv') },
  { id: 'ma_ch8_constructions_p2', title: 'Unit 8: Playing with Constructions - Part 2', url: 'https://youtu.be/d0jcZYRcPx0?si=qsQobg3JLHEe6BFH', embedId: extractYTId('https://youtu.be/d0jcZYRcPx0?si=qsQobg3JLHEe6BFH') },
  { id: 'ma_ch8_constructions_p3', title: 'Unit 8: Playing with Constructions - Part 3', url: 'https://youtu.be/-8MozXl9UtM?si=JHe2JZzTe5X4yJGo', embedId: extractYTId('https://youtu.be/-8MozXl9UtM?si=JHe2JZzTe5X4yJGo') },
  { id: 'ma_ch8_constructions_p4', title: 'Unit 8: Playing with Constructions - Part 4', url: 'https://youtu.be/_iwss0F9hjA?si=U56TBjeQlYVQxrmn', embedId: extractYTId('https://youtu.be/_iwss0F9hjA?si=U56TBjeQlYVQxrmn') },
  { id: 'ma_ch8_constructions_p5', title: 'Unit 8: Playing with Constructions - Part 5', url: 'https://youtu.be/8eyxqAcCbjA?si=b3kMpMPF98qdF5rN', embedId: extractYTId('https://youtu.be/8eyxqAcCbjA?si=b3kMpMPF98qdF5rN') },
  { id: 'ma_ch8_constructions_p6', title: 'Unit 8: Playing with Constructions - Part 6', url: 'https://youtu.be/3Jruxp3FPWQ?si=LpZmBnKEx99qGnMs', embedId: extractYTId('https://youtu.be/3Jruxp3FPWQ?si=LpZmBnKEx99qGnMs') },
  { id: 'ma_ch9_symmetry_p1', title: 'Unit 9: Symmetry - Part 1', url: 'https://youtu.be/0ylw2SzuO3M?si=8gYIj6sQhVHjs_ex', embedId: extractYTId('https://youtu.be/0ylw2SzuO3M?si=8gYIj6sQhVHjs_ex') },
  { id: 'ma_ch9_symmetry_p2', title: 'Unit 9: Symmetry - Part 2', url: 'https://youtu.be/vabdTQblY6M?si=rfn34GgeMacF7SAk', embedId: extractYTId('https://youtu.be/vabdTQblY6M?si=rfn34GgeMacF7SAk') },
  { id: 'ma_ch10_integers_p1', title: 'Unit 10: The Other Side of Zero - Part 1', url: 'https://youtu.be/J2rWiO0MCT0?si=Igp6kfj5NAB324z0', embedId: extractYTId('https://youtu.be/J2rWiO0MCT0?si=Igp6kfj5NAB324z0') },
  { id: 'ma_ch10_integers_p2', title: 'Unit 10: The Other Side of Zero - Part 2', url: 'https://youtu.be/ZaBr01Jc_ww?si=BetPEx_io2KqPbhK', embedId: extractYTId('https://youtu.be/ZaBr01Jc_ww?si=BetPEx_io2KqPbhK') },
  { id: 'ma_ch10_integers_p3', title: 'Unit 10: The Other Side of Zero - Part 3', url: 'https://youtu.be/KCrYdtI9VCM?si=fZGXNLQI5CtRG2-5', embedId: extractYTId('https://youtu.be/KCrYdtI9VCM?si=fZGXNLQI5CtRG2-5') },
  { id: 'ma_ch10_integers_p4', title: 'Unit 10: The Other Side of Zero - Part 4', url: 'https://youtu.be/inMxYy4qMgY?si=OWHfEBv7lgqbuA4o', embedId: extractYTId('https://youtu.be/inMxYy4qMgY?si=OWHfEBv7lgqbuA4o') },
];
