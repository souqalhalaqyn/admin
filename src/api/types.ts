export interface ApiResponse<T = any> {
  success: boolean;
  status: number;
  message?: string;
  data?: T;
  error?: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  data: T[];
  meta: PageMeta;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export interface ApiConfig {
  baseURL: string;
  timeout?: number;
  token?: string;
  onUnauthorized?: () => void;
  getRefreshToken?: () => string | null;
  onRefresh?: (accessToken: string, refreshToken: string) => void;
}
