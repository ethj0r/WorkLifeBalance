'use client';

import { User, Users, ChevronRight } from 'lucide-react';
import { useWizard } from './WizardContext';
import type { OwnershipType } from '@karbonkredit/types';

const OPTIONS: {
  value: OwnershipType;
  title: string;
  desc: string;
  icon: typeof User;
}[] = [
  {
    value: 'self',
    title: 'Lahan saya sendiri',
    desc: 'Saya pemilik legal lahan ini',
    icon: User,
  },
  {
    value: 'on_behalf',
    title: 'Lahan orang lain',
    desc: 'Kerabat, anggota koperasi, dll',
    icon: Users,
  },
];

export function Step_Ownership() {
  const { setOwnership } = useWizard();

  return (
    <div className="animate-fade-in">
      <h2 className="font-display text-[24px] mb-2">Lahan ini milik siapa?</h2>
      <p className="text-sm text-ink-500 mb-5">
        Pilih agar kami bisa minta data yang sesuai.
      </p>

      <div className="flex flex-col gap-3">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setOwnership(opt.value)}
              className="
                flex items-center gap-3.5 p-[18px]
                bg-white border border-ink-200 rounded-md
                cursor-pointer text-left transition-all duration-200 ease-out-expo
                hover:border-green-600 hover:bg-green-50
                focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100
              "
            >
              <div
                className="
                  w-11 h-11 flex-shrink-0 rounded-pill
                  bg-green-100 text-green-700
                  flex items-center justify-center
                "
              >
                <Icon size={20} strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-ink-900">
                  {opt.title}
                </div>
                <div className="text-[13px] text-ink-500 mt-0.5">
                  {opt.desc}
                </div>
              </div>
              <ChevronRight
                size={18}
                strokeWidth={1.75}
                className="text-ink-400 flex-shrink-0"
              />
            </button>
          );
        })}
      </div>

      {/* Info card untuk on_behalf — surface trust mechanism untuk juri */}
      <div className="mt-6 p-3.5 bg-earth-50 rounded-md border border-earth-200 text-[13px] text-earth-700">
        <div className="font-semibold mb-1">
          🤝 Mendaftarkan untuk orang lain?
        </div>
        <p>
          Kami akan minta data pemilik lahan dan dokumen yang menyatakan
          persetujuan. Pemilik akan dapat notifikasi tiap aktivitas penting.
        </p>
      </div>
    </div>
  );
}