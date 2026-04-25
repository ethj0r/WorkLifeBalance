'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, MapPin } from 'lucide-react';
import { TextInput } from '@/components/ui/FormFields';
import { cn } from '@/lib/utils';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onLocationSelect?: (lat: number, lng: number, displayName: string) => void;
  placeholder?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onLocationSelect,
  placeholder = 'Cari alamat lahan...',
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
            new URLSearchParams({
              q: value,
              format: 'json',
              limit: '5',
              countrycodes: 'id', // bias ke Indonesia
              addressdetails: '1',
            }),
          {
            headers: {
              'Accept-Language': 'id',
            },
          }
        );
        const data: NominatimResult[] = await res.json();
        setSuggestions(data);
        setOpen(true);
      } catch (err) {
        console.error('Geocoding error:', err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  // Click outside untuk close dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (result: NominatimResult) => {
    onChange(result.display_name);
    onLocationSelect?.(
      parseFloat(result.lat),
      parseFloat(result.lon),
      result.display_name
    );
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <TextInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          className="pl-10"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Search size={16} strokeWidth={1.75} />
          )}
        </span>
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-ink-200 rounded-sm shadow-lg z-30 max-h-72 overflow-y-auto">
          {suggestions.map((s) => (
            <button
              key={s.place_id}
              type="button"
              onClick={() => handleSelect(s)}
              className={cn(
                'w-full text-left px-3 py-2.5 hover:bg-green-50 transition-colors',
                'flex items-start gap-2.5 border-b border-[rgba(15,23,42,0.06)] last:border-b-0'
              )}
            >
              <MapPin
                size={16}
                strokeWidth={1.75}
                className="mt-0.5 flex-shrink-0 text-green-700"
              />
              <span className="text-sm text-ink-900 line-clamp-2">
                {s.display_name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}