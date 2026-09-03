/* Print-register numerals for volumes, instalments, and year stamps */
const NUMERALS: Array<[number, string]> = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

export function toRoman(value: number): string {
  if (!Number.isInteger(value) || value < 1 || value > 3999) {
    return String(value);
  }
  let remainder = value;
  let out = "";
  for (const [step, glyph] of NUMERALS) {
    while (remainder >= step) {
      out += glyph;
      remainder -= step;
    }
  }
  return out;
}
