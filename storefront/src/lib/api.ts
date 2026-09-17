// Cliente HTTP para la API de All At Once (ver docs/CONTRACT.md)

export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("aao_token");
}

interface Options {
  method?: string;
  body?: unknown;
  auth?: boolean; // añade Bearer si hay token
  token?: string | null;
}

export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const token = opts.token !== undefined ? opts.token : opts.auth ? getToken() : null;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const data = await res.json();
      if (typeof data?.message === "string") message = data.message;
      else if (Array.isArray(data?.message)) message = data.message.join(", ");
    } catch {
      /* respuesta sin JSON */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// Alias semánticos
export const get = <T>(path: string, opts: Options = {}) => api<T>(path, opts);
export const post = <T>(path: string, body: unknown, opts: Options = {}) =>
  api<T>(path, { ...opts, method: "POST", body });
export const patch = <T>(path: string, body: unknown, opts: Options = {}) =>
  api<T>(path, { ...opts, method: "PATCH", body });
export const put = <T>(path: string, body: unknown, opts: Options = {}) =>
  api<T>(path, { ...opts, method: "PUT", body });
export const del = <T>(path: string, opts: Options = {}) =>
  api<T>(path, { ...opts, method: "DELETE" });
