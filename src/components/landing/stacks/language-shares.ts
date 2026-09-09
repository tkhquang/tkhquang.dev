export interface LanguageStat {
  id: string;
  name: string;
  size: number;
  color?: string;
}

export interface LanguageShare extends LanguageStat {
  percentage: number;
}

/**
 * Byte shares for one view of the chart.
 *
 * Views exclude named language sets so languages outside either set
 * remain in both filtered totals.
 *
 * The subtraction happens on the raw byte counts, before any percentage
 * exists. Deriving shares first and filtering after would leave the
 * dropped side inside the total, and its sub-1% remainder would ride back
 * into the view inside "Other".
 */
export function getLanguageShares(
  languages: LanguageStat[],
  excluded?: readonly string[]
): LanguageShare[] {
  const selected = languages.filter(
    (language) =>
      language.size > 0 &&
      Number.isFinite(language.size) &&
      !excluded?.includes(language.name)
  );
  const total = selected.reduce((sum, language) => sum + language.size, 0);
  if (total === 0) {
    return [];
  }

  const shares = selected.map((language) => ({
    ...language,
    percentage: (language.size / total) * 100,
  }));

  /* A sub-1% row cannot be read off a bar this short, so those languages
     merge into one "Other" row that still carries their bytes. Rows are
     ordered by size, not by percentage: both agree here, and size is the
     value that survives the merge. */
  const significant = shares
    .filter((language) => language.percentage >= 1)
    .sort((a, b) => b.size - a.size);
  const otherSize = shares
    .filter((language) => language.percentage < 1)
    .reduce((sum, language) => sum + language.size, 0);
  const otherShare = (otherSize / total) * 100;

  /* Below 0.05%, Other rounds to 0.0% at the chart's one decimal place.
     Hide the row without changing the total: visible shares must still
     represent their original proportion of the selected bytes. */
  if (otherShare >= 0.05) {
    significant.push({
      id: "other",
      name: "Other",
      percentage: otherShare,
      size: otherSize,
    });
  }

  return significant;
}
