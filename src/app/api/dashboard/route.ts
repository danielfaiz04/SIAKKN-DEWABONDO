import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

const demoDashboard = {
  ok: true,
  data: {
    totalAnggotaAktif: 2,
    statistik: { Hadir: 1, Izin: 0, Sakit: 0, Terlambat: 0, Alpha: 0 },
  },
};

export async function GET() {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    console.error("Supabase client not configured - check environment variables");
    return NextResponse.json(demoDashboard);
  }

  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: anggotaData, error: anggotaError }, 
    { data: absensiData, error: absensiError },
    { data: izinData, error: izinError },
    { data: pengaturanData, error: pengaturanError }
  ] = await Promise.all([
    supabase.from("anggota").select("id, nim, divisi, status"),
    supabase.from("absensi").select("status, nama, nim").eq("tanggal", today).eq("jenis_absensi", "Pagi"),
    supabase.from("izin").select("status, divisi").eq("tanggal_keluar", today),
    supabase.from("pengaturan").select("*").single(),
  ]);

  if (anggotaError || absensiError || izinError || pengaturanError) {
    return NextResponse.json({ ok: false, message: anggotaError?.message || absensiError?.message || izinError?.message || pengaturanError?.message || "Gagal memuat dashboard" }, { status: 500 });
  }

  const statistik = { Hadir: 0, Izin: 0, Sakit: 0, Terlambat: 0, Alpha: 0 };
  const kehadiranPerDivisi: Record<string, number> = {};
  
  // Create a map of nim to divisi from anggota data
  const nimToDivisi: Record<string, string> = {};
  for (const anggota of anggotaData || []) {
    if (anggota.nim && anggota.divisi) {
      nimToDivisi[anggota.nim] = anggota.divisi;
    }
  }
  
  for (const item of absensiData || []) {
    if (item.status in statistik) {
      statistik[item.status as keyof typeof statistik] += 1;
    }
    // Get divisi from anggota data using nim
    if (item.status === "Hadir" && item.nim && nimToDivisi[item.nim]) {
      const divisi = nimToDivisi[item.nim];
      kehadiranPerDivisi[divisi] = (kehadiranPerDivisi[divisi] || 0) + 1;
    }
  }

  const sedangIzin = izinData?.filter((item: any) => item.status === "Keluar").length || 0;
  const totalAnggota = anggotaData?.filter((a: any) => a.status === "Aktif").length || 0;
  const sudahAbsen = absensiData?.length || 0;
  const belumAbsen = totalAnggota - sudahAbsen;
  const sudahKembali = izinData?.filter((item: any) => item.status === "Kembali").length || 0;
  const totalIzinHariIni = izinData?.length || 0;
  const maksSlotIzin = pengaturanData?.maks_slot_izin || 3;
  const slotTersedia = maksSlotIzin - sedangIzin;
  const persentaseKehadiran = totalAnggota > 0 ? Math.round((sudahAbsen / totalAnggota) * 100) : 0;
  
  // Calculate most disciplined division using the same nimToDivisi map
  const divisiCounts: Record<string, number> = {};
  for (const item of absensiData || []) {
    if (item.status === "Hadir" && item.nim && nimToDivisi[item.nim]) {
      const divisi = nimToDivisi[item.nim];
      divisiCounts[divisi] = (divisiCounts[divisi] || 0) + 1;
    }
  }
  let divisiPalingDisiplin = "-";
  let maxCount = 0;
  for (const [divisi, count] of Object.entries(divisiCounts)) {
    if (count > maxCount) {
      maxCount = count;
      divisiPalingDisiplin = divisi;
    }
  }

  return NextResponse.json({
    ok: true,
    data: {
      totalAnggotaAktif: totalAnggota,
      statistik,
      sedangIzin,
      belumAbsen,
      sudahKembali,
      kehadiranPerDivisi,
      maksSlotIzin,
      slotTersedia,
      totalIzinHariIni,
      persentaseKehadiran,
      divisiPalingDisiplin,
    },
  });
}
