import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// Sanitize input to prevent XSS
function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, "");
}

// Validate NIM format (numeric only, 12-15 digits)
function validateNIM(nim: string): boolean {
  return /^\d{12,15}$/.test(nim);
}

const demoAnggota = [
  { id: "AG-001", nama: "Rizky", nim: "2101001", prodi: "Teknik Informatika", jabatan: "Ketua", divisi: "Kebersihan", kategori: "BPH", nomor_hp: "081234567890", status: "Aktif" },
  { id: "AG-002", nama: "Siti", nim: "2101002", prodi: "Sistem Informasi", jabatan: "Anggota", divisi: "Konsumsi", kategori: "Anggota Divisi", nomor_hp: "081234567891", status: "Aktif" },
];

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: true, data: demoAnggota });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = supabase.from("anggota").select("*").order("nama");
  if (status === "aktif") {
    query = query.eq("status", "Aktif");
  }

  const { data, error } = await query;
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

  const body = await request.json();
  const { id, nama, nim, prodi, jabatan, divisi, kategori, nomor_hp, status } = body;

  // Sanitize inputs
  const sanitizedNama = sanitizeInput(nama || "");
  const sanitizedNim = sanitizeInput(nim || "");
  const sanitizedProdi = sanitizeInput(prodi || "");
  const sanitizedJabatan = sanitizeInput(jabatan || "");
  const sanitizedDivisi = divisi ? sanitizeInput(divisi) : null;
  const sanitizedKategori = sanitizeInput(kategori || "Anggota Divisi");
  const sanitizedNomorHp = nomor_hp ? sanitizeInput(nomor_hp) : null;
  const sanitizedStatus = sanitizeInput(status || "Aktif");

  // Validation
  if (!sanitizedNama) {
    return NextResponse.json({ ok: false, message: "Nama wajib diisi" }, { status: 400 });
  }
  if (!sanitizedNim) {
    return NextResponse.json({ ok: false, message: "NIM wajib diisi" }, { status: 400 });
  }
  if (!validateNIM(sanitizedNim)) {
    return NextResponse.json({ ok: false, message: "Format NIM tidak valid (12-15 digit angka)" }, { status: 400 });
  }
  if (!sanitizedProdi) {
    return NextResponse.json({ ok: false, message: "Prodi wajib diisi" }, { status: 400 });
  }
  if (!sanitizedJabatan) {
    return NextResponse.json({ ok: false, message: "Jabatan wajib diisi" }, { status: 400 });
  }

  // Check unique NIM
  const { data: existingNim } = await supabase.from("anggota").select("nim").eq("nim", sanitizedNim).single();
  if (existingNim) {
    return NextResponse.json({ ok: false, message: "NIM sudah terdaftar" }, { status: 400 });
  }

  // Generate ID if not provided
  const newId = id || `A${String(Date.now()).slice(-3)}`;

  const { data, error } = await supabase.from("anggota").insert({ 
    id: newId, 
    nama: sanitizedNama, 
    nim: sanitizedNim, 
    prodi: sanitizedProdi, 
    jabatan: sanitizedJabatan, 
    divisi: sanitizedDivisi, 
    kategori: sanitizedKategori, 
    nomor_hp: sanitizedNomorHp, 
    status: sanitizedStatus 
  }).select();

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}

export async function PUT(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, message: "Supabase server client is not configured" }, { status: 500 });
  }

  const body = await request.json();
  const { id, nama, nim, prodi, jabatan, divisi, kategori, nomor_hp, status } = body;

  // Sanitize inputs
  const sanitizedNama = sanitizeInput(nama || "");
  const sanitizedNim = sanitizeInput(nim || "");
  const sanitizedProdi = sanitizeInput(prodi || "");
  const sanitizedJabatan = sanitizeInput(jabatan || "");
  const sanitizedDivisi = divisi ? sanitizeInput(divisi) : null;
  const sanitizedKategori = sanitizeInput(kategori || "Anggota Divisi");
  const sanitizedNomorHp = nomor_hp ? sanitizeInput(nomor_hp) : null;
  const sanitizedStatus = sanitizeInput(status || "Aktif");

  // Validation
  if (!id) {
    return NextResponse.json({ ok: false, message: "ID anggota wajib diisi untuk edit" }, { status: 400 });
  }
  if (!sanitizedNama) {
    return NextResponse.json({ ok: false, message: "Nama wajib diisi" }, { status: 400 });
  }
  if (!sanitizedNim) {
    return NextResponse.json({ ok: false, message: "NIM wajib diisi" }, { status: 400 });
  }
  if (!validateNIM(sanitizedNim)) {
    return NextResponse.json({ ok: false, message: "Format NIM tidak valid (12-15 digit angka)" }, { status: 400 });
  }
  if (!sanitizedProdi) {
    return NextResponse.json({ ok: false, message: "Prodi wajib diisi" }, { status: 400 });
  }
  if (!sanitizedJabatan) {
    return NextResponse.json({ ok: false, message: "Jabatan wajib diisi" }, { status: 400 });
  }

  // Check unique NIM (exclude current record)
  const { data: existingNim } = await supabase.from("anggota").select("nim, id").eq("nim", sanitizedNim).single();
  if (existingNim && existingNim.id !== id) {
    return NextResponse.json({ ok: false, message: "NIM sudah terdaftar" }, { status: 400 });
  }

  const { data, error } = await supabase.from("anggota").update({ 
    nama: sanitizedNama, 
    nim: sanitizedNim, 
    prodi: sanitizedProdi, 
    jabatan: sanitizedJabatan, 
    divisi: sanitizedDivisi, 
    kategori: sanitizedKategori, 
    nomor_hp: sanitizedNomorHp, 
    status: sanitizedStatus 
  }).eq("id", id).select();

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
    return NextResponse.json({ ok: false, message: "ID anggota wajib diisi" }, { status: 400 });
  }

  const { error } = await supabase.from("anggota").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
