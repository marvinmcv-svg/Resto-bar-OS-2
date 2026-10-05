import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

// In-memory router for the single-file build: the artifact frame may block the History API,
// so navigation is plain React state.
interface RouterValue {
  path: string;
  push: (href: string) => void;
}

const RouterContext = createContext<RouterValue>({ path: "/resumen", push: () => {} });

export function RouterProvider({ initial, children }: { initial: string; children: ReactNode }) {
  const [path, setPath] = useState(initial);
  const push = useCallback((href: string) => {
    const clean = href.replace(/\/+$/, "") || "/";
    setPath(clean === "/" ? "/resumen" : clean);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, []);
  const value = useMemo(() => ({ path, push }), [path, push]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useDemoRouter() {
  return useContext(RouterContext);
}
