import { NextResponse } from "next/server";
import { createServerSupabaseClient, getSupabaseConfig } from "@/lib/supabase";

export async function GET() {
  const config = getSupabaseConfig();

  if (!config.url || !config.hasAnonKey) {
    return NextResponse.json(
      {
        ok: false,
        message: "Supabase environment variables are not configured yet.",
        config,
      },
      { status: 500 },
    );
  }

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        message: "Server Supabase client could not be initialized.",
        config,
      },
      { status: 500 },
    );
  }

  try {
    const { error } = await supabase.from("pengaturan").select("id").limit(1);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          message: error.message,
          config,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Supabase connection is ready.",
      config,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unknown error",
        config,
      },
      { status: 500 },
    );
  }
}
