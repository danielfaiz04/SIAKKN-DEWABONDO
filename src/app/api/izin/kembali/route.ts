import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, message: "Supabase server client is not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { nama, jam_kembali, foto_kembali, latitude_kembali, longitude_kembali } = body;

    if (!nama || !jam_kembali || !foto_kembali) {
      return NextResponse.json({ ok: false, message: "Data kembalinya tidak lengkap" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("izin")
      .update({
        status: "Kembali",
        jam_kembali,
        foto_kembali,
        latitude_kembali: latitude_kembali ?? null,
        longitude_kembali: longitude_kembali ?? null,
      })
      .eq("nama", nama)
      .eq("status", "Keluar")
      .select();

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    if (!data?.length) {
      return NextResponse.json({ ok: false, message: "Tidak ada izin keluar aktif untuk nama ini" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: data[0] });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
