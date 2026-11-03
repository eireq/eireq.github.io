import { createClient } from "@supabase/supabase-js";
import { QUIZ_MODE_VALUES } from "../../data/flags.js";
import { rankFlagQuizScores } from "../../data/flagQuizRanks.js";

const OFFLINE = { ok: false, error: "database not configured", rows: [] };

function cleanName(name, max) {
  return (name || "a guy").trim().slice(0, max) || "a guy";
}

function quizMode(mode) {
  return QUIZ_MODE_VALUES.includes(mode) ? mode : "countries";
}

// lane runner and flag quiz scores. without a real supabase url in the config
// everything here just answers "database not configured" and the games still run
export function createDb() {
  const db = {
    client: null,

    init() {
      const config = window.GAME_CONFIG;
      if (!config?.supabaseUrl || !config?.supabaseAnonKey) return false;
      if (config.supabaseUrl.includes("YOUR-PROJECT") || config.supabaseAnonKey.includes("YOUR_")) {
        return false;
      }
      try {
        this.client = createClient(config.supabaseUrl, config.supabaseAnonKey);
        return true;
      } catch (error) {
        console.warn("supabase init failed:", error);
        return false;
      }
    },

    ready() {
      return Boolean(this.client);
    },

    async submitScore(score) {
      if (!this.ready()) return OFFLINE;
      const { error } = await this.client.from("scores").insert({
        name: cleanName(score.name, 16),
        score: Math.max(0, Math.floor(score.score)),
        distance: Math.max(0, Math.floor(score.distance)),
        overtakes: Math.max(0, Math.floor(score.overtakes)),
        best_speed: Math.max(0, Math.floor(score.bestSpeed)),
        mode: score.mode === "bomb" ? "bomb" : "normal",
      });
      return error ? { ok: false, error: error.message } : { ok: true };
    },

    async getScores(period = "global") {
      if (!this.ready()) return OFFLINE;

      let query = this.client
        .from("scores")
        .select("name,score,distance,overtakes,best_speed,mode,created_at")
        .order("score", { ascending: false })
        .limit(50);

      if (period === "weekly") {
        // weeks start on monday, utc
        const weekStart = new Date();
        const day = weekStart.getUTCDay();
        weekStart.setUTCDate(weekStart.getUTCDate() - (day === 0 ? 6 : day - 1));
        weekStart.setUTCHours(0, 0, 0, 0);
        query = query.gte("created_at", weekStart.toISOString());
      }

      const { data, error } = await query;
      return error ? { ok: false, error: error.message, rows: [] } : { ok: true, rows: data || [] };
    },

    async submitFlagQuizScore(score, total) {
      if (!this.ready()) return OFFLINE;

      const safeTotal = Math.max(1, Math.floor(total));
      const safeScore = Math.max(0, Math.min(safeTotal, Math.floor(score.score)));
      const { data, error } = await this.client
        .from("flag_quiz_scores")
        .insert({
          name: cleanName(score.name, 30),
          score: safeScore,
          total: safeTotal,
          percentage: Math.round((safeScore / safeTotal) * 100),
          mode: quizMode(score.mode),
        })
        .select("id,name,score,total,percentage,created_at")
        .single();

      return error ? { ok: false, error: error.message } : { ok: true, row: data };
    },

    async getFlagQuizLeaderboard(limit = 50, mode = "countries") {
      if (!this.ready()) return OFFLINE;

      const safeMode = quizMode(mode);
      const cap = Math.max(1, Math.min(50, Math.floor(limit) || 50));

      const rpc = await this.client.rpc("flag_quiz_best", { p_mode: safeMode, p_limit: cap });
      if (!rpc.error && Array.isArray(rpc.data)) return { ok: true, rows: rpc.data };

      // older databases don't have flag_quiz_best yet, so sort the latest rows here instead
      const { data, error } = await this.client
        .from("flag_quiz_scores")
        .select("id,name,score,total,percentage,created_at")
        .eq("mode", safeMode)
        .order("score", { ascending: false })
        .order("percentage", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(1000);

      if (error) return { ok: false, error: error.message, rows: [] };
      return { ok: true, rows: rankFlagQuizScores(data || [], cap) };
    },
  };

  db.init();
  window.db = db;
  return db;
}
