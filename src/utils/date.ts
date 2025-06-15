import { format, intervalToDuration, formatDuration } from "date-fns";

export function getYearsOfExperience(start: Date | number | string) {
  const now = new Date();
  const duration = intervalToDuration({
    end: now,
    start,
  });

  return duration.years;
}

export interface GetFormattedDurationOptions {
  startDate: Date | number | string;
  endDate?: Date | number | string | null;
}

export function getFormattedDuration({
  startDate,
  endDate = null,
}: GetFormattedDurationOptions): string {
  const start = new Date(startDate);
  if (!endDate) {
    return `${format(start, "MM/yyyy")} - Present`;
  }
  const end = new Date(endDate);
  const duration = intervalToDuration({ start, end });
  const durationString = formatDuration(duration, {
    format: ["years", "months"],
  });
  return `${format(start, "MM/yyyy")} - ${format(end, "MM/yyyy")} (${durationString})`;
}
