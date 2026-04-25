# CarbonLink

Platform MRV carbon credit untuk pemilik lahan agroforestri Indonesia.
Bantu petani kecil mendaftarkan lahan, verifikasi tutupan pohon secara otomatis,
dan cairkan estimasi pendapatan carbon credit langsung ke e-wallet.

---

## Fitur

### Sudah dibuat

| Area | Fitur |
|---|---|
| Auth | Login nomor HP + OTP (mock WhatsApp) |
| Onboarding | Setup profil: nama, provinsi, kabupaten |
| Pendaftaran lahan | Wizard 7 langkah — kepemilikan, data diri, lokasi, polygon, detail, foto, review |
| Polygon editor | Gambar & drag batas lahan di atas peta SVG |
| Upload dokumen | Dokumen legal wajib (Sertifikat / SPPT) dengan preview nama file |
| Upload foto lahan | Minimal 3 foto kondisi lahan dari darat, preview thumbnail real-time |
| Estimasi karbon | Hitung CO₂e dari luas lahan, NDVI, dan densitas pohon (IPCC Tier 1) |
| Dashboard | Ringkasan saldo, total lahan, carbon/tahun, confidence rata-rata |
| Detail lahan | Peta polygon, hasil MRV otomatis, proyeksi pendapatan tahunan |
| Simulasi MRV | Live progress verifikasi 5 tahap setelah submit lahan |
| Penarikan saldo | Simulasi payout ke DANA / GoPay / OVO / ShopeePay |
| API – plots | `GET /api/plots`, `POST /api/plots` |
| API – verifikasi | `POST /api/verification` — kalkulasi confidence, NDVI, carbon estimate |
| Deteksi pohon | FastAPI + DeepForest: deteksi crown pohon dari foto udara, output bounding box + centroid |

### Akan dikembangkan

| Area | Rencana |
|---|---|
| Auth | OTP WhatsApp nyata via Twilio / Fonnte; sesi JWT / cookie |
| Database | Koneksi Prisma → PostgreSQL; ganti mock data ke query nyata |
| Verifikasi MRV | Integrasi NDVI dari Sentinel-2 GEE; pipeline deteksi pohon via `api-detection` |
| Polygon | Ganti SVG mock dengan Mapbox GL JS / Leaflet + koordinat GPS nyata |
| Foto lahan | Upload ke object storage (S3 / Supabase Storage) |
| Carbon credit | Kalkulasi metodologi lengkap; integrasi harga pasar VCM |
| Marketplace | Buyer matching, listing credit, notifikasi deal |
| Sertifikat | Generate PDF sertifikat carbon credit per lahan |
| Notifikasi | Push / WA untuk update status verifikasi |
| Admin panel | Manajemen plot, approval verifikasi, audit trail |

---

## Tech Stack

### Web — `apps/web`

| Kategori | Pilihan |
|---|---|
| Framework | Next.js 14 (App Router) |
| Bahasa | TypeScript 5 |
| UI Library | React 18 |
| Styling | Tailwind CSS 3 |
| Ikon | Lucide React |
| Font | Source Serif 4 (display) · Inter (body) · JetBrains Mono |
| ORM | Prisma 5 |
| Database | PostgreSQL |
| State lahan | localStorage (sementara, sebelum DB) |

### API Deteksi Pohon — `apps/api-detection`

| Kategori | Pilihan |
|---|---|
| Framework | FastAPI |
| Bahasa | Python 3 |
| Server | Uvicorn |
| Model ML | DeepForest (`weecology/deepforest-tree`) |
| Computer Vision | OpenCV · NumPy |
| Input | Foto udara + koordinat polygon |
| Output | Jumlah pohon, bounding box, centroid, annotated image base64 |

---

## Struktur Proyek

```
apps/
├── api-detection/      # FastAPI — deteksi pohon dari foto udara
│   ├── main.py
│   └── requirements.txt
└── web/                # Next.js — platform utama
    ├── app/            # Pages & API routes
    ├── components/     # UI components
    ├── lib/            # Utilities, types, store
    └── prisma/         # Schema database
```

---

## Menjalankan Lokal

**Web**
```bash
cd apps/web
npm install
npm run dev
```

**API Deteksi**
```bash
cd apps/api-detection
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt   # Windows
uvicorn main:app --reload --port 8000
```

> Demo OTP: `123456`