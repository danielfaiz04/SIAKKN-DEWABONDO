import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

const demoPengaturan = {
  id: 1,
  jam_pagi_mulai: "06:00",
  jam_pagi_selesai: "08:00",
  jam_malam_mulai: "19:00",
  jam_malam_selesai: "21:00",
  maks_izin_per_divisi: 2,
};

export async function GET() {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: true, data: demoPengaturan });
  }

  const { data, error } = await supabase.from("pengaturan").select("*").eq("id", 1).single();
  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}

export async function PUT(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: true, data: demoPengaturan });
  }

  const body = await request.json();
  const { jam_pagi_mulai, jam_pagi_selesai, jam_malam_mulai, jam_malam_selesai, maks_izin_per_divisi } = body;

  const { data, error } = await supabase.from("pengaturan").update({ jam_pagi_mulai, jam_pagi_selesai, jam_malam_mulai, jam_malam_selesai, maks_izin_per_divisi }).eq("id", 1).select();
  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}
