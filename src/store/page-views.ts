import { atom, useAtomValue, useSetAtom } from "jotai";

type PageViewsValue = Record<string, { unique: number; total: number }>;

export const pageViewsAtom = atom<PageViewsValue>({});

export const usePageViewsValue = () => useAtomValue(pageViewsAtom);

export const useGetPageViews = () => {
  const setPageViews = useSetAtom(pageViewsAtom);

  const getPageViews = async (pathnames: string[]) => {
    try {
      const params = new URLSearchParams();
      pathnames.forEach((pathname) => params.append("pathname", pathname));
      const response = await fetch(`/api/pageviews?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
        },
        method: "GET",
      });

      const data = await response.json();

      setPageViews((prev) => {
        return { ...prev, ...data };
      });
    } catch (error) {
      console.error(error);
      // TODO: Handle errors
    }
  };

  return getPageViews;
};
