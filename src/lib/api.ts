import { useAuthStore } from "@/stores/auth-store";

/** Prefer same-origin `/api/v1` (Next rewrite) so refresh cookies work with SameSite=Lax. */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

export class ApiError extends Error {
  code: string;
  status: number;
  details: unknown;
  requestId?: string;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
    requestId?: string,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  /** Kept for callers; BE resolves org from path params, not this header. */
  orgId?: string | null;
  auth?: boolean;
  headers?: Record<string, string>;
};

function formatErrorMessage(
  payload: { code?: string; message?: string; details?: unknown },
): string {
  if (payload.message && payload.message !== "Validation failed") {
    return payload.message;
  }
  const details = payload.details as { messages?: string[] } | undefined;
  if (details?.messages?.length) {
    return details.messages.join("; ");
  }
  return payload.message || "Request failed";
}

export async function refreshAccessToken(): Promise<string | null> {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { accessToken?: string; user?: unknown };
  if (data.accessToken) {
    useAuthStore.getState().setSession(data.accessToken, data.user as never);
    return data.accessToken;
  }
  return null;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, orgId, auth = true, headers = {} } = options;
  const token = useAuthStore.getState().accessToken;

  const doFetch = async (accessToken?: string | null) => {
    const reqHeaders: Record<string, string> = {
      ...headers,
    };
    if (body !== undefined) reqHeaders["Content-Type"] = "application/json";
    if (auth && accessToken) reqHeaders.Authorization = `Bearer ${accessToken}`;
    if (orgId) reqHeaders["X-Organization-Id"] = orgId;

    return fetch(`${API_URL}${path}`, {
      method,
      credentials: "include",
      headers: reqHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let res: Response;
  try {
    res = await doFetch(token);
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Cannot reach API server. Make sure the project is running.",
    );
  }

  if (res.status === 401 && auth) {
    const next = await refreshAccessToken();
    if (next) {
      try {
        res = await doFetch(next);
      } catch {
        throw new ApiError(
          0,
          "NETWORK_ERROR",
          "Cannot reach API server. Make sure the project is running.",
        );
      }
    } else {
      useAuthStore.getState().clearSession();
    }
  }

  if (!res.ok) {
    let payload: {
      code?: string;
      message?: string;
      details?: unknown;
      requestId?: string;
    } = {};
    try {
      payload = await res.json();
    } catch {
      // ignore
    }
    throw new ApiError(
      res.status,
      payload.code || "ERROR",
      formatErrorMessage(payload) ||
        (res.status === 502 || res.status === 504
          ? "API server unavailable. Restart the project and try again."
          : "Request failed"),
      payload.details,
      payload.requestId,
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export { API_URL };
