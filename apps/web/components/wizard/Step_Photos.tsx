'use client';

import { Camera, FileText, X, CheckCircle2, Plus } from 'lucide-react';
import { useWizard } from './WizardContext';
import { Field } from '@/components/ui/FormFields';
import { cn } from '@/lib/utils';

const MIN_PHOTOS = 3;
const MAX_PHOTOS = 10;

export function Step_Photos() {
  const { form, updateForm } = useWizard();

  // Mock photo upload — di production ganti dengan real upload ke Supabase Storage
  const handlePhotoUpload = () => {
    if (form.photos.length >= MAX_PHOTOS) return;
    const newPhoto = `mock://photo-${Date.now()}-${form.photos.length}.jpg`;
    updateForm({ photos: [...form.photos, newPhoto] });
  };

  const removePhoto = (idx: number) => {
    updateForm({ photos: form.photos.filter((_, i) => i !== idx) });
  };

  // Mock document upload
  const handleDocumentUpload = () => {
    const newDoc = {
      url: `mock://doc-${Date.now()}.pdf`,
      type: 'sertifikat' as const,
    };
    updateForm({ legal_documents: [...form.legal_documents, newDoc] });
  };

  const removeDocument = (idx: number) => {
    updateForm({
      legal_documents: form.legal_documents.filter((_, i) => i !== idx),
    });
  };

  const photoCount = form.photos.length;
  const isPhotoCountValid = photoCount >= MIN_PHOTOS;

  return (
    <div className="animate-fade-in">
      <h2 className="font-display text-[24px] mb-1">Foto bukti lahan</h2>
      <p className="text-sm text-ink-500 mb-5">
        Foto pohon dari berbagai sudut. Minimal {MIN_PHOTOS} foto, maksimal {MAX_PHOTOS}.
      </p>

      {/* Section A: Legal documents (optional) */}
      <Field
        label="Dokumen legal"
        hint={
          form.ownership === 'on_behalf'
            ? `Pastikan atas nama ${form.owner_full_name || 'pemilik lahan'}. Opsional.`
            : 'Sertifikat / SPPT meningkatkan trust score. Opsional.'
        }
      >
        {form.legal_documents.length === 0 ? (
          <button
            type="button"
            onClick={handleDocumentUpload}
            className="
              w-full p-4 border border-dashed border-ink-300 rounded-sm
              bg-white text-center transition-all
              hover:border-green-400 hover:bg-green-50/50
            "
          >
            <FileText
              size={20}
              strokeWidth={1.75}
              className="text-ink-500 inline-block"
            />
            <div className="text-[13px] text-ink-700 font-semibold mt-1">
              Tap untuk upload dokumen
            </div>
            <div className="text-xs text-ink-500 mt-0.5">
              Sertifikat, SPPT, atau Surat Keterangan Tanah (PDF/JPG)
            </div>
          </button>
        ) : (
          <div className="space-y-2">
            {form.legal_documents.map((doc, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-sm"
              >
                <FileText
                  size={18}
                  strokeWidth={1.75}
                  className="text-green-700 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-green-700">
                    Dokumen terupload
                  </div>
                  <div className="text-xs text-ink-500 truncate">
                    {doc.url.split('/').pop()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeDocument(idx)}
                  className="text-ink-400 hover:text-danger transition-colors"
                  aria-label="Hapus dokumen"
                >
                  <X size={16} strokeWidth={1.75} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleDocumentUpload}
              className="text-[13px] font-semibold text-green-700 hover:text-green-800 transition-colors"
            >
              + Tambah dokumen lain
            </button>
          </div>
        )}
      </Field>

      {/* Section B: Photos (required) */}
      <div className="mt-5">
        <Field
          label="Foto kondisi lahan"
          required
          hint={
            isPhotoCountValid
              ? `${photoCount} foto terupload. Foto ini akan dianalisis AI untuk verifikasi.`
              : `${photoCount}/${MIN_PHOTOS} foto. Tambahkan ${MIN_PHOTOS - photoCount} lagi.`
          }
        >
          <div className="grid grid-cols-3 gap-2">
            {form.photos.map((photo, idx) => (
              <PhotoThumb
                key={idx}
                index={idx}
                onRemove={() => removePhoto(idx)}
              />
            ))}
            {photoCount < MAX_PHOTOS && (
              <button
                type="button"
                onClick={handlePhotoUpload}
                className="
                  aspect-square rounded-sm border border-dashed border-ink-300
                  bg-white flex flex-col items-center justify-center gap-1
                  hover:border-green-400 hover:bg-green-50/50 transition-all
                "
              >
                {photoCount === 0 ? (
                  <Camera size={20} strokeWidth={1.75} className="text-ink-500" />
                ) : (
                  <Plus size={20} strokeWidth={1.75} className="text-ink-500" />
                )}
                <span className="text-[10px] font-semibold text-ink-500">
                  {photoCount === 0 ? 'Foto pertama' : 'Tambah'}
                </span>
              </button>
            )}
          </div>
        </Field>

        {/* Photo guide */}
        <div className="mt-4 p-3.5 bg-earth-50 rounded-md text-xs text-earth-700">
          <div className="font-semibold mb-1.5">📸 Tips foto yang baik:</div>
          <ul className="space-y-0.5 ml-4 list-disc">
            <li>Foto pohon dari berbagai sudut (depan, samping, atas)</li>
            <li>Pencahayaan terang, hindari foto buram</li>
            <li>Sertakan landmark sekitar lahan kalau memungkinkan</li>
            <li>Untuk hasil terbaik: 5–7 foto</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Mock photo thumbnail dengan gradient — visual stand-in untuk demo
function PhotoThumb({ index, onRemove }: { index: number; onRemove: () => void }) {
  // Variasi gradient untuk masing-masing foto agar terlihat berbeda
  const angle = 135 + index * 25;
  return (
    <div
      className="relative aspect-square rounded-sm overflow-hidden group"
      style={{
        background: `linear-gradient(${angle}deg, #2F6840, #6FAF6C)`,
      }}
    >
      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-white/90 backdrop-blur-sm rounded-xs text-[10px] font-semibold text-green-700 flex items-center gap-1">
        <CheckCircle2 size={10} strokeWidth={2.5} />
        Foto {index + 1}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Hapus foto ${index + 1}`}
        className={cn(
          'absolute top-1.5 right-1.5 w-5 h-5 rounded-pill bg-white/90 backdrop-blur-sm',
          'flex items-center justify-center transition-opacity',
          'opacity-0 group-hover:opacity-100 focus:opacity-100',
          'hover:bg-white text-ink-700 hover:text-danger'
        )}
      >
        <X size={12} strokeWidth={2} />
      </button>
    </div>
  );
}