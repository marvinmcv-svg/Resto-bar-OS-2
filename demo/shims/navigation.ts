import { useDemoRouter } from "../router";

export function useRouter() {
  const { push } = useDemoRouter();
  return { push, replace: push, back: () => push("/pos"), refresh: () => {}, prefetch: () => {} };
}

export function usePathname() {
  return useDemoRouter().path;
}
