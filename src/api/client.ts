import axios, { AxiosError, AxiosInstance, create as createAxios, CreateAxiosDefaults, InternalAxiosRequestConfig } from "axios";
import i18n from "@/i18n";

import { SERVER_URL, FALLBACK_SERVER_URL } from "@/config/constants";
import type { ApiConfig } from "./types";

let apiInstance: AxiosInstance | null = null;
let configCache: ApiConfig = {
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? `${SERVER_URL}/api/v1/`,
  fallbackBaseURL: `${FALLBACK_SERVER_URL}/api/v1/`,
  timeout: 15000,
};

async function postWithFallback(path: string, data: unknown) {
  try {
    return await axios.post(`${configCache.baseURL}${path}`, data);
  } catch (error) {
    if ((error as AxiosError).response || !configCache.fallbackBaseURL) {
      throw error;
    }
    return axios.post(`${configCache.fallbackBaseURL}${path}`, data);
  }
}

let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}[] = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

export function configureApi(config: Partial<ApiConfig>) {
  configCache = { ...configCache, ...config };
  if (apiInstance) {
    apiInstance.defaults.baseURL = configCache.baseURL;
    apiInstance.defaults.timeout = configCache.timeout;
    if (config.token) {
      apiInstance.defaults.headers.common.Authorization = `Bearer ${config.token}`;
    }
  }
}

export function setApiToken(token: string | null) {
  configCache.token = token ?? undefined;
  if (apiInstance) {
    if (token) {
      apiInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete apiInstance.defaults.headers.common.Authorization;
    }
  }
}

function createApiClient(config?: Partial<ApiConfig>): AxiosInstance {
  if (config) {
    configCache = { ...configCache, ...config };
  }

  const defaults: CreateAxiosDefaults = {
    baseURL: configCache.baseURL,
    timeout: configCache.timeout,
    headers: {
      Accept: "application/json",
    },
  };

  if (configCache.token) {
    defaults.headers = {
      ...defaults.headers,
      Authorization: `Bearer ${configCache.token}`,
    };
  }

  const instance = createAxios(defaults);

  instance.interceptors.request.use(
    (reqConfig: InternalAxiosRequestConfig) => {
      const lang = i18n.language === "ar" ? "ar" : "en";
      reqConfig.headers["Accept-Language"] = lang;
      reqConfig.headers["x-app"] = "admin";
      return reqConfig;
    },
    (error: AxiosError) => Promise.reject(error),
  );

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _fallback?: boolean };

      if (!error.response && configCache.fallbackBaseURL && !originalRequest._fallback && originalRequest.baseURL?.startsWith(configCache.baseURL)) {
        originalRequest._fallback = true;
        originalRequest.baseURL = configCache.fallbackBaseURL;
        return instance(originalRequest);
      }

      if (error.response?.status === 401 && !originalRequest._retry && configCache.getRefreshToken) {
        const refreshToken = configCache.getRefreshToken();
        if (!refreshToken) {
          if (configCache.onUnauthorized) configCache.onUnauthorized();
          return Promise.reject(error);
        }

        if (isRefreshing) {
          return new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return instance(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const response = await postWithFallback("auth/refresh", { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          setApiToken(accessToken);
          processQueue(null, accessToken);

          if (configCache.onRefresh) {
            configCache.onRefresh(accessToken, newRefreshToken);
          }

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          // Only logout on actual auth rejection (401), not on network errors
          if ((refreshError as AxiosError)?.response?.status === 401 && configCache.onUnauthorized) {
            configCache.onUnauthorized();
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      if (error.response?.status === 401 && configCache.onUnauthorized) {
        configCache.onUnauthorized();
      }
      return Promise.reject(error);
    },
  );

  apiInstance = instance;
  return instance;
}

export function getApiClient(): AxiosInstance {
  if (!apiInstance) {
    apiInstance = createApiClient();
  }
  return apiInstance;
}

export function resetApiClient() {
  apiInstance = null;
}
