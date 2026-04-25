// export function Logo({ compact = false }: { compact?: boolean }) {
//   return (
//     <div className="flex items-center gap-2">
//       <div className="grid h-7 w-7 place-items-center rounded-full bg-green-700 text-green-50 shadow-xs">
//         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
//           <path d="M12 3C8 5.6 5.8 9.1 5.8 13.1c0 4.1 2.7 7 6.2 7s6.2-2.9 6.2-7C18.2 9.1 16 5.6 12 3Z" fill="currentColor" opacity=".9" />
//           <path d="M12 5v14M8.5 10.2 12 12.5l3.5-2.3M8.8 14.2 12 16.1l3.2-1.9" stroke="#234D2E" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
//         </svg>
//       </div>
//       {!compact && <span className="font-display text-lg font-medium tracking-[-0.02em] text-ink-900">CarbonLink</span>}
//     </div>
//   );
// }

import Image from "next/image";
import logo from "@/public/logo.png";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-green-0 shadow-xs">
        <Image
          src={logo}
          alt="CarbonLink logo"
          width={28}
          height={28}
          className="object-cover"
          priority
        />
      </div>
      {!compact && (
        <span className="font-display text-lg font-medium tracking-[-0.02em] text-ink-900">
          CarbonLink
        </span>
      )}
    </div>
  );
}
