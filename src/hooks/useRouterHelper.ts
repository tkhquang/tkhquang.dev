import { useSelectedLayoutSegments } from "next/navigation";

export function useRouterHelper() {
  const segments = useSelectedLayoutSegments();

  /**
   * The one matcher both helpers share: exact length, null/undefined as a
   * wildcard in that position.
   */
  function segmentsMatch(
    actualSegments: string[],
    checkSegments: (string | null | undefined)[]
  ) {
    if (checkSegments.length !== actualSegments.length) return false;
    return checkSegments.every(
      (checkSegment, index) =>
        checkSegment == null || actualSegments[index] === checkSegment
    );
  }

  /**
   * Checks if the current segments match the given pattern exactly.
   * Use null/undefined as a wildcard (matches anything in that position).
   * @param pattern Array of segment strings (or null for wildcard)
   */
  function matchSegments(checkSegments: (string | null | undefined)[]) {
    return segmentsMatch(segments, checkSegments);
  }

  /**
   * matchSegments for an arbitrary path string (e.g. a stored prevAsPath)
   * instead of the current route. Query strings, hashes, and trailing
   * slashes are ignored.
   */
  function matchPathSegments(
    path: string | null | undefined,
    checkSegments: (string | null | undefined)[]
  ) {
    if (path == null) return false;
    return segmentsMatch(
      path.split(/[?#]/)[0].split("/").filter(Boolean),
      checkSegments
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
    matchPathSegments,
    matchSegments,
    segments,
  };
}
