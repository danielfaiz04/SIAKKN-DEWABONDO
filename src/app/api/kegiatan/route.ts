import { NextRequest, NextResponse } from "next/server";
import { createMockSupabaseResponse, createServerSupabaseClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: true, data: [
      { id: "demo-1", tanggal: "2026-08-01", nama_kegiatan: "Penyambutan KKN", status: "Aktif" },
    ] });
  }

  const { data, error } = await supabase.from("master_kegiatan").select("*").order("tanggal", { ascending: false });
  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: true, data: [{ id: "demo-1", tanggal: "2026-08-01", nama_kegiatan: "Penyambutan KKN", status: "Aktif" }] });
  }

  const body = await request.json();
  const { id, tanggal, nama_kegiatan, status } = body;
  const { data, error } = await supabase.from("master_kegiatan").insert({ id, tanggal, nama_kegiatan, status }).select();
  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}

export async function DELETE(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, message: "Supabase server client is not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, message: "ID kegiatan wajib diisi" }, { status: 400 });
  }

  const { error } = await supabase.from("master_kegiatan").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
