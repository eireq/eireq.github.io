import { createClient } from '@supabase/supabase-js'

export function createDb() {
  const db = {
    client: null,

    init() {
      const c = window.GAME_CONFIG

      if (!c?.supabaseUrl || !c?.supabaseAnonKey) {
        return false
      }

      if (
        c.supabaseUrl.includes("YOUR-PROJECT") ||
        c.supabaseAnonKey.includes("YOUR_")
      ) {
        return false
      }

      try {
        this.client = createClient(
          c.supabaseUrl,
          c.supabaseAnonKey
        )

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
      if (!this.ready()) {
        return {
          ok: false,
          error: "database not configured"
        }
      }

      const name =
        (score.name || "a guy")
          .trim()
          .slice(0, 16) || "a guy"

      const { error } = await this.client
        .from("scores")
        .insert({
          name,
          score: Math.max(0, Math.floor(score.score)),
          distance: Math.max(0, Math.floor(score.distance)),
          overtakes: Math.max(0, Math.floor(score.overtakes)),
          best_speed: Math.max(0, Math.floor(score.bestSpeed)),
          mode: score.mode === "bomb" ? "bomb" : "normal"
        })

      return error
        ? { ok: false, error: error.message }
        : { ok: true }
    },

    async getScores(period = "global") {
      if (!this.ready()) {
        return {
          ok: false,
          error: "database not configured",
          rows: []
        }
      }

      let query = this.client
        .from("scores")
        .select(
          "name,score,distance,overtakes,best_speed,mode,created_at"
        )
        .order("score", { ascending: false })
        .limit(50)

      if (period === "weekly") {
        const weekStart = new Date()
        const day = weekStart.getUTCDay()
        const diff = day === 0 ? 6 : day - 1

        weekStart.setUTCDate(
          weekStart.getUTCDate() - diff
        )

        weekStart.setUTCHours(0, 0, 0, 0)

        query = query.gte(
          "created_at",
          weekStart.toISOString()
        )
      }

      const { data, error } = await query

      return error
        ? {
            ok: false,
            error: error.message,
            rows: []
          }
        : {
            ok: true,
            rows: data || []
          }
    },

    async submitFlagQuizScore(score, total) {
      if (!this.ready()) {
        return {
          ok: false,
          error: "database not configured"
        }
      }

      const name =
        (score.name || "a guy")
          .trim()
          .slice(0, 30) || "a guy"

      const safeTotal = Math.max(
        1,
        Math.floor(total)
      )

      const safeScore = Math.max(
        0,
        Math.min(
          safeTotal,
          Math.floor(score.score)
        )
      )

      const percentage = Math.round(
        (safeScore / safeTotal) * 100
      )

      const { data, error } = await this.client
        .from("flag_quiz_scores")
        .insert({
          name,
          score: safeScore,
          total: safeTotal,
          percentage
        })
        .select(
          "id,name,score,total,percentage,created_at"
        )
        .single()

      if (error) {
        return {
          ok: false,
          error: error.message
        }
      }

      return {
        ok: true,
        row: data
      }
    },

    async getFlagQuizLeaderboard(limit = 50) {
      if (!this.ready()) {
        return {
          ok: false,
          error: "database not configured",
          rows: []
        }
      }

      const { data, error } = await this.client
        .from("flag_quiz_scores")
        .select(
          "id,name,score,total,percentage,created_at"
        )
        .order("percentage", {
          ascending: false
        })
        .order("score", {
          ascending: false
        })
        .order("created_at", {
          ascending: true
        })
        .limit(limit)

      if (error) {
        return {
          ok: false,
          error: error.message,
          rows: []
        }
      }

      return {
        ok: true,
        rows: data || []
      }
    }
  }

  db.init()
  window.db = db

  return db
}