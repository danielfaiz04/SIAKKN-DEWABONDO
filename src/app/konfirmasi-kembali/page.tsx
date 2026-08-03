"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, MapPin } from "lucide-react";
import Link from "next/link";

type IzinItem = {
  id: string;
  nama: string;
  nim: string;
  divisi: string;
  tanggal_keluar: string;
  jam_keluar: string;
  keperluan: string;
  status: string;
};

export default function KonfirmasiKembaliPage() {
  const [izinList, setIzinList] = useState<IzinItem[]>([]);
  const [selectedIzin, setSelectedIzin] = useState<IzinItem | null>(null);
  const [photoBase64, setPhotoBase64] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadIzinKeluar();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  async function loadIzinKeluar() {
    try {
      const response = await fetch("/api/izin");
      const result = await response.json();
      const keluarList = (result.data || []).filter((item: IzinItem) => item.status === "Keluar");
      setIzinList(keluarList);
    } catch {
      setIzinList([]);
    }
  }

  async function requestLocation() {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
    } catch {
      setMessageType("error");
      setMessage("Gagal mengambil lokasi.");
    }
  }

  async function openCamera() {
    const video = document.getElementById("kembali-video") as HTMLVideoElement | null;
    if (!video) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();
      setIsCameraOpen(true);
    } catch {
      setMessageType("error");
      setMessage("Kamera tidak tersedia atau izin diblokir.");
    }
  }

  async function capturePhoto() {
    const video = document.getElementById("kembali-video") as HTMLVideoElement | null;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setPhotoBase64(dataUrl);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setIsCameraOpen(false);
  }

  async function handleKonfirmasiKembali() {
    if (!selectedIzin) {
      setMessageType("error");
      setMessage("Pilih izin yang ingin dikonfirmasi kembali.");
      return;
    }
    
    if (!latitude || !longitude) {
      setMessageType("error");
      setMessage("Lokasi wajib diambil.");
      return;
    }
    
    if (!photoBase64) {
      setMessageType("error");
      setMessage("Foto wajib diambil.");
      return;
    }
    
    setIsSubmitting(true);
    setMessage("");

    try {
      const now = new Date();
      const jamKembali = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
      
      const response = await fetch("/api/izin/kembali", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: selectedIzin.nama,
          jam_kembali: jamKembali,
          foto_kembali: photoBase64,
          latitude_kembali: latitude,
          longitude_kembali: longitude,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Gagal mengkonfirmasi kembali");
      }

      setMessage("Konfirmasi kembali berhasil.");
      setMessageType("success");
      setSelectedIzin(null);
      setPhotoBase64("");
      setLatitude(null);
      setLongitude(null);
      loadIzinKeluar();
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffdf0] px-4 py-8 text-[#1a1a1a] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="neu-card bg-[#a8e6cf] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="neu-badge inline-block bg-[#4ecdc4] px-3 py-1 text-sm">Konfirmasi Kembali</p>
              <h1 className="mt-2 text-3xl font-bold uppercase tracking-tight">Konfirmasi Kembali ke Posko</h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6">
                Pilih izin yang masih berstatus Keluar, lalu ambil lokasi dan foto untuk konfirmasi kembali.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/" className="neu-btn bg-[#95e1d3] px-4 py-2 text-sm">Absensi Harian</Link>
              <Link href="/izin" className="neu-btn bg-[#4ecdc4] px-4 py-2 text-sm">Izin Keluar</Link>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="neu-card bg-white p-6">
            <h3 className="text-lg font-bold uppercase mb-4 border-b-3 border-black pb-2">Daftar Izin Keluar</h3>
            {izinList.length === 0 ? (
              <p className="text-sm font-medium">Tidak ada anggota yang sedang izin keluar.</p>
            ) : (
              <div className="space-y-3">
                {izinList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedIzin(item)}
                    className={`p-4 border-2 border-black cursor-pointer transition ${
                      selectedIzin?.id === item.id ? "bg-[#ffeb3b] shadow-[2px_2px_0px_0px_#1a1a1a]" : "bg-[#f0f0f0]"
                    }`}
                  >
                    <p className="font-bold uppercase">{item.nama}</p>
                    <p className="text-sm">{item.divisi}</p>
                    <p className="text-sm">Keluar: {item.jam_keluar}</p>
                    <p className="text-sm">Keperluan: {item.keperluan}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="neu-card bg-white p-6">
            <h3 className="text-lg font-bold uppercase mb-4 border-b-3 border-black pb-2">Verifikasi Kembali</h3>
            {!selectedIzin ? (
              <p className="text-sm font-medium">Pilih izin dari daftar sebelah kiri.</p>
            ) : (
              <div className="space-y-4">
                <div className="neu-card bg-[#ffeb3b] p-4">
                  <p className="font-bold uppercase">{selectedIzin.nama}</p>
                  <p className="text-sm">{selectedIzin.divisi}</p>
                  <p className="text-sm">Keluar: {selectedIzin.jam_keluar}</p>
                </div>

                <div className="space-y-3">
                  <button type="button" onClick={requestLocation} className="neu-btn w-full inline-flex items-center justify-center gap-2 bg-white px-4 py-3 text-sm">
                    <MapPin size={16} /> Ambil Lokasi
                  </button>
                  <button type="button" onClick={openCamera} className="neu-btn w-full inline-flex items-center justify-center gap-2 bg-white px-4 py-3 text-sm">
                    <Camera size={16} /> Buka Kamera
                  </button>
                  {isCameraOpen && (
                    <button type="button" onClick={capturePhoto} className="neu-btn w-full inline-flex items-center justify-center gap-2 bg-[#4ecdc4] px-4 py-3 text-sm">
                      <Camera size={16} /> Ambil Foto
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="neu-card bg-black p-4">
                    <video id="kembali-video" autoPlay playsInline muted className="h-64 w-full object-cover" />
                  </div>
                  {photoBase64 && (
                    <div className="neu-card bg-white p-4">
                      <p className="text-sm font-bold uppercase mb-2">Foto yang Diambil</p>
                      <img src={photoBase64} alt="Captured" className="w-full h-64 object-cover border-3 border-black" />
                    </div>
                  )}
                </div>

                <div className="neu-card bg-[#95e1d3] p-4">
                  <p className="text-sm font-bold uppercase">Status Verifikasi</p>
                  <p className="mt-2 text-sm font-medium">
                    Lokasi: {latitude && longitude ? "✓ Terambil" : "✗ Belum"}
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    Foto: {photoBase64 ? "✓ Terambil" : "✗ Belum"}
                  </p>
                </div>

                {message && (
                  <div className={`neu-card p-3 ${messageType === "success" ? "bg-[#95e1d3]" : "bg-[#ff6b6b]"}`}>
                    <p className="text-sm font-bold uppercase">{message}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleKonfirmasiKembali}
                  disabled={isSubmitting}
                  className="neu-btn w-full bg-[#ff6b6b] px-6 py-4 text-lg font-bold uppercase disabled:opacity-70"
                >
                  {isSubmitting ? <span className="inline-flex items-center gap-2"><Loader2 size={20} className="animate-spin" /> Memproses...</span> : "Saya Sudah Kembali"}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
