import { atom, useAtom } from "jotai";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export const asPathAtom = atom<{ prevAsPath?: string; currentAsPath?: string }>(
  {
    currentAsPath: undefined,
    prevAsPath: undefined,
  }
);

export const useAsPathValue = () => useAtom(asPathAtom)[0];

export const useAsPathInitializer = () => {
  const pathname = usePathname();
  const [{ currentAsPath }, setAsPath] = useAtom(asPathAtom);

  useEffect(() => {
    if (!pathname) return;

    if (currentAsPath !== pathname) {
      setAsPath((prev) => ({
        currentAsPath: pathname,
        prevAsPath: prev.currentAsPath,
      }));
    }
  }, [pathname, currentAsPath, setAsPath]);
};
