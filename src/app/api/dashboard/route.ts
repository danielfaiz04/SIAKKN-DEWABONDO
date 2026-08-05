import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getTanggalWIB } from "@/lib/date";

const demoDashboard = {
  ok: true,
  data: {
    totalAnggotaAktif: 15,
    statistik: { Hadir: 0, Izin: 0, Sakit: 0, Terlambat: 0, Alpha: 0 },
    sedangIzin: 0,
    sudahKembali: 0,
    kehadiranPerDivisi: {},
    maksSlotIzin: 3,
    slotTersedia: 3,
    totalIzinHariIni: 0,
    divisiPalingDisiplin: "-",
    hadirPagi: 0,
    hadirMalam: 0,
    belumAbsenPagi: 15,
    belumAbsenMalam: 15,
    persentaseKehadiranPagi: 0,
    persentaseKehadiranMalam: 0,
    detailHadirPagi: [],
    detailHadirMalam: [],
    detailSedangIzin: [],
    detailSudahKembali: [],
    detailBelumAbsenPagi: [],
    detailBelumAbsenMalam: [],
  },
};

export async function GET() {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    console.error("Supabase client not configured - check environment variables");
    return NextResponse.json(demoDashboard);
  }

  const today = getTanggalWIB();

  const [
    { data: anggotaData, error: anggotaError }, 
    { data: absensiPagiData, error: absensiPagiError },
    { data: absensiMalamData, error: absensiMalamError },
    { data: izinData, error: izinError },
    { data: pengaturanData }
  ] = await Promise.all([
    supabase.from("anggota").select("id, nama, nim, divisi, status"),
    supabase.from("absensi").select("status, nama, nim, jam").eq("tanggal", today).eq("jenis_absensi", "Pagi"),
    supabase.from("absensi").select("status, nama, nim, jam").eq("tanggal", today).eq("jenis_absensi", "Malam"),
    supabase.from("izin").select("status, divisi, nama, jam_keluar, jam_kembali, keperluan").eq("tanggal_keluar", today),
    supabase.from("pengaturan").select("*").eq("id", 1).maybeSingle(),
  ]);

  if (anggotaError || absensiPagiError || absensiMalamError || izinError) {
    return NextResponse.json({ ok: false, message: anggotaError?.message || absensiPagiError?.message || absensiMalamError?.message || izinError?.message || "Gagal memuat dashboard" }, { status: 500 });
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
  
  // Process Pagi attendance
  for (const item of absensiPagiData || []) {
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
  const hadirPagi = absensiPagiData?.length || 0;
  const hadirMalam = absensiMalamData?.length || 0;
  const belumAbsenPagi = Math.max(0, totalAnggota - hadirPagi);
  const belumAbsenMalam = Math.max(0, totalAnggota - hadirMalam);
  const sudahKembali = izinData?.filter((item: any) => item.status === "Kembali").length || 0;
  const totalIzinHariIni = izinData?.length || 0;
  const maksSlotIzin = pengaturanData?.maks_slot_izin || 3;
  const slotTersedia = Math.max(0, maksSlotIzin - sedangIzin);
  const persentaseKehadiranPagi = totalAnggota > 0 ? Math.round((hadirPagi / totalAnggota) * 100) : 0;
  const persentaseKehadiranMalam = totalAnggota > 0 ? Math.round((hadirMalam / totalAnggota) * 100) : 0;
  
  // Calculate most disciplined division using the same nimToDivisi map
  const divisiCounts: Record<string, number> = {};
  for (const item of absensiPagiData || []) {
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

  // Prepare detailed data for modals
  const detailHadirPagi = (absensiPagiData || []).map((item: any) => ({
    nama: item.nama,
    jam: item.jam,
    status: item.status
  }));

  const detailHadirMalam = (absensiMalamData || []).map((item: any) => ({
    nama: item.nama,
    jam: item.jam,
    status: item.status
  }));

  const detailSedangIzin = (izinData || [])
    .filter((item: any) => item.status === "Keluar")
    .map((item: any) => ({
      nama: item.nama,
      divisi: item.divisi,
      jam_keluar: item.jam_keluar,
      keperluan: item.keperluan
    }));

  const detailSudahKembali = (izinData || [])
    .filter((item: any) => item.status === "Kembali")
    .map((item: any) => ({
      nama: item.nama,
      jam_kembali: item.jam_kembali || item.jam_keluar
    }));

  const allAnggotaNames = (anggotaData || [])
    .filter((a: any) => a.status === "Aktif")
    .map((a: any) => a.nama);

  const hadirPagiNames = new Set((absensiPagiData || []).map((item: any) => item.nama));
  const hadirMalamNames = new Set((absensiMalamData || []).map((item: any) => item.nama));

  const detailBelumAbsenPagi = allAnggotaNames
    .filter((nama: string) => !hadirPagiNames.has(nama))
    .map((nama: string) => ({ nama }));

  const detailBelumAbsenMalam = allAnggotaNames
    .filter((nama: string) => !hadirMalamNames.has(nama))
    .map((nama: string) => ({ nama }));

  return NextResponse.json({
    ok: true,
    data: {
      totalAnggotaAktif: totalAnggota,
      statistik,
      sedangIzin,
      sudahKembali,
      kehadiranPerDivisi,
      maksSlotIzin,
      slotTersedia,
      totalIzinHariIni,
      divisiPalingDisiplin,
      hadirPagi,
      hadirMalam,
      belumAbsenPagi,
      belumAbsenMalam,
      persentaseKehadiranPagi,
      persentaseKehadiranMalam,
      detailHadirPagi,
      detailHadirMalam,
      detailSedangIzin,
      detailSudahKembali,
      detailBelumAbsenPagi,
      detailBelumAbsenMalam,
    },
  });
}

