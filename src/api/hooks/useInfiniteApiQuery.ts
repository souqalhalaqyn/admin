import { InfiniteData, QueryKey, useInfiniteQuery, UseInfiniteQueryOptions, UseInfiniteQueryResult } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { getApiClient } from "../client";
import type { ApiResponse, PaginatedData } from "../types";

interface InfiniteQueryConfig<TData> {
  url: string;
  queryKey: QueryKey;
  options?: Omit<UseInfiniteQueryOptions<PaginatedData<TData>, AxiosError, InfiniteData<PaginatedData<TData>>, QueryKey>, "queryKey" | "queryFn" | "initialPageParam" | "getNextPageParam">;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  enabled?: boolean;
  pageParamKey?: string;
}

export function useInfiniteApiQuery<TData = unknown>(
  config: InfiniteQueryConfig<TData>,
): UseInfiniteQueryResult<InfiniteData<PaginatedData<TData>>, AxiosError> {
  const { url, queryKey, options, params = {}, headers, enabled, pageParamKey = "page" } = config;

  return useInfiniteQuery<PaginatedData<TData>, AxiosError, InfiniteData<PaginatedData<TData>>, QueryKey>({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const client = getApiClient();
      const response = await client.get<ApiResponse<TData[]> & { meta: PaginatedData<TData>["meta"] }>(url, {
        params: { ...params, [pageParamKey]: pageParam },
        headers,
      });
      const body = response.data;
      return {
        data: body.data ?? [],
        meta: body.meta ?? { page: pageParam as number, limit: 0, total: 0, totalPages: 0 },
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled,
    ...options,
  });
}
