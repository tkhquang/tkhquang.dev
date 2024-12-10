import { intervalToDuration } from "date-fns";

export function getYearsOfExperience(start: Date | number | string) {
  const now = new Date();
  const duration = intervalToDuration({
    end: now,
    start,
  });

  return duration.years;
}
