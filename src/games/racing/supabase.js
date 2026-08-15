import { createClient } from '@supabase/supabase-js'

export function createDb() {
  const db = {
    client: null,

    init() {
      const c = window.GAME_CONFIG
      if (!c?.supabaseUrl || !c?.supabaseAnonKey) return false
      if (c.supabaseUrl.includes("YOUR-PROJECT") || c.supabaseAnonKey.includes("YOUR_")) return false

      try {
        this.client = createClient(c.supabaseUrl, c.supabaseAnonKey)
        return true
      } catch (error) {
        console.warn("supabase init failed:", error)
        return false
      }
    },

    ready() {
      return Boolean(this.client)
    },

    async submitScore(score) {
      if (!this.ready()) return { ok: false, error: "database not configured" }

      const name = (score.name || "a guy").trim().slice(0, 16) || "a guy"

      const { error } = await this.client.from("scores").insert({
        name,
        score: Math.max(0, Math.floor(score.score)),
        distance: Math.max(0, Math.floor(score.distance)),
        overtakes: Math.max(0, Math.floor(score.overtakes)),
        best_speed: Math.max(0, Math.floor(score.bestSpeed)),
        mode: score.mode === "bomb" ? "bomb" : "normal"
      })

      return error ? { ok: false, error: error.message } : { ok: true }
    },

    async getScores(period = "global") {
      if (!this.ready()) {
        return { ok: false, error: "database not configured", rows: [] }
      }

      let query = this.client
        .from("scores")
        .select("name,score,distance,overtakes,best_speed,mode,created_at")
        .order("score", { ascending: false })
        .limit(50)

      if (period === "weekly") {
        const weekStart = new Date()
        const day = weekStart.getUTCDay()
        const diff = day === 0 ? 6 : day - 1
        weekStart.setUTCDate(weekStart.getUTCDate() - diff)
        weekStart.setUTCHours(0, 0, 0, 0)
        query = query.gte("created_at", weekStart.toISOString())
      }

      const { data, error } = await query
      return error
        ? { ok: false, error: error.message, rows: [] }
        : { ok: true, rows: data || [] }
    }
  }

  db.init()
  window.db = db
  return db
}
