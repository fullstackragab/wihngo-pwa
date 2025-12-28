import { API_URL } from "@/lib/config";

const TOKEN_KEY = "auth_token";

let authErrorHandler: (() => void) | null = null;

export function setAuthErrorHandler(handler: () => void) {
  authErrorHandler = handler;
}

export const getApiBaseUrl = (): string => {
  return API_URL;
};

const buildUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();

  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  const finalEndpoint = cleanEndpoint.startsWith("api/")
    ? cleanEndpoint.slice(4)
    : cleanEndpoint;
  const finalBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  return `${finalBaseUrl}${finalEndpoint}`;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = "ApiError";
  }
}

// Public fetch - no authentication required
export async function publicFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const absoluteUrl = buildUrl(url);

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...options.headers,
  };

  return fetch(absoluteUrl, {
    ...options,
    headers,
  });
}

export async function publicGet<T>(url: string): Promise<T> {
  const response = await publicFetch(url, { method: "GET" });

  if (!response.ok) {
    let errorData;
    const responseText = await response.text();
    try {
      errorData = JSON.parse(responseText);
    } catch {
      errorData = responseText;
    }
    throw new ApiError(response.status, response.statusText, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return await response.json();
}

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const absoluteUrl = buildUrl(url);
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

  if (!token) {
    if (authErrorHandler) {
      authErrorHandler();
    }
    throw new Error("Session expired. Please login again.");
  }

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(absoluteUrl, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (authErrorHandler) {
      authErrorHandler();
    }
    throw new Error("Session expired. Please login again.");
  }

  return response;
}

export async function authenticatedGet<T>(url: string): Promise<T> {
  const response = await authenticatedFetch(url, { method: "GET" });

  if (!response.ok) {
    let errorData;
    const responseText = await response.text();
    try {
      errorData = JSON.parse(responseText);
    } catch {
      errorData = responseText;
    }
    throw new ApiError(response.status, response.statusText, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return await response.json();
}

export async function authenticatedPost<T>(url: string, data: unknown): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorData;
    const responseText = await response.text();
    try {
      errorData = JSON.parse(responseText);
    } catch {
      errorData = responseText;
    }
    throw new ApiError(response.status, response.statusText, errorData);
  }

  if (response.status === 204 || response.status === 201) {
    const text = await response.text();
    return (text ? JSON.parse(text) : {}) as T;
  }

  return await response.json();
}

export async function authenticatedPut<T>(url: string, data: unknown): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorData;
    const responseText = await response.text();
    try {
      errorData = JSON.parse(responseText);
    } catch {
      errorData = responseText;
    }
    throw new ApiError(response.status, response.statusText, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return await response.json();
}

export async function authenticatedDelete<T>(url: string): Promise<T> {
  const response = await authenticatedFetch(url, { method: "DELETE" });

  if (!response.ok) {
    let errorData;
    const responseText = await response.text();
    try {
      errorData = JSON.parse(responseText);
    } catch {
      errorData = responseText;
    }
    throw new ApiError(response.status, response.statusText, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as T;
}

export async function authenticatedPatch<T>(url: string, data: unknown): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorData;
    const responseText = await response.text();
    try {
      errorData = JSON.parse(responseText);
    } catch {
      errorData = responseText;
    }
    throw new ApiError(response.status, response.statusText, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return await response.json();
}

export const apiHelper = {
  get: authenticatedGet,
  post: authenticatedPost,
  put: authenticatedPut,
  patch: authenticatedPatch,
  delete: authenticatedDelete,
};

export async function uploadFile<T>(
  url: string,
  file: File | Blob,
  fieldName: string = "file",
  additionalData?: Record<string, string>
): Promise<T> {
  const absoluteUrl = buildUrl(url);
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  const formData = new FormData();

  formData.append(fieldName, file);

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  const headers: HeadersInit = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(absoluteUrl, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    let errorData;
    const responseText = await response.text();
    try {
      errorData = JSON.parse(responseText);
    } catch {
      errorData = responseText;
    }
    throw new ApiError(response.status, response.statusText, errorData);
  }

  return await response.json();
}

export function saveAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

export function removeAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearAuthData(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_refresh_token");
    localStorage.removeItem("auth_token_expiry");
  }
}
