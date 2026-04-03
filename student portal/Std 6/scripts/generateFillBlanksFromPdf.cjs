const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const PDF_PATH = path.resolve(__dirname, '../STD 06/class6_fill_in_the_blanks_1000_questions.pdf');
const OUTPUT_PATH = path.resolve(__dirname, '../data/fillBlanksQuestions.ts');

function toLines(text) {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !/^--\s*\d+\s+of\s+\d+\s*--$/i.test(line));
}

function extractQuestions(lines) {
  const answerKeyIndex = lines.findIndex(line => /^answer key$/i.test(line));
  const questionLines = (answerKeyIndex >= 0 ? lines.slice(0, answerKeyIndex) : lines)
    .filter(line => /^\d+\.\s+/.test(line))
    .filter(line => !/^level\s+\d+$/i.test(line));

  return questionLines.map(line => {
    const match = line.match(/^(\d+)\.\s+(.+)$/);
    if (!match) return null;

    return {
      id: Number(match[1]),
      prompt: match[2],
    };
  }).filter(Boolean);
}

function extractAnswers(lines) {
  const answerKeyIndex = lines.findIndex(line => /^answer key$/i.test(line));
  if (answerKeyIndex < 0) return new Map();

  return new Map(
    lines
      .slice(answerKeyIndex + 1)
      .filter(line => /^\d+\.\s+/.test(line))
      .map(line => {
        const match = line.match(/^(\d+)\.\s+(.+)$/);
        if (!match) return null;

        return [Number(match[1]), match[2]];
      })
      .filter(Boolean),
  );
}

function buildFileContent(questions) {
  const rows = questions.map(question => (
    `  { id: ${question.id}, prompt: ${JSON.stringify(question.prompt)}, answer: ${JSON.stringify(question.answer)} },`
  )).join('\n');

  return `export interface FillBlankQuestion {
  id: number;
  prompt: string;
  answer: string;
}

export const fillBlanksQuestions: FillBlankQuestion[] = [
${rows}
];

export const TOTAL_FILL_BLANK_QUESTIONS = ${questions.length};
`;
}

async function main() {
  const parser = new PDFParse({ data: fs.readFileSync(PDF_PATH) });
  const result = await parser.getText();
  await parser.destroy();

  const lines = toLines(result.text);
  const questions = extractQuestions(lines);
  const answers = extractAnswers(lines);

  const merged = questions.map(question => ({
    ...question,
    answer: answers.get(question.id) || '',
  }));

  const missingAnswers = merged.filter(question => !question.answer);
  if (missingAnswers.length > 0) {
    throw new Error(`Missing answers for ${missingAnswers.length} questions.`);
  }

  fs.writeFileSync(OUTPUT_PATH, buildFileContent(merged));
  console.log(`Generated ${merged.length} fill-in-the-blanks questions at ${OUTPUT_PATH}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
