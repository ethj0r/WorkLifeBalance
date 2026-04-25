"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CircleCheck,
  Info,
  MapPin,
  ShieldCheck,
  Users,
  User,
} from "lucide-react";

import { PolygonEditor } from "@/components/maps/PolygonEditor";
import { PinpointMap } from "@/components/maps/Pinpointmap";
import { FileUploadCard } from "@/components/upload/FileUploadCard";
import { ImageUploadList } from "@/components/upload/ImageUploadList";
import type { ImageEntry } from "@/components/upload/ImageUploadList";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, SelectInput, TextInput } from "@/components/ui/Field";
import { WizardStepper } from "@/components/wizard/WizardStepper";
import { LiveProgress } from "@/components/wizard/LiveProgress";
import {
  estimateAreaHaFromSvgPolygon,
  polygonToSvgPoints,
} from "@/lib/geo";
import { formatIDR } from "@/lib/format";
import { addPlot } from "@/lib/plots-store";
import {
  LAND_TYPE_OPTIONS,
  type LandType,
  type LatLng,
  type Plot,
  type PolygonPoint,
} from "@/lib/types";

const labels = [
  "Kepemilikan",
  "Data diri",
  "Lokasi",
  "Polygon",
  "Detail",
  "Foto",
  "Review",
];

type Form = {
  ownership: "self" | "on_behalf" | null;
  name: string;
  address: string;
  landType: LandType;
  year: string;
  trees: string[];
  consent: boolean;
  polygonPoints: PolygonPoint[];
  legalDoc: File | null;
  landImages: ImageEntry[];
  pinLocation: LatLng | null;
};

const initialPolygonPoints: PolygonPoint[] = [
  { x: 90, y: 130 },
  { x: 310, y: 90 },
  { x: 560, y: 150 },
  { x: 670, y: 330 },
  { x: 380, y: 430 },
  { x: 120, y: 330 },
];

export default function NewPlotPage() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [stage, setStage] = useState(0);
  const [createdPlotId, setCreatedPlotId] = useState<string | null>(null);

  const [form, setForm] = useState<Form>({
    ownership: null,
    name: "Kebun Cengkeh Bukit Hijau",
    address: "Desa Sukamulya, Cianjur",
    landType: "Agroforestri",
    year: "2008",
    trees: ["Cengkeh", "Kopi", "Sengon"],
    consent: false,
    polygonPoints: initialPolygonPoints,
    legalDoc: null,
    landImages: [],
    pinLocation: null,
  });

  useEffect(() => {
    if (!verifying) return;

    const t = setInterval(() => {
      setStage((s) => Math.min(5, s + 1));
    }, 1400);

    return () => clearInterval(t);
  }, [verifying]);

  useEffect(() => {
    if (verifying && stage >= 5) {
      setTimeout(() => {
        if (createdPlotId) {
          router.push(`/plots/${createdPlotId}?new=1`);
          return;
        }

        router.push("/dashboard");
      }, 700);
    }
  }, [stage, verifying, createdPlotId, router]);

  function createPlotFromForm(): Plot {
    const area = estimateAreaHaFromSvgPolygon(form.polygonPoints);
    const safeArea = area > 0 ? area : 0.1;
    const carbonTons = Number((safeArea * 10).toFixed(1));
    const annualEarnings = Math.round(carbonTons * 70000);

    return {
      id: `plot-${Date.now()}`,
      name: form.name.trim() || "Lahan Baru",
      location: form.address.trim()
        ? form.pinLocation
          ? `${form.address.trim()} (${form.pinLocation.lat.toFixed(4)}, ${form.pinLocation.lng.toFixed(4)})`
          : form.address.trim()
        : "Lokasi belum diisi",
      area: safeArea,
      landType: form.landType,
      status: "verifying",
      annualEarnings,
      carbonTons,
      confidence: 82,
      ndvi: 0.64,
      trees: form.trees.length > 0 ? form.trees : ["Belum diisi"],
      polygon: polygonToSvgPoints(form.polygonPoints),
      owner: "Asep Suryadi",
    };
  }

  const isPhotoStepValid =
    form.legalDoc !== null && form.landImages.length >= 3;

  const nextDisabled = step === 5 && !isPhotoStepValid;

  const next = () => {
    if (step < labels.length - 1) {
      setStep(step + 1);
      return;
    }

    const newPlot = createPlotFromForm();
    addPlot(newPlot);
    setCreatedPlotId(newPlot.id);
    setVerifying(true);
  };

  const back = () => {
    if (step === 0) {
      router.push("/dashboard");
      return;
    }

    setStep(step - 1);
  };

  if (verifying) return <VerifyingView stage={stage} />;

  return (
    <main className="web-page">
      <AppHeader active="plots" />

      <section className="web-container py-8 lg:py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="eyebrow text-green-700">Form MRV Pengguna</div>
            <h1 className="display-md mt-2">Daftarkan Lahan</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">
              Lengkapi data lahan, polygon, foto bukti, dan detail tanaman
              untuk verifikasi otomatis.
            </p>
          </div>

          <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink-600 shadow-xs">
            Langkah {step + 1} dari {labels.length}
          </div>
        </div>

        <div className="wizard-grid">
          <aside className="sticky top-24 hidden lg:block">
            <Card className="rounded-2xl p-5">
              <WizardStepper step={step} labels={labels} vertical />
            </Card>

            <Card className="mt-4 rounded-2xl bg-green-50 p-5">
              <div className="flex items-center gap-2 text-green-700">
                <ShieldCheck className="h-5 w-5" />
                <span className="font-semibold">Trust score naik</span>
              </div>

              <p className="mt-2 text-sm leading-6 text-green-900/75">
                Dokumen legal, foto jelas, jenis lahan, dan polygon rapi
                membantu buyer menilai credit lebih berkualitas.
              </p>
            </Card>
          </aside>

          <Card className="rounded-[24px] p-6 md:p-8">
            <div className="mb-6 lg:hidden">
              <WizardStepper step={step} labels={labels} />
            </div>

            <div className="min-h-[520px]">
              {step === 0 && (
                <StepOwnership
                  onPick={(v) => {
                    setForm({ ...form, ownership: v });
                    setStep(1);
                  }}
                />
              )}

              {step === 1 && <StepSelf />}

              {step === 2 && <StepLocation form={form} setForm={setForm} />}

              {step === 3 && <StepPolygon form={form} setForm={setForm} />}

              {step === 4 && <StepDetail form={form} setForm={setForm} />}

              {step === 5 && <StepPhotos form={form} setForm={setForm} />}

              {step === 6 && <StepReview form={form} setForm={setForm} />}
            </div>

            {step > 0 && (
              <div className="mt-8 flex justify-between gap-3 border-t border-[rgba(15,23,42,.08)] pt-5">
                <Button variant="secondary" onClick={back}>
                  Kembali
                </Button>

                <Button onClick={next} disabled={nextDisabled}>
                  {step === labels.length - 1 ? "Daftarkan Lahan" : "Lanjut"}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </section>
    </main>
  );
}

function StepOwnership({
  onPick,
}: {
  onPick: (v: "self" | "on_behalf") => void;
}) {
  const opts = [
    {
      value: "self" as const,
      title: "Lahan saya sendiri",
      desc: "Saya pemilik legal lahan ini",
      icon: User,
    },
    {
      value: "on_behalf" as const,
      title: "Lahan orang lain",
      desc: "Kerabat, anggota koperasi, atau kelompok tani",
      icon: Users,
    },
  ];

  return (
    <div>
      <h2 className="display-sm">Lahan ini milik siapa?</h2>
      <p className="mt-2 text-sm leading-6 text-ink-500">
        Pilih agar sistem meminta data legal yang sesuai.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {opts.map(({ value, title, desc, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => onPick(value)}
            className="rounded-2xl border border-ink-200 bg-white p-6 text-left transition hover:-translate-y-0.5 hover:border-green-600 hover:bg-green-50 hover:shadow-md"
          >
            <div className="grid h-12 w-12 place-items-center rounded-full bg-green-100 text-green-700">
              <Icon className="h-6 w-6" />
            </div>

            <div className="mt-5 text-lg font-semibold">{title}</div>
            <div className="mt-1 text-sm leading-6 text-ink-500">{desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepSelf() {
  return (
    <div>
      <h2 className="display-sm">Data diri Anda</h2>
      <p className="mt-2 text-sm leading-6 text-ink-500">
        Hanya diminta sekali untuk identitas penanggung jawab.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Nama lengkap">
          <TextInput defaultValue="Asep Suryadi" />
        </Field>

        <Field label="NIK">
          <TextInput defaultValue="3201987654321098" />
        </Field>

        <Field label="Foto KTP">
          <div className="rounded-xl border border-dashed border-green-400 bg-green-50 p-5 text-center">
            <CircleCheck className="mx-auto h-6 w-6 text-green-700" />
            <div className="mt-2 text-sm font-semibold text-green-700">
              KTP terupload — Verified
            </div>
          </div>
        </Field>
      </div>
    </div>
  );
}

function StepLocation({
  form,
  setForm,
}: {
  form: Form;
  setForm: (f: Form) => void;
}) {
  return (
    <div>
      <h2 className="display-sm">Di mana lahannya?</h2>
      <p className="mt-2 text-sm leading-6 text-ink-500">
        Ketik nama dan alamat lahan, lalu{" "}
        <strong className="text-ink-700">klik peta</strong> untuk pasang titik
        koordinat. Seret titik untuk memindahkan posisi.
      </p>

      <div className="mt-6 space-y-5">
        {/* Text fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama lahan">
            <TextInput
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>

          <Field label="Alamat / desa">
            <TextInput
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
        </div>

        {/* Interactive pinpoint map */}
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <span className="text-[13px] font-semibold text-ink-700">
              Titik koordinat lahan
            </span>
            {!form.pinLocation && (
              <span className="rounded-full bg-earth-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-earth-700">
                Opsional
              </span>
            )}
          </div>
          <PinpointMap
            value={form.pinLocation}
            onChange={(pinLocation) => setForm({ ...form, pinLocation })}
            height={420}
          />
        </div>
      </div>
    </div>
  );
}

function StepPolygon({
  form,
  setForm,
}: {
  form: Form;
  setForm: (f: Form) => void;
}) {
  return (
    <div>
      <h2 className="display-sm">Gambar batas lahan</h2>
      <p className="mt-2 text-sm leading-6 text-ink-500">
        Tandai sudut lahan. Klik area peta untuk menambah vertex, lalu drag
        titik untuk merapikan batas.
      </p>

      <div className="mt-5">
        <PolygonEditor
          value={form.polygonPoints}
          onChange={(polygonPoints) => setForm({ ...form, polygonPoints })}
          height={480}
        />
      </div>

      <div className="mt-4 flex gap-2 rounded-lg bg-earth-50 p-3 text-sm text-earth-700">
        <Info className="h-4 w-4 flex-none" />
        Tidak yakin batasnya? Buat estimasi dulu dari titik-titik utama, lalu
        perbaiki nanti saat verifikasi lapangan.
      </div>
    </div>
  );
}

function StepDetail({
  form,
  setForm,
}: {
  form: Form;
  setForm: (f: Form) => void;
}) {
  const treeOptions = [
    "Kopi",
    "Cengkeh",
    "Sengon",
    "Kakao",
    "Karet",
    "Jati",
    "Mahoni",
    "Durian",
    "Mangga",
    "Petai",
    "Kemiri",
    "Kelapa",
  ];

  return (
    <div>
      <h2 className="display-sm">Detail lahan</h2>
      <p className="mt-2 text-sm leading-6 text-ink-500">
        Sedikit info untuk akurasi estimasi carbon stock.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Jenis lahan">
          <SelectInput
            value={form.landType}
            onChange={(e) =>
              setForm({ ...form, landType: e.target.value as LandType })
            }
          >
            {LAND_TYPE_OPTIONS.map((landType) => (
              <option key={landType} value={landType}>
                {landType}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="Tahun mulai dikelola">
          <TextInput
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
          />
        </Field>

        <Field label="Jenis pohon dominan" hint="Pilih satu atau lebih">
          <div className="flex flex-wrap gap-2">
            {treeOptions.map((t) => {
              const on = form.trees.includes(t);

              return (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      trees: on
                        ? form.trees.filter((x) => x !== t)
                        : [...form.trees, t],
                    })
                  }
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                    on
                      ? "border-green-700 bg-green-700 text-green-50"
                      : "border-ink-200 bg-white text-ink-700"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </Field>

        <Field
          label="Estimasi jumlah pohon"
          hint="Tidak yakin? Lewati — sistem akan hitung dari foto"
        >
          <TextInput placeholder="(opsional)" />
        </Field>
      </div>
    </div>
  );
}

function StepPhotos({
  form,
  setForm,
}: {
  form: Form;
  setForm: (f: Form) => void;
}) {
  const photoError =
    form.landImages.length > 0 && form.landImages.length < 3
      ? `Minimal 3 foto diperlukan. Sudah ada ${form.landImages.length}, tambahkan ${3 - form.landImages.length} lagi.`
      : undefined;

  return (
    <div>
      <h2 className="display-sm">Foto kondisi lahan</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink-500">
        Upload foto dari <strong className="text-ink-700">permukaan tanah</strong>, bukan foto udara atau drone.
        Foto ini digunakan untuk menilai kondisi riil lahan: tegakan pohon,
        batas kebun, kondisi kanopi, dan tanaman dominan. Semakin jelas,
        semakin tinggi trust score.
      </p>

      {/* Ground-level tips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {["Tegakan pohon", "Batas lahan", "Kanopi dari bawah", "Tanaman dominan"].map((tip) => (
          <span
            key={tip}
            className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"
          >
            {tip}
          </span>
        ))}
        <span className="rounded-full border border-[#B23B3B]/20 bg-[#B23B3B]/5 px-3 py-1 text-xs font-semibold text-[#B23B3B]">
          ✕ Bukan aerial/drone
        </span>
      </div>

      <div className="mt-8 space-y-8">
        {/* Legal document — required */}
        <FileUploadCard
          label="Dokumen legal lahan"
          hint="Sertifikat tanah, SPPT, atau surat keterangan lahan · PDF, JPG, PNG"
          accept=".pdf,.jpg,.jpeg,.png"
          file={form.legalDoc}
          onChange={(file) => setForm({ ...form, legalDoc: file })}
          required
          error={
            form.legalDoc === null && form.landImages.length >= 3
              ? "Dokumen legal wajib diupload untuk melanjutkan."
              : undefined
          }
        />

        {/* Divider */}
        <div className="border-t border-[rgba(15,23,42,.06)]" />

        {/* Land condition photos — required min 3 */}
        <div>
          <div className="mb-1 flex items-center gap-1.5">
            <span className="text-[13px] font-semibold text-ink-700">
              Foto kondisi lahan dari darat
            </span>
            <span className="rounded-full bg-earth-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-earth-700">
              Wajib · min. 3
            </span>
          </div>
          <p className="mb-4 text-xs leading-5 text-ink-500">
            Bukan foto satelit atau drone. Foto diambil berdiri di lahan,
            mengarah ke pohon, batas, atau vegetasi.
          </p>

          <ImageUploadList
            images={form.landImages}
            onChange={(landImages) => setForm({ ...form, landImages })}
            minRequired={3}
            error={photoError}
          />
        </div>
      </div>

      {/* Validation summary when neither is done */}
      {(form.legalDoc === null || form.landImages.length < 3) && (
        <div className="mt-6 rounded-2xl border border-earth-200 bg-earth-50 px-5 py-4 text-sm leading-6 text-earth-700">
          <p className="font-semibold text-earth-900">Sebelum lanjut, pastikan:</p>
          <ul className="mt-2 space-y-1">
            {form.legalDoc === null && (
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-earth-500 flex-none" />
                Dokumen legal wajib diupload
              </li>
            )}
            {form.landImages.length < 3 && (
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-earth-500 flex-none" />
                Minimal 3 foto kondisi lahan dari darat ({form.landImages.length} dari 3 terpilih)
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function StepReview({
  form,
  setForm,
}: {
  form: Form;
  setForm: (f: Form) => void;
}) {
  const areaHa = useMemo(
    () => estimateAreaHaFromSvgPolygon(form.polygonPoints),
    [form.polygonPoints]
  );

  const polygonStatus =
    form.polygonPoints.length >= 3
      ? `${form.polygonPoints.length} vertex · polygon valid`
      : `${form.polygonPoints.length} vertex · belum valid`;

  return (
    <div>
      <h2 className="display-sm">Review & konfirmasi</h2>
      <p className="mt-2 text-sm leading-6 text-ink-500">
        Pastikan semua data benar sebelum daftarkan.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="eyebrow">Lahan</div>
          <div className="mt-2 font-display text-2xl font-medium">
            {form.name}
          </div>
          <div className="mt-1 text-sm text-ink-500">
            {form.address} · {areaHa.toLocaleString("id-ID")} ha
            {form.pinLocation && (
              <span className="ml-2 font-mono text-xs text-ink-400">
                ({form.pinLocation.lat.toFixed(4)}, {form.pinLocation.lng.toFixed(4)})
              </span>
            )}
          </div>
        </Card>

        <Card>
          <div className="eyebrow">Jenis lahan</div>
          <div className="mt-2 font-display text-2xl font-medium">
            {form.landType}
          </div>
          <div className="mt-1 text-sm text-ink-500">
            Disimpan sebagai field resmi data plot.
          </div>
        </Card>

        <Card>
          <div className="eyebrow">Polygon</div>
          <div className="mt-2 font-display text-2xl font-medium">
            {areaHa.toLocaleString("id-ID")} ha
          </div>
          <div className="mt-1 text-sm text-ink-500">{polygonStatus}</div>
        </Card>

        <Card>
          <div className="eyebrow">Pohon dominan</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {form.trees.map((t) => (
              <span
                key={t}
                className="rounded-full bg-green-100 px-3 py-1.5 text-sm font-semibold text-green-700"
              >
                {t}
              </span>
            ))}
          </div>
        </Card>

        <label className="flex gap-3 rounded-xl border border-earth-200 bg-earth-50 p-4 text-sm leading-6 text-earth-700 lg:col-span-2">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(e) => setForm({ ...form, consent: e.target.checked })}
          />
          <span>
            Saya menyatakan data yang diberikan benar dan siap diverifikasi.
          </span>
        </label>
      </div>
    </div>
  );
}

function VerifyingView({ stage }: { stage: number }) {
  return (
    <main className="web-page">
      <AppHeader active="plots" />

      <section className="narrow-container py-12">
        <div className="text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-100 text-green-700">
            <ShieldCheck className="h-10 w-10" />
          </div>

          <h1 className="display-md mt-6">
            Kami sedang memeriksa lahanmu.
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink-500">
            Satelit, foto, dan data lahan dipadankan untuk menghasilkan
            estimasi carbon stock.
          </p>
        </div>

        <div className="mt-8">
          <LiveProgress stage={Math.min(stage, 4)} />
        </div>

        <Card className="mt-6 rounded-2xl">
          <div className="eyebrow">Proyeksi awal</div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <div className="text-sm text-ink-500">Carbon</div>
              <div className="figure text-4xl font-medium">18,4 ton</div>
            </div>

            <div>
              <div className="text-sm text-ink-500">Pendapatan</div>
              <div className="figure text-4xl font-medium">
                {formatIDR(1288000)}
              </div>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}