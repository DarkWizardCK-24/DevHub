import { env } from "@/lib/env";

/** Mirrors the backend's error shape: {"error": {code, message, details}}. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: unknown = null,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Per-field messages from a 422 response, keyed by field name. */
  get fieldErrors(): Record<string, string> {
    if (this.code !== "validation_error" || !Array.isArray(this.details)) return {};
    return Object.fromEntries((this.details as { field: string; message: string }[]).map((d) => [d.field, d.message]));
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Arrays become repeated params: {status: ["a", "b"]} gives ?status=a&status=b */
  query?: Record<string, string | number | boolean | null | undefined | string[]>;
  signal?: AbortSignal;
}

export function parseError(status: number, payload: unknown, requestId?: string | null): ApiError {
  const error = (payload as { error?: { code?: string; message?: string; details?: unknown; request_id?: string } } | null)
    ?.error;
  return new ApiError(
    status,
    error?.code ?? "http_error",
    error?.message ?? `Request failed (${status})`,
    error?.details ?? null,
    error?.request_id ?? requestId ?? undefined,
  );
}

export function buildUrl(path: string, query?: RequestOptions["query"]): URL {
  const url = new URL(`${env.apiUrl}/api${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (Array.isArray(value)) value.forEach((item) => url.searchParams.append(key, item));
    else if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  return url;
}

/**
 * Low-level request to FastAPI. Use `api` (browser) or `serverApi` (server),
 * which supply the access token.
 */
export async function request<T>(path: string, token: string | null, options: RequestOptions = {}): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined && !isFormData) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : isFormData ? (options.body as FormData) : JSON.stringify(options.body),
      signal: options.signal,
      cache: "no-store",
    });
  } catch (cause) {
    if ((cause as Error).name === "AbortError") throw cause;
    throw new ApiError(0, "network_error", "Can't reach the DevHub API. Check that the backend is running.");
  }

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);
  if (!response.ok) throw parseError(response.status, payload, response.headers.get("x-request-id"));
  return payload as T;
}
