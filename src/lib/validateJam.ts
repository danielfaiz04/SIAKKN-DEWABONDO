import { createServerSupabaseClient } from "@/lib/supabase";

export type AbsensiJenis = "Pagi" | "Malam";

export async function validateJamAbsen(jenis: AbsensiJenis) {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase server client is not configured");
  }

  const { data, error } = await supabase
    .from("pengaturan")
    .select("jam_pagi_mulai, jam_pagi_selesai, jam_malam_mulai, jam_malam_selesai")
    .eq("id", 1)
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Pengaturan jam absensi tidak ditemukan");
  }

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  if (jenis === "Pagi") {
    return {
      allowed: currentTime >= data.jam_pagi_mulai && currentTime <= data.jam_pagi_selesai,
      start: data.jam_pagi_mulai,
      end: data.jam_pagi_selesai,
      currentTime,
    };
  }

  return {
    allowed: currentTime >= data.jam_malam_mulai && currentTime <= data.jam_malam_selesai,
    start: data.jam_malam_mulai,
    end: data.jam_malam_selesai,
    currentTime,
  };
}
