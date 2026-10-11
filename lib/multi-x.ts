// ============================================
// MULTI-X FEATURE API CLIENT (temporary)
// ============================================
// Self-contained so the whole feature can be deleted in one step.
// Talks to /api/v1/x-accounts on the Axle API.
// ============================================

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "";
const BASE_URL = `${API_ORIGIN.replace(/\/$/, "")}/api/v1/x-accounts`;

export interface XAccount {
  id: string;
  xUserId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  label?: string;
  isDefault: boolean;
  status: "connected" | "disconnected" | "expired" | "error";
  source: "oauth" | "import";
  scopes: string[];
  tokenExpiresAt?: string;
  lastUsedAt?: string;
  lastError?: string;
  connectedAt: string;
}

export interface XAccountsResponse {
  enabled: boolean;
  count: number;
  defaultAccountId: string | null;
  accounts: XAccount[];
}

const token = () =>
  typeof window === "undefined" ? null : localStorage.getItem("axle_access_token");

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const accessToken = token();
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
    credentials: "include",
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in (payload as any)
        ? String((payload as any).error)
        : `HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export const multiX = {
  isEnabled: async () => {
    try {
      await request<XAccountsResponse>("/");
      return true;
    } catch (error: any) {
      if (String(error?.message || "").includes("disabled")) return false;
      throw error;
    }
  },

  list: () => request<XAccountsResponse>("/"),

  connectUrl: () => request<{ authUrl: string; redirectUri: string }>("/connect"),

  importTokens: (body: { accessToken: string; refreshToken?: string; label?: string }) =>
    request<{ account: XAccount }>("/import", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  postAll: (text: string) =>
    request<{ total: number; succeeded: number; results: any[] }>("/post-all", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  post: (id: string, text: string) =>
    request<{ ok: boolean; tweetId?: string }>(`/${id}/post`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  verify: (id: string) => request<{ ok: boolean; profile: any }>(`/${id}/verify`),

  rename: (id: string, label: string) =>
    request<{ account: XAccount }>(`/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ label }),
    }),

  setDefault: (id: string) =>
    request<{ account: XAccount }>(`/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isDefault: true }),
    }),

  remove: (id: string) => request<{ ok: boolean }>(`/${id}`, { method: "DELETE" }),
};

export default multiX;
