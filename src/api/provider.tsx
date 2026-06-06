import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useState } from "react";

const STALE_TIME = 1000 * 60 * 5;
const GC_TIME = 1000 * 60 * 30;
const RETRY_COUNT = 2;

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        retry: RETRY_COUNT,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let _queryClient: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (!_queryClient) {
    _queryClient = createQueryClient();
  }
  return _queryClient;
}

export function ApiProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
