"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Loader2, MapPin } from "lucide-react";

type AnggotaOption = {
  id: string;
  nama: string;
  nim: string;
  prodi: string;
  jabatan: string;
};

type FormState = {
  nama: string;
  nim: string;
  prodi: string;
  jabatan: string;
  jenis_absensi: "Pagi" | "Malam";
  kegiatan: string;
  deskripsi_kegiatan: string;
  keterangan: string;
  latitude: number | null;
  longitude: number | null;
  device: string;
};

const jenisOptions = ["Pagi", "Malam"] as const;

export default function AbsensiForm() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [form, setForm] = useState<FormState>({
    nama: "",
    nim: "",
    prodi: "",
    jabatan: "",
    jenis_absensi: "Pagi",
    kegiatan: "",
    deskripsi_kegiatan: "",
    keterangan: "",
    latitude: null,
    longitude: null,
    device: "",
  });
  const [anggotaList, setAnggotaList] = useState<AnggotaOption[]>([]);
  const [photoBase64, setPhotoBase64] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  useEffect(() => {
    const loadAnggota = async () => {
      try {
        const response = await fetch("/api/anggota?status=aktif");
        const result = await response.json();
        setAnggotaList(result.data || []);
      } catch {
        setAnggotaList([]);
      }
    };

    loadAnggota();
    setForm((prev) => ({ ...prev, device: navigator.userAgent }));
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraOpen(true);
    } catch {
      setMessageType("error");
      setMessage("Kamera tidak tersedia atau izin diblokir.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    setPhotoBase64(canvas.toDataURL("image/jpeg", 0.9));
    setMessage("Foto berhasil ditangkap.");
    setMessageType("success");
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setMessageType("error");
      setMessage("Geolocation tidak didukung browser ini.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setMessage("Lokasi berhasil diambil.");
        setMessageType("success");
      },
      () => {
        setMessageType("error");
        setMessage("Akses lokasi ditolak.");
      },
    );
  };

  const handleNamaChange = (value: string) => {
    if (!value) {
      setForm((prev) => ({ ...prev, nama: "", nim: "", prodi: "", jabatan: "" }));
      return;
    }

    const selected = anggotaList.find((item) => item.nama === value);
    if (selected) {
      setForm((prev) => ({
        ...prev,
        nama: selected.nama,
        nim: selected.nim,
        prodi: selected.prodi,
        jabatan: selected.jabatan,
      }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!form.latitude || !form.longitude) {
      setMessageType("error");
      setMessage("Lokasi wajib diambil sebelum mengirim absensi.");
      return;
    }
    
    if (!photoBase64) {
      setMessageType("error");
      setMessage("Foto wajib diambil sebelum mengirim absensi.");
      return;
    }
    
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/absensi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, foto: photoBase64 }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Gagal mengirim absensi");
      }

      setMessage("Absensi berhasil disimpan.");
      setMessageType("success");
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const locationText = useMemo(() => {
    if (form.latitude !== null && form.longitude !== null) {
      return `${form.latitude.toFixed(6)}, ${form.longitude.toFixed(6)}`;
    }
    return "Belum ada lokasi";
  }, [form.latitude, form.longitude]);

  return (
    <main className="min-h-screen bg-[#fffdf0] px-4 py-8 text-[#1a1a1a] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="neu-card bg-[#ffeb3b] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="neu-badge inline-block bg-[#ff6b6b] px-3 py-1 text-sm">Form Absensi Harian</p>
              <h1 className="mt-2 text-3xl font-bold uppercase tracking-tight">Absensi KKN</h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6">
                Pilih nama dari daftar anggota, lalu NIM, prodi, dan jabatan akan terisi otomatis. Semua langkah dirancang agar cepat dan jelas saat dipakai di lapangan.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/izin" className="neu-btn bg-[#4ecdc4] px-4 py-2 text-sm">Izin Keluar</Link>
              <Link href="/konfirmasi-kembali" className="neu-btn bg-[#a8e6cf] px-4 py-2 text-sm">Konfirmasi Kembali</Link>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <section className="neu-card bg-white p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section: Identitas */}
              <div>
                <h3 className="text-lg font-bold uppercase mb-4 border-b-3 border-black pb-2">Identitas</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-bold uppercase">
                    Nama
                    <select required value={form.nama} onChange={(e) => handleNamaChange(e.target.value)} className="neu-input mt-2 w-full px-3 py-3 text-sm">
                      <option value="">Pilih nama anggota</option>
                      {anggotaList.map((item) => (
                        <option key={item.id} value={item.nama}>{item.nama}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-bold uppercase">
                    NIM
                    <input readOnly value={form.nim} className="neu-input mt-2 w-full px-3 py-3 text-sm bg-[#f0f0f0]" />
                  </label>
                  <label className="text-sm font-bold uppercase">
                    Program Studi
                    <input readOnly value={form.prodi} className="neu-input mt-2 w-full px-3 py-3 text-sm bg-[#f0f0f0]" />
                  </label>
                  <label className="text-sm font-bold uppercase">
                    Jabatan
                    <input readOnly value={form.jabatan} className="neu-input mt-2 w-full px-3 py-3 text-sm bg-[#f0f0f0]" />
                  </label>
                </div>
              </div>

              {/* Section: Detail */}
              <div>
                <h3 className="text-lg font-bold uppercase mb-4 border-b-3 border-black pb-2">Detail</h3>
                <div className="space-y-4">
                  <label className="text-sm font-bold uppercase">
                    Jenis Absensi
                    <select value={form.jenis_absensi} onChange={(e) => setForm({ ...form, jenis_absensi: e.target.value as "Pagi" | "Malam" })} className="neu-input mt-2 w-full px-3 py-3 text-sm">
                      {jenisOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-bold uppercase">
                    Kegiatan
                    <input value={form.kegiatan} onChange={(e) => setForm({ ...form, kegiatan: e.target.value })} className="neu-input mt-2 w-full px-3 py-3 text-sm" />
                  </label>
                  <label className="block text-sm font-bold uppercase">
                    Deskripsi Kegiatan
                    <textarea value={form.deskripsi_kegiatan} onChange={(e) => setForm({ ...form, deskripsi_kegiatan: e.target.value })} className="neu-input mt-2 min-h-24 w-full px-3 py-3 text-sm" />
                  </label>
                  <label className="block text-sm font-bold uppercase">
                    Keterangan
                    <textarea value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} className="neu-input mt-2 min-h-20 w-full px-3 py-3 text-sm" />
                  </label>
                </div>
              </div>

              {/* Section: Verifikasi */}
              <div>
                <h3 className="text-lg font-bold uppercase mb-4 border-b-3 border-black pb-2">Verifikasi</h3>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3 bg-[#95e1d3] p-4 border-3 border-black shadow-[2px_2px_0px_0px_#1a1a1a]">
                    <button type="button" onClick={requestLocation} className="neu-btn inline-flex items-center gap-2 bg-white px-4 py-2 text-sm">
                      <MapPin size={16} /> Ambil Lokasi
                    </button>
                    <button type="button" onClick={openCamera} className="neu-btn inline-flex items-center gap-2 bg-white px-4 py-2 text-sm">
                      <Camera size={16} /> Buka Kamera
                    </button>
                  </div>
                  <div className="neu-card bg-[#ffeb3b] p-4">
                    <p className="text-sm font-bold uppercase">Status Verifikasi</p>
                    <p className="mt-2 text-sm font-medium">
                      Lokasi: {form.latitude && form.longitude ? "✓ Terambil" : "✗ Belum"}
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      Foto: {photoBase64 ? "✓ Terambil" : "✗ Belum"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section: Submit */}
              <div className="pt-4 border-t-3 border-black">
                <button type="submit" disabled={isSubmitting} className="neu-btn w-full bg-[#ff6b6b] px-6 py-4 text-lg font-bold uppercase disabled:opacity-70">
                  {isSubmitting ? <span className="inline-flex items-center gap-2"><Loader2 size={20} className="animate-spin" /> Mengirim...</span> : "Kirim Absensi"}
                </button>
              </div>
            </form>
          </section>

          <aside className="space-y-4">
            <div className="neu-card bg-[#a8e6cf] p-4">
              <p className="text-sm font-bold uppercase">Status</p>
              <p className="mt-2 text-sm font-medium">{message || "Siap menerima absensi"}</p>
              <p className={`mt-3 inline-block px-3 py-1 text-sm font-bold uppercase ${messageType === "success" ? "bg-[#95e1d3]" : "bg-[#ff6b6b]"}`}>{messageType === "success" ? "Sukses" : "Perlu diperbaiki"}</p>
            </div>

            <div className="neu-card bg-[#ffeb3b] p-4">
              <p className="text-sm font-bold uppercase">Lokasi</p>
              <p className="mt-2 text-sm font-medium">{locationText}</p>
            </div>

            <div className="neu-card bg-[#ff8b94] p-4">
              <p className="text-sm font-bold uppercase">Foto</p>
              {photoBase64 ? <img src={photoBase64} alt="Foto absensi" className="mt-3 h-40 w-full border-2 border-black shadow-[2px_2px_0px_0px_#1a1a1a]" /> : <p className="mt-2 text-sm font-medium">Belum ada foto yang ditangkap.</p>}
            </div>

            {isCameraOpen && (
              <div className="neu-card bg-white p-4">
                <video ref={videoRef} className="h-48 w-full border-2 border-black shadow-[2px_2px_0px_0px_#1a1a1a]" />
                <button type="button" onClick={capturePhoto} className="neu-btn mt-3 bg-[#4ecdc4] px-4 py-2 text-sm">
                  Ambil Foto
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
