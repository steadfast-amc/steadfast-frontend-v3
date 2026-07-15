import { useEffect, useState, useCallback, DependencyList } from "react";

interface UseFetchResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

// Every list/detail page in the app was previously hand-rolling its own
// useEffect + useState(isLoading) with NO error handling at all (fixes
// UX 1) — a 500 or unreachable backend just left the page stuck loading
// forever or rendering with no data. This standardizes that: one hook,
// consistent behavior, a retry button included via ErrorState.
export function useFetch<T>(fetcher: () => Promise<T>, deps: DependencyList = []): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetcher()
      .then((result) => setData(result))
      .catch((err) => {
        setError(err?.response?.data?.error || "Could not load data — is the backend running?");
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  return { data, isLoading, error, reload };
}
