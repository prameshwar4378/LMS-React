import { QueryClient } from '@tanstack/react-query';

/**
 * Global React Query client configuration.
 *
 * staleTime  – How long fetched data is considered "fresh". During this window
 *              navigating back to a page shows cached data instantly with NO
 *              background refetch.
 * gcTime     – How long inactive (unmounted) query data stays in the in-memory
 *              cache before garbage collection. After this, a revisit triggers
 *              a fresh fetch.
 * refetchOnWindowFocus – Re-fetches stale queries when the browser tab regains
 *              focus, keeping data up-to-date for front-desk operators who
 *              switch between tabs.
 * retry      – Retry failed requests once before surfacing the error.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,      // 2 minutes – cached data is fresh
      gcTime: 5 * 60 * 1000,          // 5 minutes – keep unused cache
      refetchOnWindowFocus: true,      // Auto-refresh when tab re-focused
      refetchOnMount: true,            // Refetch if data is stale on mount
      retry: 1,                        // Retry failed requests once
    },
  },
});

export default queryClient;
