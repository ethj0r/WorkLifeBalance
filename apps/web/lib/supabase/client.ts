const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseAvailable = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

type SupabaseRow = Record<string, unknown>;

interface SelectResult<T> {
  data: T[] | null;
  error: { message: string } | null;
}

interface MutateResult<T> {
  data: T | null;
  error: { message: string } | null;
}

async function restRequest<T>(
  method: "GET" | "POST" | "PATCH",
  path: string,
  body?: SupabaseRow,
  params?: Record<string, string>
): Promise<{ data: T | T[] | null; error: { message: string } | null }> {
  if (!supabaseAvailable) {
    return { data: null, error: { message: "Supabase not configured" } };
  }

  const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    Prefer: method === "POST" ? "return=representation" : "return=representation",
  };

  try {
    const res = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        data: null,
        error: { message: json?.message ?? `HTTP ${res.status}` },
      };
    }

    return { data: json, error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : "Network error" },
    };
  }
}

export type Profile = {
  id: string;
  phone: string;
  display_name: string | null;
  province: string | null;
  regency: string | null;
  balance: number;
  created_at: string;
};


/**
 * Find profile by phone number.
 * Returns null if not found or Supabase not available.
 */
export async function findProfileByPhone(
  phone: string
): Promise<Profile | null> {
  const result = await restRequest<Profile>(
    "GET",
    "profiles",
    undefined,
    { phone: `eq.${phone}`, limit: "1" }
  );

  if (result.error || !result.data) return null;
  const rows = Array.isArray(result.data) ? result.data : [result.data];
  return rows[0] ?? null;
}

/**
 * Create a new profile row.
 * Uses upsert via Prefer header to avoid race conditions.
 */
export async function createProfile(
  phone: string
): Promise<Profile | null> {
  const result = await restRequest<Profile>("POST", "profiles", {
    phone,
    display_name: null,
    province: null,
    regency: null,
    balance: 0,
  });

  if (result.error || !result.data) return null;
  const rows = Array.isArray(result.data) ? result.data : [result.data];
  return rows[0] ?? null;
}

/**
 * Find or create profile by phone — safe to call after OTP success.
 */
export async function findOrCreateProfile(
  phone: string
): Promise<Profile | null> {
  const existing = await findProfileByPhone(phone);
  if (existing) return existing;
  return createProfile(phone);
}

/**
 * Update display_name, province, regency for a profile by id.
 */
export async function updateProfile(
  id: string,
  patch: { display_name: string; province: string; regency: string }
): Promise<Profile | null> {
  const result = await restRequest<Profile>(
    "PATCH",
    `profiles?id=eq.${id}`,
    patch
  );

  if (result.error || !result.data) return null;
  const rows = Array.isArray(result.data) ? result.data : [result.data];
  return rows[0] ?? null;
}