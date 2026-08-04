import { NextRequest, NextResponse } from "next/server";
import { createMockSupabaseResponse, createServerSupabaseClient } from "@/lib/supabase";
import { validateJamAbsen, AbsensiJenis } from "@/lib/validateJam";
import { getJamWIB, getTanggalWIB, getWIBDate } from "@/lib/date";
import { getWIBDate as getWIBDateUtil } from "@/lib/date";


// Sanitize input to prevent XSS
function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, "");
}

function decodeBase64ToUint8Array(base64Data: string) {
  const normalized = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
  const binary = Buffer.from(normalized, "base64");
  return new Uint8Array(binary);
}

function generateFileName(originalName: string) {
  const timestamp = getWIBDate().toISOString().replace(/[:.]/g, "-");
  const ext = originalName.split(".").pop() || "jpg";
  return `${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: true, data: [] });
  }

  const { searchParams } = new URL(request.url);
  const order = searchParams.get("order") === "desc" ? false : true;

  const { data, error } = await supabase.from("absensi").select("*").order("timestamp", { ascending: order });
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
    const { nama, nim, prodi, jabatan, jenis_absensi, kegiatan, laporan_kegiatan, keterangan, foto, latitude, longitude, device } = body;

    // Sanitize inputs
    const sanitizedNama = sanitizeInput(nama || "");
    const sanitizedNim = sanitizeInput(nim || "");
    const sanitizedProdi = sanitizeInput(prodi || "");
    const sanitizedJabatan = sanitizeInput(jabatan || "");
    const sanitizedKegiatan = kegiatan ? sanitizeInput(kegiatan) : null;
    const sanitizedLaporan = laporan_kegiatan ? sanitizeInput(laporan_kegiatan) : null;
    const sanitizedKeterangan = keterangan ? sanitizeInput(keterangan) : null;
    const sanitizedJenis = sanitizeInput(jenis_absensi || "") as AbsensiJenis;

    if (!sanitizedNama || !sanitizedNim || !sanitizedProdi || !sanitizedJabatan || !sanitizedJenis || !foto) {
      return NextResponse.json({ ok: false, message: "Data absensi tidak lengkap" }, { status: 400 });
    }

    // Validate jenis_absensi is either Pagi or Malam
    if (sanitizedJenis !== "Pagi" && sanitizedJenis !== "Malam") {
      return NextResponse.json({ ok: false, message: "Jenis absensi tidak valid (harus Pagi atau Malam)" }, { status: 400 });
    }

    const jamValidation = await validateJamAbsen(sanitizedJenis);
    if (!jamValidation.allowed) {
      return NextResponse.json(
        {
          ok: false,
          message: `Absensi ${sanitizedJenis} hanya boleh dilakukan pada jam ${jamValidation.start} - ${jamValidation.end}`,
        },
        { status: 400 },
      );
    }

    const now = getWIBDate();

    const today =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0");

    const currentTime =
      String(now.getHours()).padStart(2, "0") +
      ":" +
      String(now.getMinutes()).padStart(2, "0") +
      ":" +
      String(now.getSeconds()).padStart(2, "0");

    const fileName = generateFileName(`foto-${sanitizedNama}-${today}.jpg`);
    const photoBytes = decodeBase64ToUint8Array(foto);

    let photoUrl = foto;

    try {
      const { error: uploadError } = await supabase.storage.from("foto-absensi").upload(fileName, photoBytes, {
        contentType: "image/jpeg",
        upsert: false,
      });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from("foto-absensi").getPublicUrl(fileName);
        photoUrl = publicUrlData.publicUrl;
      }
    } catch {
      photoUrl = foto;
    }

    const id = `ABS-${Date.now()}`;
    const { error: insertError } = await supabase.from("absensi").insert({
      id,
      tanggal: getTanggalWIB(),
      jam: getJamWIB(),
      nama: sanitizedNama,
      nim: sanitizedNim,
      prodi: sanitizedProdi,
      jabatan: sanitizedJabatan,
      jenis_absensi: sanitizedJenis,
      kegiatan: sanitizedKegiatan,
      laporan_kegiatan: sanitizedLaporan,
      keterangan: sanitizedKeterangan,
      foto_url: photoUrl,
      latitude,
      longitude,
      device,
      status: "Hadir",
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ ok: false, message: `Anda sudah melakukan absensi ${jenis_absensi.toLowerCase()} hari ini` }, { status: 409 });
      }
      return NextResponse.json({ ok: false, message: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Absensi berhasil disimpan" });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
