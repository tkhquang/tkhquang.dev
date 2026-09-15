import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Use cn for Tailwind overrides; use clsx when classes only need joining.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
