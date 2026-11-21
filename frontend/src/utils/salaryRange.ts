export const MAX_SALARY_RANGE_LENGTH = 100;

const endpointPattern = /^((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?)\s*([KMB])?$/i;
const salaryRangePattern = /^(.+?)\s*-\s*(.+?)$/;

const parseEndpoint = (value: string): { whole: string; fraction: string; unit: string } | null => {
  const match = endpointPattern.exec(value.trim());
  if (!match) return null;

  const [whole, fraction = ''] = match[1].split('.');

  return {
    whole: whole.replace(/,/g, '').replace(/^0+(?=\d)/, ''),
    fraction: fraction.padEnd(2, '0'),
    unit: (match[2] || '').toUpperCase(),
  };
};

export const validateSalaryRange = (value: string): string | null => {
  if (value.length > MAX_SALARY_RANGE_LENGTH) {
    return `Salary range must not exceed ${MAX_SALARY_RANGE_LENGTH} characters.`;
  }

  const normalized = value.trim();
  if (!normalized || /^negotiable$/i.test(normalized)) return null;

  const rangeMatch = salaryRangePattern.exec(normalized);
  if (!rangeMatch) {
    return 'Enter a range such as "15M - 25M", or use "Negotiable".';
  }

  const minimum = parseEndpoint(rangeMatch[1]);
  const maximum = parseEndpoint(rangeMatch[2]);
  if (!minimum || !maximum || minimum.unit !== maximum.unit) {
    return 'Use valid numbers and the same optional K, M, or B unit on both amounts.';
  }

  const wholePartIsGreater = minimum.whole.length > maximum.whole.length
    || (minimum.whole.length === maximum.whole.length && minimum.whole > maximum.whole);
  const fractionPartIsGreater = minimum.whole === maximum.whole && minimum.fraction > maximum.fraction;
  if (wholePartIsGreater || fractionPartIsGreater) {
    return 'Minimum salary cannot exceed maximum salary.';
  }

  return null;
};
