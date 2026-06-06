import { AxiosError } from "axios";
import type { ApiError } from "../types";

export function parseApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    return {
      message: (data?.message as string) ?? error.message ?? "An unexpected error occurred",
      statusCode: error.response?.status ?? 0,
      errors: data?.errors as Record<string, string[]> | undefined,
    };
  }
  if (error instanceof Error) {
    return { message: error.message, statusCode: 0 };
  }
  return { message: "An unexpected error occurred", statusCode: 0 };
}

export function getErrorMessage(error: unknown, fallback?: string): string {
  return parseApiError(error).message || fallback || "Something went wrong";
}

export function getFieldErrors(error: unknown): Record<string, string[]> | undefined {
  return parseApiError(error).errors;
}
