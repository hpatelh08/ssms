const MIN_STANDARD = 1;
const MAX_STANDARD = 6;
const PRIMARY_STANDARD_MAX = 5;

function parseStandard(value) {
  const match = String(value ?? '').match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

function isSupportedStandard(value) {
  const standard = typeof value === 'number' ? value : parseStandard(value);
  return Number.isInteger(standard) && standard >= MIN_STANDARD && standard <= MAX_STANDARD;
}

module.exports = {
  MIN_STANDARD,
  MAX_STANDARD,
  PRIMARY_STANDARD_MAX,
  parseStandard,
  isSupportedStandard,
};
