<<<<<<< HEAD
# SIAKKN Dewa Bondo

Sistem Informasi Absensi KKN dengan desain Neubrutalism, dibangun dengan Next.js 16 dan Supabase.

## Fitur

- **Absensi Harian**: Form absensi pagi/malam dengan foto dan lokasi
- **Izin Keluar**: Form izin keluar dengan foto dan lokasi
- **Dashboard Admin**: CRUD anggota, master kegiatan, pengaturan jam, dan rekap absensi
- **Validasi Jam**: Absensi hanya bisa dilakukan pada jam yang ditentukan
- **Upload Foto**: Foto disimpan di Supabase Storage
- **Geolocation**: Lokasi GPS dicatat saat absensi

## Tech Stack

- **Frontend**: Next.js 16.2.12, React 19.2.4, TypeScript
- **Styling**: Tailwind CSS 4, Neubrutalism Design System
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (untuk foto)
- **Icons**: Lucide React

## Prasyarat

Sebelum memulai, pastikan Anda memiliki:

- Node.js 18+ terinstall
- npm, yarn, pnpm, atau bun
- Akun Supabase (gratis di [supabase.com](https://supabase.com))

## Setup Lengkap

### 1. Clone Repository

```bash
cd "d:/KKN/SIAKKN DEWA BONDO"
```

### 2. Install Dependencies

```bash
npm install
# atau
yarn install
# atau
pnpm install
```

### 3. Setup Supabase

#### 3.1 Buat Project Supabase

1. Login ke [Supabase Dashboard](https://supabase.com/dashboard)
2. Klik "New Project"
3. Masukkan nama project (misal: `siakkn-dewa-bondo`)
4. Pilih region terdekat
5. Set password database
6. Tunggu project selesai dibuat

#### 3.2 Jalankan SQL Schema

1. Buka Supabase Dashboard
2. Masuk ke menu **SQL Editor**
3. Klik "New Query"
4. Copy dan paste isi file `sql/001_initial_schema.sql`
5. Klik "Run" untuk mengeksekusi

Schema ini akan membuat:
- Tabel `anggota` (data anggota KKN)
- Tabel `absensi` (data absensi harian)
- Tabel `master_kegiatan` (master kegiatan)
- Tabel `izin` (data izin keluar)
- Tabel `pengaturan` (pengaturan jam absensi)
- Data awal 15 anggota dan 1 pengaturan

#### 3.3 Setup Storage untuk Foto

1. Masuk ke menu **Storage**
2. Klik "New Bucket"
3. Nama bucket: `foto-absensi`
4. Set sebagai **Public bucket**
5. Klik "Create Bucket"

#### 3.4 Dapatkan API Keys

1. Masuk ke menu **Project Settings** > **API**
2. Copy values berikut:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon public key** (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role secret** (SUPABASE_SERVICE_ROLE_KEY)

### 4. Setup Environment Variables

Buat file `.env.local` di root project:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**CATATAN**: Jangan pernah commit `.env.local` ke git!

### 5. Jalankan Development Server

```bash
npm run dev
# atau
yarn dev
# atau
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Struktur Project

```
SIAKKN DEWA BONDO/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── admin/        # Halaman admin dashboard
│   │   ├── api/          # API Routes
│   │   │   ├── absensi/  # API absensi
│   │   │   ├── anggota/  # API CRUD anggota
│   │   │   ├── dashboard/# API dashboard stats
│   │   │   ├── izin/     # API izin keluar
│   │   │   ├── kegiatan/ # API master kegiatan
│   │   │   └── pengaturan/# API pengaturan
│   │   ├── dpl/          # Halaman DPL
│   │   ├── izin/         # Halaman form izin
│   │   ├── globals.css   # Global styles (Neubrutalism)
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Halaman utama (absensi)
│   ├── components/       # React components
│   │   └── AbsensiForm.tsx
│   └── lib/             # Utility libraries
│       ├── supabase.ts   # Supabase client
│       └── validateJam.ts # Jam validation
├── sql/                  # Database schema
│   └── 001_initial_schema.sql
├── public/               # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## Penggunaan

### Absensi Harian

1. Buka halaman utama `/`
2. Pilih nama dari dropdown (data otomatis terisi dari database)
3. Pilih jenis absensi (Pagi/Malam)
4. Isi kegiatan dan laporan kegiatan
5. Klik "Ambil Lokasi" untuk mendapatkan GPS
6. Klik "Buka Kamera" lalu "Ambil Foto"
7. Klik "Kirim Absensi"

### Izin Keluar

1. Buka halaman `/izin`
2. Pilih nama anggota
3. Isi tanggal, jam keluar, dan keperluan
4. Ambil lokasi dan foto
5. Klik "Kirim Izin"

### Dashboard Admin

1. Buka halaman `/admin`
2. **CRUD Anggota**: Tambah, edit, hapus anggota
3. **Master Kegiatan**: Kelola kegiatan KKN
4. **Pengaturan Jam**: Atur jam absensi pagi/malam
5. **Rekap Absensi**: Lihat rekap dengan filter tanggal dan status

## Deployment

### Deploy ke Vercel (Recommended)

#### 1. Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/siakkn-dewa-bondo.git
git push -u origin main
```

#### 2. Deploy ke Vercel

1. Login ke [Vercel](https://vercel.com)
2. Klik "Add New Project"
3. Import dari GitHub
4. Pilih repository `siakkn-dewa-bondo`
5. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. Klik "Deploy"

#### 3. Custom Domain (Opsional)

1. Di Vercel project settings, klik "Domains"
2. Add custom domain
3. Update DNS records sesuai instruksi Vercel

### Deploy ke Platform Lain

#### Netlify

```bash
npm run build
# Upload folder .next/static dan public ke Netlify
```

#### Self-hosted (VPS)

```bash
npm run build
npm start
# Aplikasi berjalan di port 3000
```

Gunakan PM2 untuk production:

```bash
npm install -g pm2
pm2 start npm --name "siakkn" -- start
pm2 save
pm2 startup
```

## Troubleshooting

### Error: Supabase client not configured

Pastikan environment variables sudah di-set dengan benar di `.env.local`.

### Error: Storage bucket not found

Pastikan bucket `foto-absensi` sudah dibuat di Supabase Storage dan di-set sebagai public.

### Error: Camera not working

Pastikan browser memiliki izin akses kamera dan menggunakan HTTPS (di production) atau localhost (di development).

### Error: Geolocation not working

Pastikan browser memiliki izin akses lokasi dan menggunakan HTTPS (di production).

## Pengaturan Jam Absensi Default

- **Pagi**: 07:00 - 09:00
- **Malam**: 21:00 - 22:00

Bisa diubah melalui Dashboard Admin > Pengaturan Jam.

## License

MIT License - KKN Dewa Bondo
=======
# SIAKKN-DEWABONDO
Sistem Absensi KKN
>>>>>>> 99ab29eb2258749b12836a908b2c65b39497b100
