"use client";

import { createClient } from "@/lib/supabase/client";
import { ApiError, buildUrl, parseError, request, type RequestOptions } from "./core";

async function token(): Promise<string | null> {
  const { data } = await createClient().auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * API client for Client Components. Reads the current access token from the
 * Supabase session (refreshed automatically) and attaches it to each call.
 */
async function call<T>(path: string, options?: RequestOptions) {
  return request<T>(path, await token(), options);
}

/**
 * Multipart upload with progress. fetch() can't report upload progress, so
 * this uses XMLHttpRequest. `onProgress` receives 0 to 100.
 */
async function upload<T>(path: string, form: FormData, onProgress?: (percent: number) => void): Promise<T> {
  const accessToken = await token();
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", buildUrl(path).toString());
    if (accessToken) xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      let payload: unknown = null;
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        /* non-JSON error page */
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(payload as T);
      else reject(parseError(xhr.status, payload, xhr.getResponseHeader("x-request-id")));
    };
    xhr.onerror = () => reject(new ApiError(0, "network_error", "Upload failed: can't reach the DevHub API."));
    xhr.send(form);
  });
}

export const api = {
  get: <T>(path: string, query?: RequestOptions["query"], signal?: AbortSignal) => call<T>(path, { query, signal }),
  post: <T>(path: string, body?: unknown) => call<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body: unknown) => call<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body: unknown) => call<T>(path, { method: "PUT", body }),
  delete: <T = void>(path: string) => call<T>(path, { method: "DELETE" }),
  upload,
};

export { ApiError } from "./core";

/** A user-facing message for any thrown value. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}
