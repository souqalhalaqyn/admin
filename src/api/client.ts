import axios, { AxiosError, AxiosInstance, CreateAxiosDefaults, InternalAxiosRequestConfig } from "axios";

import { SERVER_URL } from "@/config/constants";
import type { ApiConfig } from "./types";

let apiInstance: AxiosInstance | null = null;
let configCache: ApiConfig = {
  baseURL: (process.env.EXPO_PUBLIC_API_URL as string) ?? `${SERVER_URL}/api/v1/`,
  timeout: 15000,
};

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
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };

  if (configCache.token) {
    defaults.headers = {
      ...defaults.headers,
      Authorization: `Bearer ${configCache.token}`,
    };
  }

  const instance = axios.create(defaults);

  instance.interceptors.request.use(
    (reqConfig: InternalAxiosRequestConfig) => {
      reqConfig.headers["Accept-Language"] = "en";
      return reqConfig;
    },
    (error: AxiosError) => Promise.reject(error),
  );

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
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
