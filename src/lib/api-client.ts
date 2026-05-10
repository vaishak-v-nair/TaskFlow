"use client";

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

interface FetchJsonOptions extends RequestInit {
  redirectOnUnauthorized?: boolean;
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: FetchJsonOptions
): Promise<ApiResponse<T>> {
  const { redirectOnUnauthorized = false, ...requestInit } = init ?? {};
  const response = await fetch(input, requestInit);
  const text = await response.text();

  if (redirectOnUnauthorized && response.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login";
  }

  if (!text.trim()) {
    return {
      success: false,
      error: response.ok
        ? "The server returned an empty response."
        : `Request failed with status ${response.status}.`,
    };
  }

  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      error: "The server returned an invalid response.",
    };
  }
}
