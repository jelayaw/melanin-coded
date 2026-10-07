const SUPABASE_URL = "https://obrkwmtgqbjrqvurozhx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_N032At_x7K-IayWxtxkBnQ_VHbuPUlB";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

window.mcSupabase = supabaseClient;