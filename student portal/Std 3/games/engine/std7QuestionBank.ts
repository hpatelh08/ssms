/**
 * Std 7 question banks used by the 3 game modes:
 * - Quiz Challenge (MCQ)
 * - Find the Mistake
 * - Match the Pair
 *
 * Balanced across: Maths, Science, English, Social Science, General Knowledge.
 */

export type EngineDifficulty = 'easy' | 'intermediate' | 'difficult';
export type BankDifficulty = 'easy' | 'medium' | 'hard';
export type Std7Subject = 'Maths' | 'Science' | 'English' | 'Social Science' | 'General Knowledge';

export interface Std7QuizQuestion {
  id: string;
  subject: Std7Subject;
  chapter: string;
  difficulty: BankDifficulty;
  question: string;
  options: [string, string, string, string];
  answerIndex: 0 | 1 | 2 | 3;
  realLifeHint?: string;
}

export interface Std7FindMistakeQuestion {
  id: string;
  subject: Std7Subject;
  chapter: string;
  difficulty: BankDifficulty;
  incorrectStatement: string;
  mistake: string;
  correction: string;
  explanation: string;
}

export interface Std7MatchPairQuestion {
  id: string;
  subject: Std7Subject;
  chapter: string;
  difficulty: BankDifficulty;
  left: [string, string, string];
  right: [string, string, string];
  correctMap: [0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2];
}

const mcq = (
  id: string,
  subject: Std7Subject,
  chapter: string,
  difficulty: BankDifficulty,
  question: string,
  options: [string, string, string, string],
  answerIndex: 0 | 1 | 2 | 3,
  realLifeHint?: string,
): Std7QuizQuestion => ({ id, subject, chapter, difficulty, question, options, answerIndex, realLifeHint });

const mistake = (
  id: string,
  subject: Std7Subject,
  chapter: string,
  difficulty: BankDifficulty,
  incorrectStatement: string,
  mistakeText: string,
  correction: string,
  explanation: string,
): Std7FindMistakeQuestion => ({
  id,
  subject,
  chapter,
  difficulty,
  incorrectStatement,
  mistake: mistakeText,
  correction,
  explanation,
});

const pair = (
  id: string,
  subject: Std7Subject,
  chapter: string,
  difficulty: BankDifficulty,
  left: [string, string, string],
  right: [string, string, string],
  correctMap: [0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2],
): Std7MatchPairQuestion => ({ id, subject, chapter, difficulty, left, right, correctMap });

export const STD7_QUIZ_QUESTIONS: Std7QuizQuestion[] = [
  // Maths
  mcq('mcq_math_01', 'Maths', 'Integers', 'easy', 'What is -12 + 19?', ['5', '7', '-7', '31'], 1),
  mcq('mcq_math_02', 'Maths', 'Fractions', 'easy', 'Which fraction is equivalent to 3/5?', ['6/10', '9/20', '12/25', '15/40'], 0),
  mcq('mcq_math_03', 'Maths', 'Fractions', 'medium', 'Find the sum: 2/3 + 1/6 = ?', ['1/2', '5/6', '3/6', '7/6'], 1),
  mcq('mcq_math_04', 'Maths', 'Percentages', 'medium', 'A school bag marked Rs 800 has 15% discount. What is the sale price?', ['Rs 650', 'Rs 680', 'Rs 700', 'Rs 720'], 1, 'Discounts in shops use percentages.'),
  mcq('mcq_math_05', 'Maths', 'Algebra', 'medium', 'If x = 4, then the value of 3x + 5 is:', ['12', '17', '19', '20'], 1),
  mcq('mcq_math_06', 'Maths', 'Algebra', 'easy', 'Solve: x/3 = 5', ['8', '10', '12', '15'], 3),
  mcq('mcq_math_07', 'Maths', 'Linear Equations', 'hard', 'Solve: 2(x - 3) + 5 = 17', ['x = 7', 'x = 8', 'x = 9', 'x = 10'], 0),
  mcq('mcq_math_08', 'Maths', 'Profit and Loss', 'medium', 'A pen costs Rs 40 and is sold for Rs 48. Profit percent is:', ['10%', '15%', '20%', '25%'], 2),
  mcq('mcq_math_09', 'Maths', 'Ratio and Proportion', 'easy', 'On a map, 1 cm represents 5 km. What distance does 4 cm represent?', ['9 km', '15 km', '20 km', '25 km'], 2, 'Map scales are used in navigation.'),
  mcq('mcq_math_10', 'Maths', 'Data Handling', 'hard', 'Mean of 6, 8, 10, 12, 14 is:', ['9', '10', '11', '12'], 1),

  // Science
  mcq('mcq_sci_01', 'Science', 'Human Body', 'easy', 'Which organ pumps blood to all parts of the body?', ['Lungs', 'Kidney', 'Heart', 'Liver'], 2),
  mcq('mcq_sci_02', 'Science', 'Plants', 'easy', 'During photosynthesis, plants mainly take in:', ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Hydrogen'], 1),
  mcq('mcq_sci_03', 'Science', 'Plants', 'medium', 'Xylem in plants helps in transport of:', ['Food only', 'Water and minerals', 'Oxygen only', 'Seeds'], 1),
  mcq('mcq_sci_04', 'Science', 'Heat', 'medium', 'A metal spoon in hot tea gets hot by:', ['Conduction', 'Convection', 'Radiation', 'Reflection'], 0),
  mcq('mcq_sci_05', 'Science', 'Motion', 'medium', 'If a bicycle travels 60 km in 3 hours, its speed is:', ['15 km/h', '20 km/h', '25 km/h', '30 km/h'], 1, 'Speed helps us compare moving objects.'),
  mcq('mcq_sci_06', 'Science', 'Adolescence', 'easy', 'The stage between childhood and adulthood is called:', ['Infancy', 'Adolescence', 'Old age', 'Maturity'], 1),
  mcq('mcq_sci_07', 'Science', 'Nutrition', 'medium', 'Which nutrient is mainly needed for body building?', ['Carbohydrates', 'Vitamins', 'Proteins', 'Fats'], 2),
  mcq('mcq_sci_08', 'Science', 'Motion', 'hard', 'Motion of a pendulum is an example of:', ['Random motion', 'Periodic motion', 'Rectilinear motion', 'Circular motion'], 1),
  mcq('mcq_sci_09', 'Science', 'Plants', 'medium', 'Loss of water vapour from leaves is called:', ['Respiration', 'Transpiration', 'Excretion', 'Condensation'], 1),
  mcq('mcq_sci_10', 'Science', 'Human Body', 'hard', 'Which blood component helps in clotting?', ['RBC', 'WBC', 'Platelets', 'Plasma'], 2),

  // English
  mcq('mcq_eng_01', 'English', 'Grammar', 'easy', 'Choose the noun in: "The dog chased the ball."', ['chased', 'the', 'dog', 'ball'], 2),
  mcq('mcq_eng_02', 'English', 'Vocabulary', 'easy', 'Choose the synonym of "happy".', ['sad', 'joyful', 'angry', 'weak'], 1),
  mcq('mcq_eng_03', 'English', 'Vocabulary', 'medium', 'Choose the antonym of "ancient".', ['old', 'traditional', 'modern', 'historic'], 2),
  mcq('mcq_eng_04', 'English', 'Tenses', 'medium', 'Choose the correct sentence.', ['She go to school every day.', 'She goes to school every day.', 'She going to school every day.', 'She gone to school every day.'], 1),
  mcq('mcq_eng_05', 'English', 'Grammar', 'medium', 'Select the correct option: "Each of the players ____ a medal."', ['get', 'gets', 'are getting', 'have got'], 1),
  mcq('mcq_eng_06', 'English', 'Reported Speech', 'hard', 'Change into reported speech: He said, "I am busy."', ['He said that he is busy.', 'He said that he was busy.', 'He said he busy.', 'He says that he was busy.'], 1),
  mcq('mcq_eng_07', 'English', 'Grammar', 'easy', 'Choose the adverb in: "Riya sings sweetly."', ['Riya', 'sings', 'sweetly', 'the'], 2),
  mcq('mcq_eng_08', 'English', 'Articles', 'medium', 'Choose the correct article: "She bought ___ umbrella."', ['a', 'an', 'the', 'no article'], 1),
  mcq('mcq_eng_09', 'English', 'Conjunctions', 'hard', 'Choose the correct sentence.', ['Although it was raining, but we played.', 'Although it was raining, we played.', 'Although raining, we but played.', 'Although was raining, we played.'], 1),
  mcq('mcq_eng_10', 'English', 'Idioms', 'medium', 'What does "once in a blue moon" mean?', ['every day', 'very rarely', 'at midnight', 'very quickly'], 1),

  // Social Science
  mcq('mcq_sst_01', 'Social Science', 'Geography', 'easy', 'The Tropic of Cancer passes through:', ['Sri Lanka', 'India', 'Nepal', 'Bhutan'], 1),
  mcq('mcq_sst_02', 'Social Science', 'History', 'medium', 'Who was the founder of the Mughal Empire in India?', ['Akbar', 'Humayun', 'Babur', 'Shah Jahan'], 2),
  mcq('mcq_sst_03', 'Social Science', 'Geography', 'medium', 'Most rainfall in India is brought by:', ['Northeast monsoon', 'Southwest monsoon', 'Winter winds', 'Local winds'], 1),
  mcq('mcq_sst_04', 'Social Science', 'Civics', 'medium', 'Which is a Fundamental Right in India?', ['Right to vote at any age', 'Right to property as absolute right', 'Right to freedom', 'Right to break laws'], 2),
  mcq('mcq_sst_05', 'Social Science', 'Civics', 'easy', 'Head of a Gram Panchayat is called:', ['Collector', 'Sarpanch', 'Governor', 'Councillor'], 1),
  mcq('mcq_sst_06', 'Social Science', 'Geography', 'hard', 'Which soil is most suitable for cotton cultivation in India?', ['Alluvial soil', 'Black soil', 'Desert soil', 'Mountain soil'], 1),
  mcq('mcq_sst_07', 'Social Science', 'Geography', 'medium', 'Latitude is measured in degrees from:', ['Prime Meridian', 'International Date Line', 'Equator', 'Tropic of Capricorn'], 2),
  mcq('mcq_sst_08', 'Social Science', 'History', 'medium', 'Quit India Movement was launched in:', ['1919', '1930', '1942', '1947'], 2),
  mcq('mcq_sst_09', 'Social Science', 'Civics', 'hard', 'In India, the Union Government is formed by the party or alliance that has majority in:', ['Rajya Sabha', 'Lok Sabha', 'Supreme Court', 'State Assemblies'], 1),
  mcq('mcq_sst_10', 'Social Science', 'Resources', 'easy', 'Which of the following is a renewable resource?', ['Coal', 'Petroleum', 'Solar energy', 'Natural gas'], 2),

  // General Knowledge
  mcq('mcq_gk_01', 'General Knowledge', 'Space', 'easy', 'Which planet is known as the Red Planet?', ['Venus', 'Mars', 'Jupiter', 'Mercury'], 1),
  mcq('mcq_gk_02', 'General Knowledge', 'Earth', 'easy', 'Which is the largest ocean on Earth?', ['Indian Ocean', 'Arctic Ocean', 'Pacific Ocean', 'Atlantic Ocean'], 2),
  mcq('mcq_gk_03', 'General Knowledge', 'Organizations', 'medium', 'ISRO stands for:', ['Indian Space Research Office', 'Indian Space Research Organisation', 'International Space Research Organisation', 'Indian Satellite Research Organisation'], 1),
  mcq('mcq_gk_04', 'General Knowledge', 'National Symbols', 'medium', 'The national animal of India is:', ['Lion', 'Elephant', 'Tiger', 'Leopard'], 2),
  mcq('mcq_gk_05', 'General Knowledge', 'Environment', 'medium', 'The ozone layer protects us from:', ['Visible light', 'Ultraviolet rays', 'Infrared rays', 'Radio waves'], 1),
  mcq('mcq_gk_06', 'General Knowledge', 'Calendar', 'easy', 'How many days are there in a leap year?', ['365', '366', '364', '367'], 1),
  mcq('mcq_gk_07', 'General Knowledge', 'World', 'medium', 'Currency of Japan is:', ['Won', 'Dollar', 'Yuan', 'Yen'], 3),
  mcq('mcq_gk_08', 'General Knowledge', 'Technology', 'hard', 'Who is credited as the inventor of the World Wide Web?', ['Bill Gates', 'Tim Berners-Lee', 'Steve Jobs', 'Charles Babbage'], 1),
  mcq('mcq_gk_09', 'General Knowledge', 'Games', 'medium', 'How many pieces does each player have at the start of a chess game?', ['12', '14', '16', '18'], 2),
  mcq('mcq_gk_10', 'General Knowledge', 'Space', 'hard', 'Who was the first Indian-born woman to go to space?', ['Sunita Williams', 'Kalpana Chawla', 'Ritu Karidhal', 'Tessy Thomas'], 1),
];

export const STD7_FIND_MISTAKE_QUESTIONS: Std7FindMistakeQuestion[] = [
  // Maths
  mistake('mistake_math_01', 'Maths', 'Integers', 'easy', '-8 + 3 = 11', 'Sign rule for integers is used incorrectly.', '-8 + 3 = -5', 'Adding 3 to -8 moves 3 steps toward zero.'),
  mistake('mistake_math_02', 'Maths', 'Fractions', 'easy', '5/8 is greater than 3/4.', 'Fraction comparison is wrong.', '5/8 is less than 3/4.', '3/4 is equal to 6/8, and 5/8 is smaller.'),
  mistake('mistake_math_03', 'Maths', 'Percentages', 'medium', '25% of 160 is 25.', 'Percentage value is calculated incorrectly.', '25% of 160 is 40.', '25% means one-fourth of the number.'),
  mistake('mistake_math_04', 'Maths', 'Algebra', 'medium', 'If x + 9 = 14, then x = 23.', 'Wrong operation is applied while solving.', 'If x + 9 = 14, then x = 5.', 'Subtract 9 from both sides.'),
  mistake('mistake_math_05', 'Maths', 'Fractions', 'medium', '3/5 + 1/5 = 4/10', 'Denominator is changed incorrectly.', '3/5 + 1/5 = 4/5', 'When denominators are same, only numerators are added.'),
  mistake('mistake_math_06', 'Maths', 'Perimeter', 'easy', 'Perimeter of a square of side 7 cm is 14 cm.', 'Perimeter formula is wrong.', 'Perimeter of a square of side 7 cm is 28 cm.', 'Perimeter = 4 x side.'),
  mistake('mistake_math_07', 'Maths', 'Mensuration', 'hard', 'Area of a triangle = base x height', 'Formula is incomplete.', 'Area of a triangle = 1/2 x base x height', 'Triangle area is half of rectangle area with same base and height.'),
  mistake('mistake_math_08', 'Maths', 'Ratio', 'medium', '18:24 in simplest form is 9:10.', 'Ratio simplification is incorrect.', '18:24 in simplest form is 3:4.', 'Divide both terms by 6.'),
  mistake('mistake_math_09', 'Maths', 'Data Handling', 'medium', 'Average of 6, 8 and 10 is 8.5.', 'Mean is calculated incorrectly.', 'Average of 6, 8 and 10 is 8.', '(6 + 8 + 10) / 3 = 8.'),
  mistake('mistake_math_10', 'Maths', 'Integers', 'easy', '-3 x -4 = -12', 'Multiplication of two negatives is applied wrongly.', '-3 x -4 = 12', 'Negative x negative gives positive.'),

  // Science
  mistake('mistake_sci_01', 'Science', 'Plants', 'easy', 'Plants make food only at night.', 'Photosynthesis timing is wrong.', 'Plants make food in presence of sunlight, usually in daytime.', 'Sunlight is needed for photosynthesis.'),
  mistake('mistake_sci_02', 'Science', 'Human Body', 'easy', 'Lungs pump blood to the whole body.', 'Organ function is mixed up.', 'Heart pumps blood to the whole body.', 'Lungs exchange gases; heart pumps blood.'),
  mistake('mistake_sci_03', 'Science', 'Heat', 'medium', 'Heat always flows from a colder body to a hotter body.', 'Direction of heat flow is wrong.', 'Heat flows from a hotter body to a colder body.', 'Heat transfer occurs from high to low temperature.'),
  mistake('mistake_sci_04', 'Science', 'Heat', 'medium', 'Boiling point of water at sea level is 90 degree C.', 'Temperature value is incorrect.', 'Boiling point of water at sea level is 100 degree C.', 'At normal pressure, water boils at 100 degree C.'),
  mistake('mistake_sci_05', 'Science', 'Plants', 'medium', 'Xylem carries food made by leaves.', 'Plant transport tissues are interchanged.', 'Xylem carries water and minerals; phloem carries food.', 'Xylem and phloem have different transport roles.'),
  mistake('mistake_sci_06', 'Science', 'Motion', 'hard', 'A body moving in a circle has no acceleration if speed is constant.', 'Direction change is ignored.', 'A body in circular motion has acceleration because direction changes.', 'Circular motion has centripetal acceleration.'),
  mistake('mistake_sci_07', 'Science', 'Materials', 'easy', 'Iron is a poor conductor of heat.', 'Property of metal is wrong.', 'Iron is a good conductor of heat.', 'Metals generally conduct heat well.'),
  mistake('mistake_sci_08', 'Science', 'Plants', 'medium', 'Stomata are usually found in roots.', 'Location of stomata is wrong.', 'Stomata are usually found on leaves.', 'Stomata help in gas exchange and transpiration.'),
  mistake('mistake_sci_09', 'Science', 'Nutrition', 'medium', 'Deficiency of Vitamin D causes scurvy.', 'Deficiency disease is mismatched.', 'Deficiency of Vitamin D causes rickets; Vitamin C deficiency causes scurvy.', 'Each vitamin has a specific deficiency disease.'),
  mistake('mistake_sci_10', 'Science', 'Space', 'easy', 'The Moon has its own light.', 'Source of moonlight is wrong.', 'The Moon reflects sunlight; it has no light of its own.', 'Moon appears bright due to reflected sunlight.'),

  // English
  mistake('mistake_eng_01', 'English', 'Grammar', 'easy', 'She don\'t like mangoes.', 'Subject-verb agreement is incorrect.', 'She doesn\'t like mangoes.', 'With "she", use "doesn\'t".'),
  mistake('mistake_eng_02', 'English', 'Grammar', 'easy', 'I am knowing the answer.', 'Wrong tense form is used with stative verb.', 'I know the answer.', '"Know" is usually not used in continuous tense.'),
  mistake('mistake_eng_03', 'English', 'Prepositions', 'medium', 'He is senior than me.', 'Wrong preposition is used.', 'He is senior to me.', '"Senior" takes "to", not "than".'),
  mistake('mistake_eng_04', 'English', 'Grammar', 'easy', 'The news are good.', 'Verb form is incorrect.', 'The news is good.', '"News" takes a singular verb.'),
  mistake('mistake_eng_05', 'English', 'Vocabulary', 'hard', 'This is the most unique idea.', 'Unnecessary degree marker is used.', 'This idea is unique.', '"Unique" already means one of a kind.'),
  mistake('mistake_eng_06', 'English', 'Grammar', 'medium', 'Each of the boys have submitted the homework.', 'Verb does not agree with singular subject.', 'Each of the boys has submitted the homework.', '"Each" takes singular verb.'),
  mistake('mistake_eng_07', 'English', 'Reported Speech', 'hard', 'He said that he will come yesterday.', 'Tense and time expression are inconsistent.', 'He said that he would come the previous day.', 'Reported speech usually shifts tense and time words.'),
  mistake('mistake_eng_08', 'English', 'Grammar', 'medium', 'We discussed about pollution.', 'Redundant preposition is used.', 'We discussed pollution.', '"Discuss" does not need "about" here.'),
  mistake('mistake_eng_09', 'English', 'Grammar', 'easy', 'The childs plays in park.', 'Plural noun and verb forms are incorrect.', 'The children play in the park.', '"Children" is plural and takes "play".'),
  mistake('mistake_eng_10', 'English', 'Adverbs', 'easy', 'She sings sweet.', 'Adjective is used instead of adverb.', 'She sings sweetly.', 'Adverb describes the verb "sings".'),

  // Social Science
  mistake('mistake_sst_01', 'Social Science', 'Civics', 'easy', 'India became a republic on 15 August 1947.', 'Important date is incorrect.', 'India became a republic on 26 January 1950.', '15 August is Independence Day; Republic Day is 26 January.'),
  mistake('mistake_sst_02', 'Social Science', 'Geography', 'easy', 'The Equator divides the Earth into East and West.', 'Direction pair is incorrect.', 'The Equator divides the Earth into Northern and Southern hemispheres.', 'East-West split is linked to Prime Meridian system.'),
  mistake('mistake_sst_03', 'Social Science', 'Civics', 'hard', 'Rajya Sabha members are directly elected by all citizens.', 'Election method is wrong.', 'Most Rajya Sabha members are elected by elected state legislators; some are nominated.', 'Rajya Sabha uses indirect election.'),
  mistake('mistake_sst_04', 'Social Science', 'Geography', 'medium', 'Black soil is best for tea cultivation.', 'Crop-soil relation is incorrect.', 'Black soil is ideal for cotton; tea grows better in acidic hill soils.', 'Different crops need different soil conditions.'),
  mistake('mistake_sst_05', 'Social Science', 'Geography', 'easy', 'The Great Indian Desert is in eastern India.', 'Location is wrong.', 'The Great Indian Desert is in western India.', 'It lies mainly in Rajasthan region.'),
  mistake('mistake_sst_06', 'Social Science', 'Civics', 'medium', 'Fundamental Duties are directly enforceable in court like Fundamental Rights.', 'Legal nature is misunderstood.', 'Fundamental Duties are important obligations but generally not directly enforceable like Fundamental Rights.', 'Rights and duties differ in legal enforceability.'),
  mistake('mistake_sst_07', 'Social Science', 'Geography', 'medium', 'India receives most rainfall from northeast monsoon in June.', 'Seasonal wind fact is wrong.', 'India receives most rainfall from southwest monsoon from June onward.', 'Southwest monsoon is the main rainy season.'),
  mistake('mistake_sst_08', 'Social Science', 'Civics', 'medium', 'Panchayati Raj has only two levels in India.', 'Administrative structure is incomplete.', 'Panchayati Raj generally has three levels: village, block and district.', 'It is a three-tier local self-government system.'),
  mistake('mistake_sst_09', 'Social Science', 'History', 'easy', 'The United Nations was formed in 1965.', 'Founding year is incorrect.', 'The United Nations was formed in 1945.', 'UN was established after World War II.'),
  mistake('mistake_sst_10', 'Social Science', 'Civics', 'medium', 'The normal term of Lok Sabha is 7 years.', 'Tenure is incorrect.', 'The normal term of Lok Sabha is 5 years.', 'Lok Sabha may be dissolved earlier in special situations.'),

  // General Knowledge
  mistake('mistake_gk_01', 'General Knowledge', 'World Capitals', 'easy', 'Sydney is the capital of Australia.', 'Capital city is incorrect.', 'Canberra is the capital of Australia.', 'Sydney is a major city but not the capital.'),
  mistake('mistake_gk_02', 'General Knowledge', 'Animals', 'easy', 'Elephant is the largest mammal on Earth.', 'Animal fact is incorrect.', 'Blue whale is the largest mammal on Earth.', 'Blue whale is larger than all land mammals.'),
  mistake('mistake_gk_03', 'General Knowledge', 'Computers', 'medium', 'HTML is used to style web pages.', 'Role of HTML is misstated.', 'HTML structures web pages; CSS is mainly used for styling.', 'HTML and CSS serve different purposes.'),
  mistake('mistake_gk_04', 'General Knowledge', 'Computers', 'easy', '1 byte = 4 bits.', 'Digital unit conversion is wrong.', '1 byte = 8 bits.', 'Byte is made of 8 bits.'),
  mistake('mistake_gk_05', 'General Knowledge', 'National Symbols', 'medium', 'Jana Gana Mana is the national song of India.', 'Anthem and song are confused.', 'Jana Gana Mana is the national anthem; Vande Mataram is the national song.', 'They are both important but different.'),
  mistake('mistake_gk_06', 'General Knowledge', 'Space', 'easy', 'The Sun is a planet.', 'Type of celestial body is wrong.', 'The Sun is a star.', 'Planets revolve around stars.'),
  mistake('mistake_gk_07', 'General Knowledge', 'World Geography', 'easy', 'Sahara Desert is in South America.', 'Continent is incorrect.', 'Sahara Desert is in Africa.', 'It is the largest hot desert in Africa.'),
  mistake('mistake_gk_08', 'General Knowledge', 'Physics Basics', 'medium', 'Sound travels faster than light.', 'Speed comparison is incorrect.', 'Light travels much faster than sound.', 'Lightning is seen before thunder is heard.'),
  mistake('mistake_gk_09', 'General Knowledge', 'Temperature', 'easy', '0 degree C is the boiling point of water.', 'Thermal point is incorrect.', '0 degree C is the freezing point of water.', 'At sea level, water boils at 100 degree C.'),
  mistake('mistake_gk_10', 'General Knowledge', 'Planets', 'medium', 'Mars has large rings like Saturn.', 'Planet feature is incorrect.', 'Saturn is known for large rings; Mars does not have such rings.', 'Ring systems vary across planets.'),
];
export const STD7_MATCH_PAIR_QUESTIONS: Std7MatchPairQuestion[] = [
  // Maths
  pair('pair_math_01', 'Maths', 'Fractions and Decimals', 'easy', ['1/2', '1/4', '3/4'], ['0.25', '0.75', '0.5'], [2, 0, 1]),
  pair('pair_math_02', 'Maths', 'Integers', 'medium', ['-3 + 7', '12 - 19', '-5 x -2'], ['10', '-7', '4'], [2, 1, 0]),
  pair('pair_math_03', 'Maths', 'Percentages', 'medium', ['25%', '40%', '75%'], ['3/4', '1/4', '2/5'], [1, 2, 0]),
  pair('pair_math_04', 'Maths', 'Algebra', 'hard', ['x + 5 (x=3)', '2x (x=3)', 'x^2 (x=3)'], ['6', '9', '8'], [2, 0, 1]),
  pair('pair_math_05', 'Maths', 'Geometry', 'easy', ['Triangle', 'Pentagon', 'Hexagon'], ['6 sides', '3 sides', '5 sides'], [1, 2, 0]),
  pair('pair_math_06', 'Maths', 'Units and Measurement', 'easy', ['1 km', '1 hour', '1 kg'], ['1000 g', '60 min', '1000 m'], [2, 1, 0]),
  pair('pair_math_07', 'Maths', 'Ratio', 'medium', ['8:12', '15:25', '21:28'], ['3:5', '3:4', '2:3'], [2, 0, 1]),
  pair('pair_math_08', 'Maths', 'Data Handling', 'medium', ['Mean', 'Mode', 'Median'], ['Middle value', 'Average', 'Most frequent value'], [1, 2, 0]),
  pair('pair_math_09', 'Maths', 'Angles', 'easy', ['90 degree', 'Less than 90 degree', '180 degree'], ['Straight angle', 'Right angle', 'Acute angle'], [1, 2, 0]),
  pair('pair_math_10', 'Maths', 'Mensuration', 'hard', ['Perimeter of rectangle', 'Area of rectangle', 'Circumference of circle'], ['2(l + b)', '2pi r', 'l x b'], [0, 2, 1]),

  // Science
  pair('pair_sci_01', 'Science', 'Human Body', 'easy', ['Heart', 'Lungs', 'Kidneys'], ['Filter blood', 'Pump blood', 'Gas exchange'], [1, 2, 0]),
  pair('pair_sci_02', 'Science', 'Plants', 'easy', ['Root', 'Leaf', 'Flower'], ['Photosynthesis', 'Absorbs water', 'Reproduction'], [1, 0, 2]),
  pair('pair_sci_03', 'Science', 'Heat', 'medium', ['Conduction', 'Convection', 'Radiation'], ['Sun to Earth', 'Boiling water currents', 'Metal spoon heating'], [2, 1, 0]),
  pair('pair_sci_04', 'Science', 'States of Matter', 'medium', ['Solid', 'Liquid', 'Gas'], ['Takes shape of container', 'Fixed shape', 'No fixed volume'], [1, 0, 2]),
  pair('pair_sci_05', 'Science', 'Nutrition', 'easy', ['Carbohydrates', 'Proteins', 'Vitamins'], ['Body building', 'Energy giving', 'Protective nutrients'], [1, 0, 2]),
  pair('pair_sci_06', 'Science', 'Motion', 'medium', ['Swinging pendulum', 'Car on straight road', 'Earth around Sun'], ['Rectilinear motion', 'Periodic motion', 'Revolution motion'], [1, 0, 2]),
  pair('pair_sci_07', 'Science', 'Blood', 'hard', ['RBC', 'WBC', 'Platelets'], ['Fight infection', 'Clotting', 'Carry oxygen'], [2, 0, 1]),
  pair('pair_sci_08', 'Science', 'Forces', 'medium', ['Magnetic force', 'Muscular force', 'Friction'], ['Bike brakes', 'Pulling nail with magnet', 'Pushing a cart'], [1, 2, 0]),
  pair('pair_sci_09', 'Science', 'Deficiency Diseases', 'hard', ['Vitamin C deficiency', 'Vitamin D deficiency', 'Iron deficiency'], ['Anemia', 'Rickets', 'Scurvy'], [2, 1, 0]),
  pair('pair_sci_10', 'Science', 'Ecosystem', 'easy', ['Producer', 'Consumer', 'Decomposer'], ['Green plants', 'Animals', 'Fungi'], [0, 1, 2]),

  // English
  pair('pair_eng_01', 'English', 'Parts of Speech', 'easy', ['Quickly', 'Noun', 'Beautiful'], ['Adjective', 'Adverb', 'Naming word'], [1, 2, 0]),
  pair('pair_eng_02', 'English', 'Synonyms', 'easy', ['Brave', 'Huge', 'Silent'], ['Quiet', 'Large', 'Courageous'], [2, 1, 0]),
  pair('pair_eng_03', 'English', 'Antonyms', 'medium', ['Ancient', 'Expand', 'Victory'], ['Defeat', 'Modern', 'Contract'], [1, 2, 0]),
  pair('pair_eng_04', 'English', 'Punctuation', 'easy', ['Question mark', 'Comma', 'Full stop'], ['End statement', 'Separate list items', 'Ask a question'], [2, 1, 0]),
  pair('pair_eng_05', 'English', 'Tenses', 'medium', ['I am eating', 'She played', 'They will travel'], ['Future tense', 'Present continuous', 'Past tense'], [1, 2, 0]),
  pair('pair_eng_06', 'English', 'Articles', 'medium', ['An', 'The', 'A'], ['Used before unique noun', 'Used before consonant sound', 'Used before vowel sound'], [2, 0, 1]),
  pair('pair_eng_07', 'English', 'Idioms', 'hard', ['Once in a blue moon', 'Piece of cake', 'Hit the sack'], ['Go to sleep', 'Very easy', 'Rarely'], [2, 1, 0]),
  pair('pair_eng_08', 'English', 'Conjunctions', 'medium', ['Because', 'Although', 'And'], ['Add ideas', 'Reason', 'Contrast'], [1, 2, 0]),
  pair('pair_eng_09', 'English', 'Prefixes', 'medium', ['Un-', 'Re-', 'Pre-'], ['Again', 'Before', 'Not'], [2, 0, 1]),
  pair('pair_eng_10', 'English', 'Homophones', 'hard', ['Sea', 'Flour', 'Right'], ['Correct', 'Water body', 'Powder for bread'], [1, 2, 0]),

  // Social Science
  pair('pair_sst_01', 'Social Science', 'History', 'medium', ['Mahatma Gandhi', 'Dr B R Ambedkar', 'Rani Lakshmibai'], ['Leader of 1857 revolt', 'Freedom through non-violence', 'Chairman of Drafting Committee'], [1, 2, 0]),
  pair('pair_sst_02', 'Social Science', 'Geography', 'easy', ['Plateau', 'Delta', 'Peninsula'], ['Land surrounded by water on three sides', 'Tableland', 'River deposit land at mouth'], [1, 2, 0]),
  pair('pair_sst_03', 'Social Science', 'Civics', 'medium', ['Gram Panchayat', 'State Government', 'Union Government'], ['Defence and currency', 'Local village services', 'State roads and police'], [1, 2, 0]),
  pair('pair_sst_04', 'Social Science', 'Geography', 'medium', ['Equator', 'Tropic of Cancer', 'Arctic Circle'], ['66.5 degree N', '0 degree', '23.5 degree N'], [1, 2, 0]),
  pair('pair_sst_05', 'Social Science', 'Resources', 'easy', ['Renewable resource', 'Non-renewable resource', 'Human resource'], ['Coal', 'People and skills', 'Solar energy'], [2, 0, 1]),
  pair('pair_sst_06', 'Social Science', 'Civics', 'medium', ['MLA', 'MP', 'Sarpanch'], ['Heads village panchayat', 'State legislature', 'Parliament'], [1, 2, 0]),
  pair('pair_sst_07', 'Social Science', 'Geography', 'easy', ['Weather', 'Climate', 'Humidity'], ['Water vapour in air', 'Long-term average of weather', 'Day-to-day atmospheric condition'], [2, 1, 0]),
  pair('pair_sst_08', 'Social Science', 'History', 'hard', ['Non-Cooperation Movement', 'Quit India Movement', 'Dandi March'], ['1930 Salt Satyagraha', '1942 call to end British rule', '1920 boycott movement'], [2, 1, 0]),
  pair('pair_sst_09', 'Social Science', 'Agriculture', 'medium', ['Kharif crops', 'Rabi crops', 'Zaid crops'], ['Summer short-season crops', 'Winter crops', 'Monsoon crops'], [2, 1, 0]),
  pair('pair_sst_10', 'Social Science', 'Maps', 'hard', ['Scale', 'Legend', 'Compass rose'], ['Map symbols key', 'Shows directions', 'Map distance to ground distance ratio'], [2, 0, 1]),

  // General Knowledge
  pair('pair_gk_01', 'General Knowledge', 'Countries and Currencies', 'easy', ['Japan', 'Bangladesh', 'Nepal'], ['Taka', 'Yen', 'Nepalese Rupee'], [1, 0, 2]),
  pair('pair_gk_02', 'General Knowledge', 'Inventors', 'medium', ['Telephone', 'Light bulb', 'World Wide Web'], ['Thomas Edison', 'Alexander Graham Bell', 'Tim Berners-Lee'], [1, 0, 2]),
  pair('pair_gk_03', 'General Knowledge', 'Planets', 'easy', ['Mars', 'Earth', 'Jupiter'], ['Largest planet', 'Known as blue planet', 'Known as red planet'], [2, 1, 0]),
  pair('pair_gk_04', 'General Knowledge', 'National Symbols', 'easy', ['National Animal', 'National Bird', 'National Flower'], ['Lotus', 'Peacock', 'Tiger'], [2, 1, 0]),
  pair('pair_gk_05', 'General Knowledge', 'Sports', 'medium', ['Cricket', 'Badminton', 'Football'], ['Racket and shuttle', 'Bat and ball', 'Kicked ball with goalposts'], [1, 0, 2]),
  pair('pair_gk_06', 'General Knowledge', 'Computers', 'medium', ['CPU', 'RAM', 'ROM'], ['Permanent memory', 'Main processor', 'Temporary memory'], [1, 2, 0]),
  pair('pair_gk_07', 'General Knowledge', 'Monuments', 'easy', ['Taj Mahal', 'Qutub Minar', 'Gateway of India'], ['Mumbai', 'Agra', 'Delhi'], [1, 2, 0]),
  pair('pair_gk_08', 'General Knowledge', 'Important Days', 'hard', ['World Environment Day', 'International Yoga Day', 'National Science Day (India)'], ['28 February', '21 June', '5 June'], [2, 1, 0]),
  pair('pair_gk_09', 'General Knowledge', 'Books and Authors', 'hard', ['Ramayana', 'Discovery of India', 'Wings of Fire'], ['A P J Abdul Kalam', 'Jawaharlal Nehru', 'Valmiki'], [2, 1, 0]),
  pair('pair_gk_10', 'General Knowledge', 'Abbreviations', 'medium', ['UNESCO', 'ATM', 'GPS'], ['Global Positioning System', 'Automated Teller Machine', 'UN Educational Scientific and Cultural Organization'], [2, 1, 0]),
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSample<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < count && copy.length > 0) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const DIFFICULTY_BANDS: Record<EngineDifficulty, BankDifficulty[]> = {
  easy: ['easy'],
  intermediate: ['easy', 'medium'],
  difficult: ['medium', 'hard'],
};

function byDifficulty<T extends { difficulty: BankDifficulty }>(rows: T[], difficulty: EngineDifficulty): T[] {
  const allowed = DIFFICULTY_BANDS[difficulty];
  const filtered = rows.filter(row => allowed.includes(row.difficulty));
  return filtered.length > 0 ? filtered : rows;
}

export function pickStd7QuizQuestion(difficulty: EngineDifficulty): Std7QuizQuestion {
  return randomItem(byDifficulty(STD7_QUIZ_QUESTIONS, difficulty));
}

export function pickStd7FindMistakeQuestion(difficulty: EngineDifficulty): Std7FindMistakeQuestion {
  return randomItem(byDifficulty(STD7_FIND_MISTAKE_QUESTIONS, difficulty));
}

export function pickStd7MatchPairQuestion(difficulty: EngineDifficulty): Std7MatchPairQuestion {
  return randomItem(byDifficulty(STD7_MATCH_PAIR_QUESTIONS, difficulty));
}

export function buildFindMistakeOptions(item: Std7FindMistakeQuestion): string[] {
  const distractorPool = STD7_FIND_MISTAKE_QUESTIONS
    .filter(q => q.id !== item.id)
    .map(q => q.correction)
    .filter((value, index, all) => all.indexOf(value) === index && value !== item.correction);
  const distractors = randomSample(distractorPool, 3);
  return shuffle([item.correction, ...distractors]) as [string, string, string, string];
}

const MAP_PERMS: Array<[0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2]> = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
];

function mapCode(map: [0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2]): string {
  return map
    .map((rightIndex, leftIndex) => `${leftIndex + 1}-${String.fromCharCode(65 + rightIndex)}`)
    .join(', ');
}

export function buildMatchPairOptions(item: Std7MatchPairQuestion): { options: string[]; correctAnswer: string } {
  const correct = mapCode(item.correctMap);
  const distractors = randomSample(
    MAP_PERMS.filter(perm => mapCode(perm) !== correct).map(mapCode),
    3,
  );
  return { options: shuffle([correct, ...distractors]), correctAnswer: correct };
}

function answerLetter(answerIndex: 0 | 1 | 2 | 3): 'A' | 'B' | 'C' | 'D' {
  return (['A', 'B', 'C', 'D'] as const)[answerIndex];
}

export function renderStd7QuestionBankMarkdown(): string {
  const quizRows = STD7_QUIZ_QUESTIONS.map((q, i) => {
    const letter = answerLetter(q.answerIndex);
    return [
      `Q${i + 1}. (${q.subject} - ${q.chapter} - ${q.difficulty.toUpperCase()}) ${q.question}`,
      `A) ${q.options[0]}`,
      `B) ${q.options[1]}`,
      `C) ${q.options[2]}`,
      `D) ${q.options[3]}`,
      `Answer: ${letter}`,
      '',
    ].join('\n');
  }).join('\n');

  const mistakeRows = STD7_FIND_MISTAKE_QUESTIONS.map((q, i) => [
    `Q${i + 1}. (${q.subject} - ${q.chapter} - ${q.difficulty.toUpperCase()}) ${q.incorrectStatement}`,
    `Mistake: ${q.mistake}`,
    `Correction: ${q.correction}`,
    `Explanation: ${q.explanation}`,
    '',
  ].join('\n')).join('\n');

  const pairRows = STD7_MATCH_PAIR_QUESTIONS.map((q, i) => [
    `Q${i + 1}. (${q.subject} - ${q.chapter} - ${q.difficulty.toUpperCase()})`,
    'Left:',
    `1. ${q.left[0]}`,
    `2. ${q.left[1]}`,
    `3. ${q.left[2]}`,
    '',
    'Right:',
    `A. ${q.right[0]}`,
    `B. ${q.right[1]}`,
    `C. ${q.right[2]}`,
    '',
    `Correct Matches: ${mapCode(q.correctMap)}`,
    '',
  ].join('\n')).join('\n');

  return [
    '# Std 7 Question Bank',
    '',
    `Total Quiz Challenge Questions: ${STD7_QUIZ_QUESTIONS.length}`,
    `Total Find the Mistake Questions: ${STD7_FIND_MISTAKE_QUESTIONS.length}`,
    `Total Match the Pair Questions: ${STD7_MATCH_PAIR_QUESTIONS.length}`,
    '',
    '## Game 1: Quiz Challenge (MCQ)',
    '',
    quizRows,
    '',
    '## Game 2: Find the Mistake',
    '',
    mistakeRows,
    '',
    '## Game 3: Match the Pair',
    '',
    pairRows,
    '',
  ].join('\n');
}
