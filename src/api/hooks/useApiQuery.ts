import { QueryKey, useQuery, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { getApiClient } from "../client";

interface QueryConfig<TData> {
  url: string;
  queryKey: QueryKey;
  options?: Omit<UseQueryOptions<TData, AxiosError, TData, QueryKey>, "queryKey" | "queryFn">;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  enabled?: boolean;
}

export function useApiQuery<TData = unknown>(
  config: QueryConfig<TData>,
): UseQueryResult<TData, AxiosError> {
  const { url, queryKey, options, params, headers, enabled } = config;

  return useQuery<TData, AxiosError, TData, QueryKey>({
    queryKey,
    queryFn: async () => {
      const client = getApiClient();
      const response = await client.get<TData>(url, { params, headers });
      return response.data;
    },
    enabled,
    ...options,
  });
}
