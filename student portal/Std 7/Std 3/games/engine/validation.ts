/**
 * 🧠 Centralized Answer Validation
 * ==================================
 * Single source of truth for ALL game answer checking.
 * Prevents first-question-always-wrong and null comparison bugs.
 */

/**
 * Validate answer — returns boolean or null if either value is missing.
 * Both values are trimmed and compared as strings.
 */
export function validateAnswer(
  selected: string | null | undefined,
  correct: string | null | undefined,
): boolean | null {
  if (selected === null || selected === undefined || selected === '') return null;
  if (correct === null || correct === undefined || correct === '') return null;
  return String(selected).trim() === String(correct).trim();
}
