export const GAME_CONFIG = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",

  // optional. if a file isn't there the game just stays quiet
  menuMusic: "/games/racing/assets/menu.mp3",
  gameMusic: "/games/racing/assets/game.mp3",
  clickSound: "/games/racing/assets/click.mp3",
};
