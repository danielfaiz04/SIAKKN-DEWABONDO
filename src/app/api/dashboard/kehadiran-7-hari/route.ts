import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, message: "Supabase not configured" }, { status: 500 });
  }

  const today = new Date();
  const data: { date: string; count: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);

    const { data: absensiData, error } = await supabase
      .from("absensi")
      .select("id")
      .eq("tanggal", dateStr)
      .eq("jenis_absensi", "Pagi");

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    data.push({
      date: date.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      count: absensiData?.length || 0,
    });
  }

  return NextResponse.json({ ok: true, data });
}
