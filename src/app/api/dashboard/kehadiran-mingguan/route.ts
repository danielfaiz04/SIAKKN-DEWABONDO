import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getWeeklyRanges } from "@/lib/weeklyStats";

export async function GET() {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, message: "Supabase not configured" }, { status: 500 });
  }

  const weeklyRanges = getWeeklyRanges();
  const pagiData: { label: string; count: number; range: string }[] = [];
  const malamData: { label: string; count: number; range: string }[] = [];

  for (const week of weeklyRanges) {
    // Get Pagi attendance for this week
    const { data: pagiAbsensi, error: pagiError } = await supabase
      .from("absensi")
      .select("id")
      .gte("tanggal", week.startDate)
      .lte("tanggal", week.endDate)
      .eq("jenis_absensi", "Pagi");

    if (pagiError) {
      return NextResponse.json({ ok: false, message: pagiError.message }, { status: 500 });
    }

    pagiData.push({
      label: week.label,
      count: pagiAbsensi?.length || 0,
      range: week.displayRange
    });

    // Get Malam attendance for this week
    const { data: malamAbsensi, error: malamError } = await supabase
      .from("absensi")
      .select("id")
      .gte("tanggal", week.startDate)
      .lte("tanggal", week.endDate)
      .eq("jenis_absensi", "Malam");

    if (malamError) {
      return NextResponse.json({ ok: false, message: malamError.message }, { status: 500 });
    }

    malamData.push({
      label: week.label,
      count: malamAbsensi?.length || 0,
      range: week.displayRange
    });
  }

  return NextResponse.json({
    ok: true,
    data: {
      pagi: pagiData,
      malam: malamData
    }
  });
}
