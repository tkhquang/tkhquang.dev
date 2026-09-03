/* Print-register numerals for volumes and instalments; falls back to the
   arabic number past the table, which no real serial here approaches */
const ROMAN = "I II III IV V VI VII VIII IX X XI XII XIII XIV XV".split(" ");

export function toRoman(value: number): string {
  return ROMAN[value - 1] ?? String(value);
}
