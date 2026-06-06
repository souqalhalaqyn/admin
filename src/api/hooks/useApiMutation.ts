import { useMutation, UseMutationOptions, UseMutationResult } from "@tanstack/react-query";
import { AxiosError, AxiosResponse } from "axios";
import { getApiClient } from "../client";

type HttpMethod = "post" | "put" | "patch" | "delete";

interface MutationConfig<TData, TVariables> {
  method?: HttpMethod;
  url: string;
  options?: UseMutationOptions<TData, AxiosError, TVariables>;
  headers?: Record<string, string>;
}

export function useApiMutation<TData = unknown, TVariables = unknown>(
  config: MutationConfig<TData, TVariables>,
): UseMutationResult<TData, AxiosError, TVariables> {
  const { method = "post", url, options, headers } = config;

  return useMutation<TData, AxiosError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const client = getApiClient();
      let response: AxiosResponse<TData>;
      switch (method) {
        case "post":
          response = await client.post<TData>(url, variables, { headers });
          break;
        case "put":
          response = await client.put<TData>(url, variables, { headers });
          break;
        case "patch":
          response = await client.patch<TData>(url, variables, { headers });
          break;
        case "delete":
          response = await client.delete<TData>(url, { data: variables, headers });
          break;
      }
      return response.data;
    },
    ...options,
  });
}

export function usePostMutation<TData = unknown, TVariables = unknown>(
  url: string,
  options?: UseMutationOptions<TData, AxiosError, TVariables>,
) {
  return useApiMutation<TData, TVariables>({ method: "post", url, options });
}

export function usePutMutation<TData = unknown, TVariables = unknown>(
  url: string,
  options?: UseMutationOptions<TData, AxiosError, TVariables>,
) {
  return useApiMutation<TData, TVariables>({ method: "put", url, options });
}

export function usePatchMutation<TData = unknown, TVariables = unknown>(
  url: string,
  options?: UseMutationOptions<TData, AxiosError, TVariables>,
) {
  return useApiMutation<TData, TVariables>({ method: "patch", url, options });
}

export function useDeleteMutation<TData = unknown, TVariables = unknown>(
  url: string,
  options?: UseMutationOptions<TData, AxiosError, TVariables>,
) {
  return useApiMutation<TData, TVariables>({ method: "delete", url, options });
}
