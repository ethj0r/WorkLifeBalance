# CarbonLink
![Overview](./overview.png)
Platform MRV carbon credit untuk pemilik lahan agroforestri Indonesia.
Bantu petani kecil mendaftarkan lahan, verifikasi tutupan pohon secara otomatis,
dan cairkan estimasi pendapatan carbon credit langsung ke e-wallet.

---

## Features

| Area | Features |
|---|---|
| Auth | Login nomor HP + OTP |
| Onboarding | Setup profil: nama, provinsi, kabupaten |
| Pendaftaran lahan | Wizard 7 steps — kepemilikan, data diri, lokasi, polygon, detail, foto, review |
| Polygon editor | Gambar & drag batas lahan di atas map |
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

---

## Tech Stack

| Layer | Library / Service |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Map | Leaflet 1.9 + OpenStreetMap tiles |
| Reverse geocode | Nominatim (OSM, tanpa API key) |
| Database schema | Prisma 5 + PostgreSQL |
| Auth & profiles | Supabase REST (tanpa SDK) |
| Session | `localStorage` custom, SSR-safe |
| Icons | lucide-react |
| API Detection | FastAPI + Uvicorn + DeepForest |

---

## Struktur Folder

```
apps/
├── web/
│   ├── app/
│   │   ├── login/              # Input nomor HP
│   │   ├── otp/                # Verifikasi OTP
│   │   ├── profile/            # Setup nama & lokasi
│   │   ├── dashboard/          # Dashboard utama
│   │   ├── plots/new/          # Wizard pendaftaran lahan
│   │   ├── plots/[id]/         # Detail lahan
│   │   ├── withdraw/           # Tarik saldo
│   │   └── api/                # Route handlers (plots, verification)
│   ├── components/
│   │   ├── maps/               # PinpointMap, PolygonEditor
│   │   ├── plots/              # PlotCard, MapPolygon
│   │   ├── ui/                 # Button, Card, Field, AppHeader, TopBar …
│   │   ├── upload/             # FileUploadCard, ImageUploadList
│   │   └── wizard/             # WizardStepper, LiveProgress
│   ├── lib/
│   │   ├── session.ts          # localStorage session store
│   │   ├── supabase/client.ts  # Supabase REST client
│   │   ├── plots-store.ts      # localStorage plots store
│   │   ├── carbon-estimate.ts  # Kalkulasi tonsCO2e & pendapatan
│   │   ├── types.ts            # Shared types
│   │   ├── format.ts           # IDR formatter
│   │   └── geo.ts              # Polygon area & SVG helpers
│   └── prisma/schema.prisma
└── api-detection/
    └── main.py
```

---

## How to Run

### Web

```bash
pnpm install
cd apps/web
pnpm dev
# → http://localhost:3000
```

### API Detection

```bash
cd apps/api-detection

python -m venv .venv

# Windows
.venv\Scripts\activate
# Mac / Linux
source .venv/bin/activate

pip install -r requirements.txt
pip install deepforest opencv-python numpy python-multipart

uvicorn main:app --reload --port 8000
# → http://localhost:8000
```