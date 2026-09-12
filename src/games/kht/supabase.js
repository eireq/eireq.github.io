import { createClient } from "@supabase/supabase-js";

const config = {
  url: import.meta.env.VITE_SUPABASE_URL || "",
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
};

export const khtOwnerId = import.meta.env.VITE_KHT_OWNER_ID || "";
export const khtDb = config.url && config.anonKey
  ? createClient(config.url, config.anonKey)
  : null;

export async function loadBracket() {
  if (!khtDb) return { data: null, error: "Supabase is not configured." };

  const { data, error } = await khtDb
    .from("kht_bracket")
    .select("bracket")
    .eq("id", 1)
    .maybeSingle();

  return { data: data?.bracket || null, error: error?.message || null };
}

export async function saveBracket(bracket) {
  if (!khtDb) return { error: "Supabase is not configured." };

  const { error } = await khtDb
    .from("kht_bracket")
    .upsert({ id: 1, bracket, updated_at: new Date().toISOString() });

  return { error: error?.message || null };
}

export function watchKhtAuth(callback) {
  if (!khtDb) return () => {};

  khtDb.auth.getSession().then(({ data }) => callback(data.session));
  const { data } = khtDb.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => data.subscription.unsubscribe();
}

export async function sendKhtLogin(email) {
  if (!khtDb) return { error: "Supabase is not configured." };

  const { error } = await khtDb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/kht` },
  });

  return { error: error?.message || null };
}

export async function signOutKht() {
  if (khtDb) await khtDb.auth.signOut();
}