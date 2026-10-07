// src/components/maps/PlaceAutocompleteInput.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X, Loader2 } from 'lucide-react';
import { fetchPlacePredictions, PlacePrediction } from '@/lib/google-maps';
import { cn } from '@/lib/utils';

interface PlaceAutocompleteInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (prediction: PlacePrediction) => void;
  required?: boolean;
  className?: string;
  iconColor?: string;
  id?: string;
}

export function PlaceAutocompleteInput({
  label,
  placeholder = 'Search location or city…',
  value,
  onChange,
  onPlaceSelect,
  required = false,
  className,
  iconColor = 'text-slate-400',
  id,
}: PlaceAutocompleteInputProps) {
  const [query, setQuery] = useState(value);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch predictions on query change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val.trim() || val.trim().length < 2) {
      setPredictions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await fetchPlacePredictions(val);
        setPredictions(results);
        setIsOpen(results.length > 0);
        setSelectedIndex(-1);
      } catch (err) {
        console.warn('Autocomplete lookup error:', err);
        setPredictions([]);
      } finally {
        setIsLoading(false);
      }
    }, 150);
  };

  const handleSelectPrediction = (prediction: PlacePrediction) => {
    const selectedText = prediction.description || `${prediction.mainText}, ${prediction.secondaryText}`;
    setQuery(selectedText);
    onChange(selectedText);
    setPredictions([]);
    setIsOpen(false);
    if (onPlaceSelect) {
      onPlaceSelect(prediction);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || predictions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < predictions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : predictions.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < predictions.length) {
        e.preventDefault();
        handleSelectPrediction(predictions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    onChange('');
    setPredictions([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
          ) : (
            <MapPin className={cn('h-3.5 w-3.5', iconColor)} />
          )}
        </div>

        <input
          id={id}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (predictions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className="w-full h-8 pl-8 pr-7 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && predictions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl py-1 text-left animate-in fade-in zoom-in-95 duration-100 dark:bg-[#111c30] dark:border-[#24334c]">
          {predictions.map((p, index) => {
            const isSelected = index === selectedIndex;
            return (
              <button
                key={p.placeId || index}
                type="button"
                onClick={() => handleSelectPrediction(p)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  'w-full flex items-start gap-3 px-3 py-2 text-left text-xs transition-colors',
                  isSelected
                    ? 'bg-blue-50/90 text-blue-950 dark:bg-blue-900/40 dark:text-blue-200'
                    : 'hover:bg-slate-50 text-slate-800 dark:hover:bg-[#162238] dark:text-slate-200'
                )}
              >
                <div className="shrink-0 mt-0.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <MapPin className="h-3 w-3" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 truncate leading-tight dark:text-slate-100">
                    {p.mainText}
                  </p>
                  {p.secondaryText && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5 dark:text-slate-400">
                      {p.secondaryText}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

