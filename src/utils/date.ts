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

/**
 * Track lengths as Spotify shows them: "3:42", or "1:02:07" for a long mix.
 */
export function formatTrackDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const paddedSeconds = String(seconds).padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${paddedSeconds}`;
  }

  return `${minutes}:${paddedSeconds}`;
}
