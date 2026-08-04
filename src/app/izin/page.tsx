"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, MapPin } from "lucide-react";

type AnggotaOption = {
  id: string;
  nama: string;
  nim: string;
  prodi: string;
  jabatan: string;
  divisi: string;
};

export default function IzinPage() {
  const [anggotaList, setAnggotaList] = useState<AnggotaOption[]>([]);
  const [form, setForm] = useState({
    nama: "",
    nim: "",
    divisi: "",
    kategori: "Anggota Divisi",
    tanggal_keluar: "",
    jam_keluar: "",
    keperluan: "",
    foto_keluar: "",
    latitude_keluar: null as number | null,
    longitude_keluar: null as number | null,
  });
  const [photoBase64, setPhotoBase64] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const streamRef = useRef<MediaStream | null>(null);
  const [slotTersedia, setSlotTersedia] = useState(3);
  const [maksSlotIzin, setMaksSlotIzin] = useState(3);

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

    const loadSlotData = async () => {
      try {
        const [dashboardRes, izinRes] = await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/izin"),
        ]);
        const dashboardResult = await dashboardRes.json();
        const izinResult = await izinRes.json();
        
        if (dashboardResult.ok) {
          setMaksSlotIzin(dashboardResult.data.maksSlotIzin || 3);
        }
        
        // Calculate actual slot availability from izin data
        const izinData = izinResult.data || [];
        const today = new Date().toISOString().slice(0, 10);
        const sedangIzin = izinData.filter((item: any) => 
          item.status === "Keluar" && item.tanggal_keluar === today
        ).length;
        
        const maksSlot = dashboardResult.data?.maksSlotIzin || 3;
        setSlotTersedia(maksSlot - sedangIzin);
      } catch {
        setSlotTersedia(3);
        setMaksSlotIzin(3);
      }
    };

    loadAnggota();
    loadSlotData();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleNamaChange = (value: string) => {
    const selected = anggotaList.find((item) => item.nama === value);
    if (selected) {
      setForm((prev) => ({
        ...prev,
        nama: selected.nama,
        nim: selected.nim,
        divisi: selected.divisi,
      }));
    } else {
      setForm((prev) => ({ ...prev, nama: "", nim: "", divisi: "" }));
    }
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
          latitude_keluar: position.coords.latitude,
          longitude_keluar: position.coords.longitude,
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

  const capturePhoto = () => {
    const video = document.getElementById("izin-video") as HTMLVideoElement | null;
    if (!video) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setPhotoBase64(dataUrl);
    setForm((prev) => ({ ...prev, foto_keluar: dataUrl }));
    setMessage("Foto berhasil ditangkap.");
    setMessageType("success");
  };

  const openCamera = async () => {
    const video = document.getElementById("izin-video") as HTMLVideoElement | null;
    if (!video) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();
    } catch {
      setMessageType("error");
      setMessage("Kamera tidak tersedia atau izin diblokir.");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (slotTersedia <= 0) {
      setMessageType("error");
      setMessage(`Slot izin penuh. Maksimal ${maksSlotIzin} orang. Tunggu salah satu anggota kembali.`);
      return;
    }
    
    if (!form.latitude_keluar || !form.longitude_keluar) {
      setMessageType("error");
      setMessage("Lokasi wajib diambil sebelum mengirim izin.");
      return;
    }
    
    if (!photoBase64) {
      setMessageType("error");
      setMessage("Foto wajib diambil sebelum mengirim izin.");
      return;
    }
    
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/izin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, foto_keluar: photoBase64 }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Gagal mengirim izin keluar");
      }

      setMessage("Izin keluar berhasil disimpan.");
      setMessageType("success");
      setSlotTersedia(slotTersedia - 1);
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fffdf0] px-4 py-8 text-[#1a1a1a] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="neu-card bg-[#ff8b94] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="neu-badge inline-block bg-[#ff6b6b] px-3 py-1 text-sm">Form Izin Keluar</p>
              <h1 className="mt-2 text-3xl font-bold uppercase tracking-tight">Izin Keluar KKN</h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6">
                Isi izin keluar secara terpisah dari absensi harian agar pencatatan lebih jelas dan lebih mudah dipantau.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/" className="neu-btn bg-[#95e1d3] px-4 py-2 text-sm">Absensi Harian</Link>
              <Link href="/konfirmasi-kembali" className="neu-btn bg-[#a8e6cf] px-4 py-2 text-sm">Konfirmasi Kembali</Link>
            </div>
          </div>
        </section>
        <div className="neu-card bg-[#ffeb3b] p-4">
          <p className="text-sm font-bold uppercase">Slot Izin Tersedia</p>
          <p className="mt-2 text-3xl font-bold">{slotTersedia} / {maksSlotIzin}</p>
          {slotTersedia <= 0 && (
            <p className="mt-2 text-sm font-bold text-[#ff6b6b]">Slot penuh. Tunggu anggota kembali.</p>
          )}
        </div>

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
                  Divisi
                  <input readOnly value={form.divisi} className="neu-input mt-2 w-full px-3 py-3 text-sm bg-[#f0f0f0]" />
                </label>
                <label className="text-sm font-bold uppercase">
                  Kategori
                  <select value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} className="neu-input mt-2 w-full px-3 py-3 text-sm">
                    <option value="Anggota Divisi">Anggota Divisi</option>
                    <option value="BPH">BPH</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Section: Detail */}
            <div>
              <h3 className="text-lg font-bold uppercase mb-4 border-b-3 border-black pb-2">Detail</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-bold uppercase">
                  Tanggal Keluar
                  <input type="date" required value={form.tanggal_keluar} onChange={(e) => setForm({ ...form, tanggal_keluar: e.target.value })} className="neu-input mt-2 w-full px-3 py-3 text-sm" />
                </label>
                <label className="text-sm font-bold uppercase">
                  Jam Keluar
                  <input type="time" required value={form.jam_keluar} onChange={(e) => setForm({ ...form, jam_keluar: e.target.value })} className="neu-input mt-2 w-full px-3 py-3 text-sm" />
                </label>
              </div>
              <label className="block text-sm font-bold uppercase mt-4">
                Keperluan
                <textarea value={form.keperluan} onChange={(e) => setForm({ ...form, keperluan: e.target.value })} className="neu-input mt-2 min-h-24 w-full px-3 py-3 text-sm" />
              </label>
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
                  <button type="button" onClick={capturePhoto} className="neu-btn inline-flex items-center gap-2 bg-white px-4 py-2 text-sm">
                    <Camera size={16} /> Ambil Foto
                  </button>
                </div>
                <div className="neu-card bg-[#ffeb3b] p-4">
                  <p className="text-sm font-bold uppercase">Status Verifikasi</p>
                  <p className="mt-2 text-sm font-medium">
                    Lokasi: {form.latitude_keluar && form.longitude_keluar ? "✓ Terambil" : "✗ Belum"}
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    Foto: {photoBase64 ? "✓ Terambil" : "✗ Belum"}
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="neu-card bg-black p-4">
                    <div className="overflow-hidden rounded border-3 border-black shadow-[2px_2px_0px_0px_#1a1a1a]">
                      <video 
                        id="izin-video" 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full object-contain bg-black"
                        style={{ maxHeight: '300px' }}
                      />
                    </div>
                  </div>
                  {photoBase64 && (
                    <div className="neu-card bg-white p-4">
                      <p className="text-sm font-bold uppercase mb-2">Foto yang Diambil</p>
                      <div className="overflow-hidden rounded border-3 border-black shadow-[2px_2px_0px_0px_#1a1a1a]">
                        <img 
                          src={photoBase64} 
                          alt="Captured" 
                          className="w-full object-contain"
                          style={{ maxHeight: '300px' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section: Submit */}
            <div className="pt-4 border-t-3 border-black">
              <button type="submit" disabled={isSubmitting} className="neu-btn w-full bg-[#ff6b6b] px-6 py-4 text-lg font-bold uppercase disabled:opacity-70">
                {isSubmitting ? <span className="inline-flex items-center gap-2"><Loader2 size={20} className="animate-spin" /> Mengirim...</span> : "Ajukan Izin"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
