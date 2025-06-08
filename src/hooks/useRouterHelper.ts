import { useSelectedLayoutSegments } from "next/navigation";

export function useRouterHelper() {
  const segments = useSelectedLayoutSegments();

  /**
   * Checks if the current segments match the given pattern exactly.
   * Use null/undefined as a wildcard (matches anything in that position).
   * @param pattern Array of segment strings (or null for wildcard)
   */
  function matchSegments(checkSegments: (string | null | undefined)[]) {
    if (checkSegments.length !== segments.length) return false;
    return checkSegments.every(
      (checkSegment, index) =>
        checkSegment == null || segments[index] === checkSegment
    );
  }

  /**
   * Optionally: get a specific segment (e.g., for slug)
   */
  function getSegment(index: number) {
    return segments[index];
  }

  return {
    getSegment,
    matchSegments,
    segments,
  };
}
