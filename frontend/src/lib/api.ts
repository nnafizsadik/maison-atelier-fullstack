import { useAuth } from "../contexts/AuthContext";
import { useCallback } from "react";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export type ApiOptions = RequestInit & { auth?: boolean };

export function useApi() {
  const { token, isAuthenticated } = useAuth();

  return useCallback(
    async <T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> => {
      const headers = new Headers(opts.headers);
      headers.set("Content-Type", "application/json");

      if (opts.auth !== false && isAuthenticated) {
        if (token) headers.set("Authorization", `Bearer ${token}`);
      }

      const res = await fetch(`${API_BASE_URL}${path}`, { ...opts, headers });
      if (!res.ok) {
        let msg = `Request failed: ${res.status}`;
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {
          /* noop */
        }
        throw new Error(msg);
      }
      if (res.status === 204) return undefined as T;
      return (await res.json()) as T;
    },
    [token, isAuthenticated],
  );
}
