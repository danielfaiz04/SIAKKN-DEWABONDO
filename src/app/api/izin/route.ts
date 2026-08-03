import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, message: "Supabase server client is not configured" }, { status: 500 });
  }

  const { data, error } = await supabase.from("izin").select("*").order("tanggal_keluar", { ascending: false });
  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, message: "Supabase server client is not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { nama, nim, divisi, kategori, tanggal_keluar, jam_keluar, keperluan, foto_keluar, latitude_keluar, longitude_keluar } = body;

    if (!nama || !nim || !divisi || !kategori || !tanggal_keluar || !jam_keluar || !keperluan || !foto_keluar) {
      return NextResponse.json({ ok: false, message: "Data izin tidak lengkap" }, { status: 400 });
    }

    const { data: pengaturanData, error: pengaturanError } = await supabase.from("pengaturan").select("maks_izin_per_divisi").eq("id", 1).single();
    if (pengaturanError || !pengaturanData) {
      return NextResponse.json({ ok: false, message: pengaturanError?.message || "Pengaturan tidak ditemukan" }, { status: 500 });
    }

    const { data: existingRows, error: existingError } = await supabase
      .from("izin")
      .select("id, nama, jam_keluar")
      .eq("divisi", divisi)
      .eq("status", "Keluar");

    if (existingError) {
      return NextResponse.json({ ok: false, message: existingError.message }, { status: 500 });
    }

    const ownActive = (existingRows || []).find((row) => row.nama === nama);
    if (ownActive) {
      return NextResponse.json({ ok: false, message: "Anda sudah memiliki izin keluar aktif" }, { status: 409 });
    }

    if (kategori !== "BPH" && (existingRows || []).length >= pengaturanData.maks_izin_per_divisi) {
      const names = (existingRows || []).map((row) => `${row.nama} (${row.jam_keluar})`).join(", ");
      return NextResponse.json({ ok: false, message: `Kuota izin untuk divisi ${divisi} sudah penuh. Saat ini yang sedang keluar: ${names}` }, { status: 409 });
    }

    const { data: inserted, error: insertError } = await supabase
      .from("izin")
      .insert({
        id: `IZN-${Date.now()}`,
        nama,
        nim,
        divisi,
        kategori,
        tanggal_keluar,
        jam_keluar,
        keperluan,
        foto_keluar,
        latitude_keluar: latitude_keluar ?? null,
        longitude_keluar: longitude_keluar ?? null,
        status: "Keluar",
      })
      .select();

    if (insertError) {
      return NextResponse.json({ ok: false, message: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: inserted?.[0] });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
