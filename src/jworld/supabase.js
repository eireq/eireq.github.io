import { createClient } from "@supabase/supabase-js";

const config = {
  url: import.meta.env.VITE_SUPABASE_URL || "",
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
};

export const jworldDb =
  config.url && config.anonKey
    ? createClient(config.url, config.anonKey)
    : null;

export function isJworldConfigured() {
  return Boolean(jworldDb);
}

function rpcError(error) {
  return error?.message || "Request failed.";
}

function sessionFromRpc(data) {
  if (!data) return null;
  return {
    memberId: data.memberId,
    token: data.token,
    displayName: data.displayName,
    hasPassword: Boolean(data.hasPassword),
    isAdmin: Boolean(data.isAdmin),
  };
}

export async function joinWorld(inviteCode, displayName, password) {
  if (!jworldDb) return { data: null, error: "Supabase is not configured." };

  const { data, error } = await jworldDb.rpc("jworld_join", {
    p_invite_code: inviteCode,
    p_display_name: displayName,
    p_password: password,
  });

  return {
    data: error ? null : sessionFromRpc(data),
    error: error ? rpcError(error) : null,
  };
}

export async function loginWorld(displayName, password) {
  if (!jworldDb) return { data: null, error: "Supabase is not configured." };

  const { data, error } = await jworldDb.rpc("jworld_login", {
    p_display_name: displayName,
    p_password: password,
  });

  return {
    data: error ? null : sessionFromRpc(data),
    error: error ? rpcError(error) : null,
  };
}

export async function setWorldPassword(token, password) {
  if (!jworldDb) return { data: null, error: "Supabase is not configured." };

  const { data, error } = await jworldDb.rpc("jworld_set_password", {
    p_token: token,
    p_password: password,
  });

  return {
    data: error ? null : sessionFromRpc(data),
    error: error ? rpcError(error) : null,
  };
}

export async function listCountries(token) {
  if (!jworldDb) return { data: [], error: "Supabase is not configured." };
  if (!token) return { data: [], error: "Join jWorld to view the map." };

  const { data, error } = await jworldDb.rpc("jworld_list_countries", {
    p_token: token,
  });
  return { data: data || [], error: error ? rpcError(error) : null };
}

export async function getCountry(token, id) {
  const { data, error } = await listCountries(token);
  if (error) return { data: null, error };
  const country = (data || []).find((c) => c.id === id) || null;
  return {
    data: country,
    error: country ? null : "Country not found.",
  };
}

export async function createCountry(token, officialName, geometry, payload = {}) {
  if (!jworldDb) return { data: null, error: "Supabase is not configured." };

  const { data, error } = await jworldDb.rpc("jworld_create_country", {
    p_token: token,
    p_official_name: officialName,
    p_geometry: geometry,
    p_payload: payload,
  });

  return { data, error: error ? rpcError(error) : null };
}

export async function updateCountry(token, countryId, payload, geometry = null) {
  if (!jworldDb) return { data: null, error: "Supabase is not configured." };

  const args = {
    p_token: token,
    p_country_id: countryId,
    p_payload: payload,
  };
  if (geometry !== null) args.p_geometry = geometry;

  const { data, error } = await jworldDb.rpc("jworld_update_country", args);
  return { data, error: error ? rpcError(error) : null };
}

export async function deleteCountry(token, countryId) {
  if (!jworldDb) return { error: "Supabase is not configured." };

  const { error } = await jworldDb.rpc("jworld_delete_country", {
    p_token: token,
    p_country_id: countryId,
  });

  return { error: error ? rpcError(error) : null };
}

export function flagPublicUrl(flagPath) {
  if (!flagPath || !jworldDb) return null;
  if (/^https?:\/\//i.test(flagPath) || flagPath.startsWith("data:")) {
    return flagPath;
  }
  const { data } = jworldDb.storage.from("jworld-flags").getPublicUrl(flagPath);
  return data?.publicUrl || null;
}

export async function uploadFlag(memberId, countryId, file) {
  if (!jworldDb) return { path: null, error: "Supabase is not configured." };
  if (!file) return { path: null, error: "No file selected." };

  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const safeExt = ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)
    ? ext
    : "png";
  const path = `${memberId}/${countryId || "draft"}/${Date.now()}.${safeExt}`;

  const { error } = await jworldDb.storage
    .from("jworld-flags")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || `image/${safeExt}`,
    });

  return { path: error ? null : path, error: error ? rpcError(error) : null };
}

export async function loadWorldMeta() {
  if (!jworldDb) return { data: null, error: "Supabase is not configured." };

  const { data, error } = await jworldDb.rpc("jworld_world_meta");
  return { data, error: error ? rpcError(error) : null };
}
