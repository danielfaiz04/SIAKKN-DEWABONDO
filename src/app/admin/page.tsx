"use client";

import { useEffect, useState } from "react";
import DashboardCharts from "@/components/DashboardCharts";
import DashboardCard from "@/components/DashboardCard";
import DashboardModal from "@/components/DashboardModal";
import { exportToExcel } from "@/lib/exportExcel";

type AnggotaItem = {
  id: string;
  nama: string;
  nim: string;
  prodi: string;
  jabatan: string;
  divisi: string;
  kategori: string;
  nomor_hp: string;
  status: string;
};

export default function AdminPage() {
  const [anggota, setAnggota] = useState<AnggotaItem[]>([]);
  const [kegiatan, setKegiatan] = useState<any[]>([]);
  const [absensi, setAbsensi] = useState<any[]>([]);
  const [izin, setIzin] = useState<any[]>([]);
  const [pengaturan, setPengaturan] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterTanggal, setFilterTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterIzinTanggal, setFilterIzinTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [filterIzinStatus, setFilterIzinStatus] = useState("Semua");
  const [searchIzinNama, setSearchIzinNama] = useState("");
  const [searchAnggotaNama, setSearchAnggotaNama] = useState("");
  const [searchAbsensiNama, setSearchAbsensiNama] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: "anggota" | "kegiatan" } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState({
    id: "",
    nama: "",
    nim: "",
    prodi: "",
    jabatan: "",
    divisi: "",
    kategori: "Anggota Divisi",
    nomor_hp: "",
    status: "Aktif",
  });
  const [kegiatanForm, setKegiatanForm] = useState({
    id: "",
    tanggal: "",
    nama_kegiatan: "",
    status: "Aktif",
  });

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);

  async function loadData() {
    try {
      const [anggotaRes, kegiatanRes, absensiRes, izinRes, pengaturanRes, dashboardRes] = await Promise.all([
        fetch("/api/anggota"),
        fetch("/api/kegiatan"),
        fetch("/api/absensi?order=desc"),
        fetch("/api/izin"),
        fetch("/api/pengaturan"),
        fetch("/api/dashboard"),
      ]);
      
      // Parse responses with error handling
      let anggotaData, kegiatanData, absensiData, izinData, pengaturanData, dashboardData;
      
      try {
        anggotaData = await anggotaRes.json();
      } catch {
        anggotaData = { ok: false, data: [] };
      }
      
      try {
        kegiatanData = await kegiatanRes.json();
      } catch {
        kegiatanData = { ok: false, data: [] };
      }
      
      try {
        absensiData = await absensiRes.json();
      } catch {
        absensiData = { ok: false, data: [] };
      }
      
      try {
        izinData = await izinRes.json();
      } catch {
        izinData = { ok: false, data: [] };
      }
      
      try {
        pengaturanData = await pengaturanRes.json();
      } catch {
        pengaturanData = { ok: false, data: null };
      }
      
      try {
        dashboardData = await dashboardRes.json();
      } catch {
        dashboardData = { ok: false, data: null };
      }
      
      setAnggota(anggotaData.data || []);
      setKegiatan(kegiatanData.data || []);
      setAbsensi(absensiData.data || []);
      setIzin(izinData.data || []);
      setPengaturan(pengaturanData.data || null);
      setDashboard(dashboardData);
    } catch (error) {
      console.error("Error in loadData:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      loadData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  async function saveAnggota(event: React.FormEvent) {
    event.preventDefault();
    const method = form.id ? "PUT" : "POST";
    const response = await fetch("/api/anggota", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json();
    
    if (result.ok) {
      setToast({ message: form.id ? "Anggota berhasil diperbarui" : "Anggota berhasil ditambahkan", type: "success" });
      setForm({ id: "", nama: "", nim: "", prodi: "", jabatan: "", divisi: "", kategori: "Anggota Divisi", nomor_hp: "", status: "Aktif" });
      loadData();
    } else {
      setToast({ message: result.message || "Gagal menyimpan anggota", type: "error" });
    }
    
    setTimeout(() => setToast(null), 3000);
  }

  async function deleteAnggota(id: string) {
    setDeleteConfirm({ id, type: "anggota" });
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      if (deleteConfirm.type === "anggota") {
        await fetch(`/api/anggota?id=${deleteConfirm.id}`, { method: "DELETE" });
      } else if (deleteConfirm.type === "kegiatan") {
        await fetch(`/api/kegiatan?id=${deleteConfirm.id}`, { method: "DELETE" });
      }
      setDeleteConfirm(null);
      loadData();
      setToast({ message: "Data berhasil dihapus", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast({ message: "Gagal menghapus data", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsDeleting(false);
    }
  }

  async function saveKegiatan(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/kegiatan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kegiatanForm),
    });
    if (response.ok) {
      setKegiatanForm({ id: "", tanggal: "", nama_kegiatan: "", status: "Aktif" });
      loadData();
    }
  }

  async function deleteKegiatan(id: string) {
    setDeleteConfirm({ id, type: "kegiatan" });
  }

  async function savePengaturan() {
    await fetch("/api/pengaturan", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pengaturan),
    });
    loadData();
  }

  // Modal handlers
  const showHadirPagiModal = () => {
    const data = dashboard?.data?.detailHadirPagi || [];
    if (data.length === 0) {
      setModalTitle("Hadir Pagi");
      setModalContent(<p className="text-center py-4">Belum ada data absensi pagi.</p>);
    } else {
      setModalTitle("Hadir Pagi");
      setModalContent(
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2 font-bold uppercase text-sm border-b-2 border-black pb-2">
            <span>Nama</span>
            <span>Jam</span>
            <span>Status</span>
          </div>
          {data.map((item: any, index: number) => (
            <div key={index} className="grid grid-cols-3 gap-2 text-sm border-b border-black/20 pb-2">
              <span className="font-medium">{item.nama}</span>
              <span>{item.jam}</span>
              <span className="neu-badge inline-block bg-[#95e1d3] px-2 py-1 text-xs">{item.status}</span>
            </div>
          ))}
          <p className="mt-4 font-bold">Jumlah: {data.length} orang</p>
        </div>
      );
    }
    setModalOpen(true);
  };

  const showHadirMalamModal = () => {
    const data = dashboard?.data?.detailHadirMalam || [];
    if (data.length === 0) {
      setModalTitle("Hadir Malam");
      setModalContent(<p className="text-center py-4">Belum ada data absensi malam.</p>);
    } else {
      setModalTitle("Hadir Malam");
      setModalContent(
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2 font-bold uppercase text-sm border-b-2 border-black pb-2">
            <span>Nama</span>
            <span>Jam</span>
            <span>Status</span>
          </div>
          {data.map((item: any, index: number) => (
            <div key={index} className="grid grid-cols-3 gap-2 text-sm border-b border-black/20 pb-2">
              <span className="font-medium">{item.nama}</span>
              <span>{item.jam}</span>
              <span className="neu-badge inline-block bg-[#95e1d3] px-2 py-1 text-xs">{item.status}</span>
            </div>
          ))}
          <p className="mt-4 font-bold">Jumlah: {data.length} orang</p>
        </div>
      );
    }
    setModalOpen(true);
  };

  const showBelumAbsenPagiModal = () => {
    const data = dashboard?.data?.detailBelumAbsenPagi || [];
    if (data.length === 0) {
      setModalTitle("Belum Absen Pagi");
      setModalContent(<p className="text-center py-4">Semua anggota sudah melakukan absensi pagi.</p>);
    } else {
      setModalTitle("Belum Absen Pagi");
      setModalContent(
        <div className="space-y-2">
          {data.map((item: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm border-b border-black/20 pb-2">
              <span className="font-medium">•</span>
              <span>{item.nama}</span>
            </div>
          ))}
          <p className="mt-4 font-bold">Jumlah: {data.length} orang</p>
        </div>
      );
    }
    setModalOpen(true);
  };

  const showBelumAbsenMalamModal = () => {
    const data = dashboard?.data?.detailBelumAbsenMalam || [];
    if (data.length === 0) {
      setModalTitle("Belum Absen Malam");
      setModalContent(<p className="text-center py-4">Semua anggota sudah melakukan absensi malam.</p>);
    } else {
      setModalTitle("Belum Absen Malam");
      setModalContent(
        <div className="space-y-2">
          {data.map((item: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm border-b border-black/20 pb-2">
              <span className="font-medium">•</span>
              <span>{item.nama}</span>
            </div>
          ))}
          <p className="mt-4 font-bold">Jumlah: {data.length} orang</p>
        </div>
      );
    }
    setModalOpen(true);
  };

  const showSedangIzinModal = () => {
    const data = dashboard?.data?.detailSedangIzin || [];
    if (data.length === 0) {
      setModalTitle("Sedang Izin");
      setModalContent(<p className="text-center py-4">Tidak ada anggota yang sedang izin.</p>);
    } else {
      setModalTitle("Sedang Izin");
      setModalContent(
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2 font-bold uppercase text-sm border-b-2 border-black pb-2">
            <span>Nama</span>
            <span>Divisi</span>
            <span>Jam Izin</span>
            <span>Alasan</span>
          </div>
          {data.map((item: any, index: number) => (
            <div key={index} className="grid grid-cols-4 gap-2 text-sm border-b border-black/20 pb-2">
              <span className="font-medium">{item.nama}</span>
              <span>{item.divisi || "-"}</span>
              <span>{item.jam_keluar || "-"}</span>
              <span>{item.alasan || "-"}</span>
            </div>
          ))}
          <p className="mt-4 font-bold">Jumlah: {data.length} orang</p>
        </div>
      );
    }
    setModalOpen(true);
  };

  const showSudahKembaliModal = () => {
    const data = dashboard?.data?.detailSudahKembali || [];
    if (data.length === 0) {
      setModalTitle("Sudah Kembali");
      setModalContent(<p className="text-center py-4">Belum ada anggota yang kembali dari izin.</p>);
    } else {
      setModalTitle("Sudah Kembali");
      setModalContent(
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 font-bold uppercase text-sm border-b-2 border-black pb-2">
            <span>Nama</span>
            <span>Jam Kembali</span>
          </div>
          {data.map((item: any, index: number) => (
            <div key={index} className="grid grid-cols-2 gap-2 text-sm border-b border-black/20 pb-2">
              <span className="font-medium">{item.nama}</span>
              <span>{item.jam_kembali || "-"}</span>
            </div>
          ))}
          <p className="mt-4 font-bold">Jumlah: {data.length} orang</p>
        </div>
      );
    }
    setModalOpen(true);
  };

  const handleRefreshData = () => {
    loadData();
    setToast({ message: "Data berhasil diperbarui", type: "success" });
    setTimeout(() => setToast(null), 3000);
  };

  const handleExportExcel = () => {
    const exportData = absensi.map((item) => ({
      Tanggal: item.tanggal,
      Jam: item.jam,
      Nama: item.nama,
      NIM: item.nim,
      Prodi: item.prodi,
      Jabatan: item.jabatan,
      Jenis: item.jenis_absensi,
      Status: item.status,
      Kegiatan: item.kegiatan || "-",
      Keterangan: item.keterangan || "-",
    }));
    exportToExcel(exportData, `rekap-absensi-${new Date().toISOString().slice(0, 10)}`);
    setToast({ message: "Data berhasil diexport", type: "success" });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRekapHariIni = () => {
    const today = new Date().toISOString().slice(0, 10);
    const todayData = absensi.filter((item) => item.tanggal === today);
    const exportData = todayData.map((item) => ({
      Tanggal: item.tanggal,
      Jam: item.jam,
      Nama: item.nama,
      NIM: item.nim,
      Prodi: item.prodi,
      Jabatan: item.jabatan,
      Jenis: item.jenis_absensi,
      Status: item.status,
      Kegiatan: item.kegiatan || "-",
      Keterangan: item.keterangan || "-",
    }));
    exportToExcel(exportData, `rekap-hari-ini-${today}`);
    setToast({ message: "Rekap hari ini berhasil diexport", type: "success" });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return <div className="p-8 text-[#1a1a1a] font-bold uppercase">Memuat dashboard admin...</div>;
  }

  const filteredAbsensi = absensi.filter((item) => {
    const matchesTanggal = !filterTanggal || item.tanggal === filterTanggal;
    const matchesStatus = filterStatus === "Semua" || item.status === filterStatus;
    const matchesNama = !searchAbsensiNama || item.nama.toLowerCase().includes(searchAbsensiNama.toLowerCase());
    return matchesTanggal && matchesStatus && matchesNama;
  });

  const filteredIzin = izin.filter((item) => {
    const matchesTanggal = !filterIzinTanggal || item.tanggal_keluar === filterIzinTanggal;
    const matchesStatus = filterIzinStatus === "Semua" || item.status === filterIzinStatus;
    const matchesNama = !searchIzinNama || item.nama.toLowerCase().includes(searchIzinNama.toLowerCase());
    return matchesTanggal && matchesStatus && matchesNama;
  });

  const filteredAnggota = anggota.filter((item) => {
    const matchesNama = !searchAnggotaNama || item.nama.toLowerCase().includes(searchAnggotaNama.toLowerCase());
    return matchesNama;
  });

  return (
    <main className="min-h-screen bg-[#fffdf0] p-6 text-[#1a1a1a]">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 neu-card px-6 py-4 ${toast.type === "success" ? "bg-[#95e1d3]" : "bg-[#ff6b6b]"}`}>
          <p className="font-bold uppercase">{toast.message}</p>
        </div>
      )}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="neu-card bg-white p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold uppercase mb-4">Konfirmasi Hapus</h3>
            <p className="mb-6">Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} disabled={isDeleting} className="neu-btn flex-1 bg-[#a8e6cf] px-4 py-2 font-bold uppercase disabled:opacity-70">Batal</button>
              <button onClick={confirmDelete} disabled={isDeleting} className="neu-btn flex-1 bg-[#ff6b6b] px-4 py-2 font-bold uppercase disabled:opacity-70">
                {isDeleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="neu-card bg-[#4ecdc4] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold uppercase tracking-tight">Dashboard Admin</h1>
              <p className="mt-2 font-medium">Ringkasan absensi, anggota aktif, dan rekap data terbaru.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleRefreshData} className="neu-btn bg-[#ffeb3b] px-4 py-2 text-sm font-bold uppercase">
                Refresh Data
              </button>
              <button onClick={handleRekapHariIni} className="neu-btn bg-[#95e1d3] px-4 py-2 text-sm font-bold uppercase">
                Rekap Hari Ini
              </button>
              <button onClick={handleExportExcel} className="neu-btn bg-[#a8e6cf] px-4 py-2 text-sm font-bold uppercase">
                Export Excel
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <DashboardCard
            title="Total Anggota"
            value={dashboard?.data?.totalAnggotaAktif ?? 0}
            color="blue"
          />
          <DashboardCard
            title="Hadir Pagi Ini"
            value={dashboard?.data?.hadirPagi ?? 0}
            color="green"
            onClick={showHadirPagiModal}
            interactive
            badge={<span className="neu-badge inline-block bg-[#95e1d3] px-2 py-1 text-xs">Klik</span>}
          />
          <DashboardCard
            title="Hadir Malam Ini"
            value={dashboard?.data?.hadirMalam ?? 0}
            color="green"
            onClick={showHadirMalamModal}
            interactive
            badge={<span className="neu-badge inline-block bg-[#95e1d3] px-2 py-1 text-xs">Klik</span>}
          />
          <DashboardCard
            title="Belum Absen Pagi"
            value={dashboard?.data?.belumAbsenPagi ?? 0}
            color="pink"
            onClick={showBelumAbsenPagiModal}
            interactive
            badge={<span className="neu-badge inline-block bg-[#ff6b6b] px-2 py-1 text-xs">Klik</span>}
          />
          <DashboardCard
            title="Belum Absen Malam"
            value={dashboard?.data?.belumAbsenMalam ?? 0}
            color="pink"
            onClick={showBelumAbsenMalamModal}
            interactive
            badge={<span className="neu-badge inline-block bg-[#ff6b6b] px-2 py-1 text-xs">Klik</span>}
          />
          <DashboardCard
            title="Sedang Izin"
            value={dashboard?.data?.sedangIzin ?? 0}
            color="yellow"
            onClick={showSedangIzinModal}
            interactive
            badge={<span className="neu-badge inline-block bg-[#ffeb3b] px-2 py-1 text-xs">Klik</span>}
          />
          <DashboardCard
            title="Sudah Kembali"
            value={dashboard?.data?.sudahKembali ?? 0}
            color="green"
            onClick={showSudahKembaliModal}
            interactive
            badge={<span className="neu-badge inline-block bg-[#95e1d3] px-2 py-1 text-xs">Klik</span>}
          />
          <DashboardCard
            title="Total Izin Hari Ini"
            value={dashboard?.data?.totalIzinHariIni ?? 0}
            color="pink"
          />
          <DashboardCard
            title="Slot Izin Tersedia"
            value={`${dashboard?.data?.slotTersedia ?? 0} / ${dashboard?.data?.maksSlotIzin ?? 3}`}
            color="purple"
          />
          <DashboardCard
            title="Persentase Kehadiran Pagi"
            value={`${dashboard?.data?.persentaseKehadiranPagi ?? 0}%`}
            color="green"
          />
          <DashboardCard
            title="Persentase Kehadiran Malam"
            value={`${dashboard?.data?.persentaseKehadiranMalam ?? 0}%`}
            color="green"
          />
        </div>

        <DashboardCharts />

        <div className="neu-card bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold uppercase">CRUD Anggota</h2>
            <input type="text" value={searchAnggotaNama} onChange={(e) => setSearchAnggotaNama(e.target.value)} placeholder="Cari nama..." className="neu-input px-3 py-2" />
          </div>
          <form onSubmit={saveAnggota} className="mt-4 grid gap-3 md:grid-cols-2">
            <input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="ID anggota" className="neu-input px-3 py-2" />
            <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama" className="neu-input px-3 py-2" />
            <input value={form.nim} onChange={(e) => setForm({ ...form, nim: e.target.value })} placeholder="NIM" className="neu-input px-3 py-2" />
            <input value={form.prodi} onChange={(e) => setForm({ ...form, prodi: e.target.value })} placeholder="Prodi" className="neu-input px-3 py-2" />
            <input value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value })} placeholder="Jabatan" className="neu-input px-3 py-2" />
            <input value={form.divisi} onChange={(e) => setForm({ ...form, divisi: e.target.value })} placeholder="Divisi" className="neu-input px-3 py-2" />
            <input value={form.nomor_hp} onChange={(e) => setForm({ ...form, nomor_hp: e.target.value })} placeholder="Nomor HP" className="neu-input px-3 py-2" />
            <select value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} className="neu-input px-3 py-2">
              <option value="Anggota Divisi">Anggota Divisi</option>
              <option value="BPH">BPH</option>
            </select>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="neu-input px-3 py-2">
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
            <button type="submit" className="neu-btn bg-[#4ecdc4] px-4 py-2">Simpan Anggota</button>
          </form>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b-3 border-black text-left font-bold uppercase">
                  <th className="px-3 py-2">Nama</th>
                  <th className="px-3 py-2">NIM</th>
                  <th className="px-3 py-2">Prodi</th>
                  <th className="px-3 py-2">Jabatan</th>
                  <th className="px-3 py-2">Divisi</th>
                  <th className="px-3 py-2">Kategori</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnggota.map((item) => (
                  <tr key={item.id} className="border-b border-black">
                    <td className="px-3 py-2 font-medium">{item.nama}</td>
                    <td className="px-3 py-2">{item.nim}</td>
                    <td className="px-3 py-2">{item.prodi}</td>
                    <td className="px-3 py-2">{item.jabatan}</td>
                    <td className="px-3 py-2">{item.divisi || "-"}</td>
                    <td className="px-3 py-2">{item.kategori}</td>
                    <td className="px-3 py-2">{item.status}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => setForm(item)} className="neu-btn bg-[#ffeb3b] px-2 py-1 text-xs">Edit</button>
                      <button onClick={() => deleteAnggota(item.id)} className="neu-btn bg-[#ff6b6b] px-2 py-1 text-xs ml-1">Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="neu-card bg-[#ff8b94] p-6">
          <h2 className="text-xl font-bold uppercase">Master Kegiatan</h2>
          <form onSubmit={saveKegiatan} className="mt-4 grid gap-3 md:grid-cols-3">
            <input value={kegiatanForm.id} onChange={(e) => setKegiatanForm({ ...kegiatanForm, id: e.target.value })} placeholder="ID kegiatan" className="neu-input px-3 py-2" />
            <input type="date" value={kegiatanForm.tanggal} onChange={(e) => setKegiatanForm({ ...kegiatanForm, tanggal: e.target.value })} className="neu-input px-3 py-2" />
            <input value={kegiatanForm.nama_kegiatan} onChange={(e) => setKegiatanForm({ ...kegiatanForm, nama_kegiatan: e.target.value })} placeholder="Nama kegiatan" className="neu-input px-3 py-2" />
            <button type="submit" className="neu-btn bg-[#4ecdc4] px-4 py-2">Simpan Kegiatan</button>
          </form>
          <div className="mt-4 space-y-2">
            {kegiatan.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-white p-3 border-2 border-black shadow-[2px_2px_0px_0px_#1a1a1a]">
                <span className="font-medium">{item.nama_kegiatan} - {item.tanggal}</span>
                <button onClick={() => deleteKegiatan(item.id)} className="neu-btn bg-[#ff6b6b] px-2 py-1 text-xs">Hapus</button>
              </div>
            ))}
          </div>
        </div>

        <div className="neu-card bg-[#ffeb3b] p-6">
          <h2 className="text-xl font-bold uppercase">Pengaturan</h2>
          {pengaturan ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-bold uppercase">Jam Pagi Mulai</label>
                <input type="time" value={pengaturan.jam_pagi_mulai || ""} onChange={(e) => setPengaturan({ ...pengaturan, jam_pagi_mulai: e.target.value })} className="neu-input mt-2 w-full px-3 py-2" />
              </div>
              <div>
                <label className="text-sm font-bold uppercase">Jam Pagi Selesai</label>
                <input type="time" value={pengaturan.jam_pagi_selesai || ""} onChange={(e) => setPengaturan({ ...pengaturan, jam_pagi_selesai: e.target.value })} className="neu-input mt-2 w-full px-3 py-2" />
              </div>
              <div>
                <label className="text-sm font-bold uppercase">Jam Malam Mulai</label>
                <input type="time" value={pengaturan.jam_malam_mulai || ""} onChange={(e) => setPengaturan({ ...pengaturan, jam_malam_mulai: e.target.value })} className="neu-input mt-2 w-full px-3 py-2" />
              </div>
              <div>
                <label className="text-sm font-bold uppercase">Jam Malam Selesai</label>
                <input type="time" value={pengaturan.jam_malam_selesai || ""} onChange={(e) => setPengaturan({ ...pengaturan, jam_malam_selesai: e.target.value })} className="neu-input mt-2 w-full px-3 py-2" />
              </div>
              <div>
                <label className="text-sm font-bold uppercase">Maks Izin Per Divisi</label>
                <input type="number" value={pengaturan.maks_izin_per_divisi || ""} onChange={(e) => setPengaturan({ ...pengaturan, maks_izin_per_divisi: Number(e.target.value) })} className="neu-input mt-2 w-full px-3 py-2" />
              </div>
              <div>
                <label className="text-sm font-bold uppercase">Maks Slot Izin</label>
                <input type="number" value={pengaturan.maks_slot_izin || ""} onChange={(e) => setPengaturan({ ...pengaturan, maks_slot_izin: Number(e.target.value) })} className="neu-input mt-2 w-full px-3 py-2" />
              </div>
              <div>
                <label className="text-sm font-bold uppercase">Radius GPS (meter)</label>
                <input type="number" value={pengaturan.radius_gps_meters || ""} onChange={(e) => setPengaturan({ ...pengaturan, radius_gps_meters: Number(e.target.value) })} className="neu-input mt-2 w-full px-3 py-2" />
              </div>
              <div>
                <label className="text-sm font-bold uppercase">Koordinat Posko Latitude</label>
                <input type="number" step="any" value={pengaturan.koordinat_posko_lat || ""} onChange={(e) => setPengaturan({ ...pengaturan, koordinat_posko_lat: Number(e.target.value) })} className="neu-input mt-2 w-full px-3 py-2" />
              </div>
              <div>
                <label className="text-sm font-bold uppercase">Koordinat Posko Longitude</label>
                <input type="number" step="any" value={pengaturan.koordinat_posko_lng || ""} onChange={(e) => setPengaturan({ ...pengaturan, koordinat_posko_lng: Number(e.target.value) })} className="neu-input mt-2 w-full px-3 py-2" />
              </div>
              <div>
                <label className="text-sm font-bold uppercase">Ukuran Maksimum Foto (KB)</label>
                <input type="number" value={pengaturan.ukuran_maksimum_foto_kb || ""} onChange={(e) => setPengaturan({ ...pengaturan, ukuran_maksimum_foto_kb: Number(e.target.value) })} className="neu-input mt-2 w-full px-3 py-2" />
              </div>
            </div>
          ) : null}
          <button onClick={savePengaturan} className="neu-btn mt-4 bg-[#95e1d3] px-4 py-2">Simpan Pengaturan</button>
        </div>

        <div className="neu-card bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold uppercase">Rekap Absensi</h2>
            <div className="flex flex-wrap gap-2">
              <input type="date" value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)} className="neu-input px-3 py-2" />
              <input type="text" value={searchAbsensiNama} onChange={(e) => setSearchAbsensiNama(e.target.value)} placeholder="Cari nama..." className="neu-input px-3 py-2" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="neu-input px-3 py-2">
                <option value="Semua">Semua</option>
                <option value="Hadir">Hadir</option>
                <option value="Izin">Izin</option>
                <option value="Sakit">Sakit</option>
                <option value="Terlambat">Terlambat</option>
                <option value="Alpha">Alpha</option>
              </select>
              <button onClick={() => exportToExcel(filteredAbsensi, `rekap-absensi-${filterTanggal}`)} className="neu-btn bg-[#95e1d3] px-3 py-2 text-sm">Export Excel</button>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b-3 border-black text-left font-bold uppercase">
                  <th className="px-3 py-2">Nama</th>
                  <th className="px-3 py-2">Tanggal</th>
                  <th className="px-3 py-2">Jam</th>
                  <th className="px-3 py-2">Jenis</th>
                  <th className="px-3 py-2">Kegiatan</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAbsensi.map((item) => (
                  <tr key={item.id} className="border-b border-black">
                    <td className="px-3 py-2 font-medium">{item.nama}</td>
                    <td className="px-3 py-2">{item.tanggal}</td>
                    <td className="px-3 py-2">{item.jam}</td>
                    <td className="px-3 py-2">{item.jenis_absensi}</td>
                    <td className="px-3 py-2">{item.kegiatan || "-"}</td>
                    <td className="px-3 py-2">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="neu-card bg-[#ff8b94] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold uppercase">Rekap Izin</h2>
            <div className="flex flex-wrap gap-2">
              <input type="date" value={filterIzinTanggal} onChange={(e) => setFilterIzinTanggal(e.target.value)} className="neu-input px-3 py-2" />
              <input type="text" value={searchIzinNama} onChange={(e) => setSearchIzinNama(e.target.value)} placeholder="Cari nama..." className="neu-input px-3 py-2" />
              <select value={filterIzinStatus} onChange={(e) => setFilterIzinStatus(e.target.value)} className="neu-input px-3 py-2">
                <option value="Semua">Semua</option>
                <option value="Keluar">Keluar</option>
                <option value="Kembali">Kembali</option>
              </select>
              <button onClick={() => exportToExcel(filteredIzin, `rekap-izin-${filterIzinTanggal}`)} className="neu-btn bg-[#95e1d3] px-3 py-2 text-sm">Export Excel</button>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b-3 border-black text-left font-bold uppercase">
                  <th className="px-3 py-2">Nama</th>
                  <th className="px-3 py-2">Divisi</th>
                  <th className="px-3 py-2">Jam Keluar</th>
                  <th className="px-3 py-2">Jam Kembali</th>
                  <th className="px-3 py-2">Keperluan</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredIzin.map((item) => (
                  <tr key={item.id} className="border-b border-black">
                    <td className="px-3 py-2 font-medium">{item.nama}</td>
                    <td className="px-3 py-2">{item.divisi}</td>
                    <td className="px-3 py-2">{item.jam_keluar}</td>
                    <td className="px-3 py-2">{item.jam_kembali || "-"}</td>
                    <td className="px-3 py-2">{item.keperluan}</td>
                    <td className="px-3 py-2">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <DashboardModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={modalTitle}
        >
          {modalContent}
        </DashboardModal>
      </div>
    </main>
  );
}
