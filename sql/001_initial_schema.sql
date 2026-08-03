create table if not exists anggota (
  id text primary key,
  nama text not null,
  nim text not null,
  prodi text not null,
  jabatan text not null,
  divisi text,
  kategori text not null check (kategori in ('BPH', 'Anggota Divisi')),
  nomor_hp text,
  status text not null default 'Aktif' check (status in ('Aktif', 'Nonaktif'))
);

create table if not exists absensi (
  id text primary key,
  tanggal date not null,
  jam time not null,
  nama text not null,
  nim text not null,
  prodi text not null,
  jabatan text not null,
  jenis_absensi text not null check (jenis_absensi in ('Pagi', 'Malam')),
  kegiatan text,
  laporan_kegiatan text,
  keterangan text,
  foto_url text not null,
  latitude numeric,
  longitude numeric,
  device text,
  timestamp timestamptz not null default now(),
  status text not null default 'Hadir' check (status in ('Hadir','Terlambat','Izin','Sakit','Alpha'))
);

create unique index if not exists absensi_no_double_submit on absensi (nama, tanggal, jenis_absensi);

create table if not exists master_kegiatan (
  id text primary key,
  tanggal date not null,
  nama_kegiatan text not null,
  status text not null default 'Aktif'
);

create table if not exists izin (
  id text primary key,
  nama text not null,
  nim text not null,
  divisi text not null,
  kategori text not null,
  tanggal_keluar date not null,
  jam_keluar time not null,
  keperluan text not null,
  foto_keluar text not null,
  latitude_keluar numeric,
  longitude_keluar numeric,
  status text not null default 'Keluar' check (status in ('Keluar','Kembali')),
  jam_kembali time,
  foto_kembali text,
  latitude_kembali numeric,
  longitude_kembali numeric
);

create table if not exists pengaturan (
  id int primary key default 1,
  jam_pagi_mulai time not null default '07:00',
  jam_pagi_selesai time not null default '09:00',
  jam_malam_mulai time not null default '21:00',
  jam_malam_selesai time not null default '22:00',
  maks_izin_per_divisi int not null default 1,
  maks_slot_izin int not null default 3,
  radius_gps_meters int not null default 100,
  koordinat_posko_lat numeric,
  koordinat_posko_lng numeric,
  ukuran_maksimum_foto_kb int not null default 2048,
  constraint single_row check (id = 1)
);

insert into pengaturan (id)
select 1
where not exists (select 1 from pengaturan where id = 1);

insert into anggota (id, nama, nim, prodi, jabatan, divisi, kategori, status)
values
  ('A01','Danil Faizul Ahadi','231240001366','Teknik Informatika','Kormades','-','BPH','Aktif'),
  ('A02','Salsa Dea Nor Hidayatusofia','231110003643','Manajemen','Sekretaris','-','BPH','Aktif'),
  ('A03','Wildania Chintia Bella','231110003684','Manajemen','Sekretaris','-','BPH','Aktif'),
  ('A04','Cindy Aulia Pratiwi','231110003637','Manajemen','Bendahara','-','BPH','Aktif'),
  ('A05','Nur Khoyrul Anam','231330001402','Pendidikan Guru Sekolah Dasar','Anggota','Acara','Anggota Divisi','Aktif'),
  ('A06','Eki Aulia Febri','231330001186','Pendidikan Guru Sekolah Dasar','Anggota','Acara','Anggota Divisi','Aktif'),
  ('A07','Lailatul Afifah','231330001183','Pendidikan Guru Sekolah Dasar','Anggota','Acara','Anggota Divisi','Aktif'),
  ('A08','Ari Riyanto','231240001464','Teknik Informatika','Anggota','Humas','Anggota Divisi','Aktif'),
  ('A09','Dea Tazkiyatul Inka Maula','231110003641','Manajemen','Anggota','Humas','Anggota Divisi','Aktif'),
  ('A10','Reno Aldi','231120002698','Akuntansi','Anggota','Perkap','Anggota Divisi','Aktif'),
  ('A11','M. Nuqman Shadiqin','231220000316','Teknik Elektro','Anggota','Perkap','Anggota Divisi','Aktif'),
  ('A12','Izza Zakiatul Miskiah','231420000672','Perbankan Syariah','Anggota','Perkap','Anggota Divisi','Aktif'),
  ('A13','Dwi Septiano Roihan','231270000653','Desain Komunikasi Visual','Anggota','PDD','Anggota Divisi','Aktif'),
  ('A14','Ary Maharani','231330001335','Pendidikan Guru Sekolah Dasar','Anggota','PDD','Anggota Divisi','Aktif'),
  ('A15','Alia Lira Febi Febrianti','231120002654','Akuntansi','Anggota','PDD','Anggota Divisi','Aktif')
on conflict (id) do nothing;
