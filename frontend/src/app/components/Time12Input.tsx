import React, { useState, useEffect } from 'react';
import { Clock, ChevronDown } from 'lucide-react';

export interface Time12InputProps {
  value: string; // 24-hour format "HH:mm" (e.g. "04:59", "16:30", "00:31", or "")
  onChange: (value24: string) => void;
  id?: string;
  className?: string;
  hasError?: boolean;
  disabled?: boolean;
}

export function parse24to12(time24: string): { time12Text: string; hours: string; minutes: string; ampm: 'AM' | 'PM' } {
  if (!time24 || !time24.includes(':')) {
    return { time12Text: '', hours: '', minutes: '', ampm: 'AM' };
  }
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return { time12Text: '', hours: '', minutes: '', ampm: 'AM' };
  const m = parseInt(mStr || '0', 10);
  const ampm: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;

  const paddedH = String(h).padStart(2, '0');
  const paddedM = String(isNaN(m) ? 0 : m).padStart(2, '0');

  return {
    time12Text: `${paddedH}:${paddedM}`,
    hours: paddedH,
    minutes: paddedM,
    ampm,
  };
}

export function format12to24(hours: string | number, minutes: string | number, ampm: 'AM' | 'PM'): string {
  let h = parseInt(String(hours || '12'), 10);
  let m = parseInt(String(minutes || '0'), 10);
  if (isNaN(h) || h < 1) h = 12;
  if (h > 12) h = 12;
  if (isNaN(m) || m < 0) m = 0;
  if (m > 59) m = 59;

  let h24 = h;
  if (ampm === 'AM') {
    if (h === 12) h24 = 0;
  } else {
    // PM
    if (h !== 12) h24 = h + 12;
  }

  return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Clean 12-Hour Number Entering Format Time Input
 * - Allows direct number entering for time (hh:mm format, restricted to 12-hour values 01-12)
 * - Dedicated down-drop option for selecting AM / PM
 */
export function Time12Input({
  value,
  onChange,
  id,
  className = '',
  hasError = false,
  disabled = false,
}: Time12InputProps) {
  const parsed = parse24to12(value);
  const [inputText, setInputText] = useState(parsed.time12Text);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(parsed.ampm);

  // Synchronize when external value prop changes from outside
  useEffect(() => {
    const p = parse24to12(value);
    setInputText(p.time12Text);
    setAmpm(p.ampm);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    if (!raw.trim()) {
      setInputText('');
      onChange('');
      return;
    }

    // Keep only numbers and colon
    let cleaned = raw.replace(/[^\d:]/g, '');

    // Allow user to backspace freely
    if (raw.length < inputText.length) {
      setInputText(cleaned);
      return;
    }

    // Auto-insert colon if user typed 2 digits without colon (e.g. typing "04")
    if (!cleaned.includes(':')) {
      const digits = cleaned.replace(/\D/g, '');
      if (digits.length === 2) {
        cleaned = `${digits}:`;
      } else if (digits.length > 2) {
        cleaned = `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
      }
    } else {
      // If there is a colon, enforce max 2 digits for hours and max 2 digits for minutes
      const [hPart = '', mPart = ''] = cleaned.split(':');
      cleaned = `${hPart.slice(0, 2)}:${mPart.slice(0, 2)}`;
    }

    // Restrict hour to 12-hour format (hours cannot exceed 12)
    const [hStr, mStr] = cleaned.split(':');
    if (hStr && hStr.length === 2) {
      const hNum = parseInt(hStr, 10);
      if (hNum > 12) {
        cleaned = `12:${mStr || ''}`;
      } else if (hNum === 0) {
        cleaned = `12:${mStr || ''}`;
      }
    }
    // Restrict minutes to max 59
    if (mStr && mStr.length === 2) {
      const mNum = parseInt(mStr, 10);
      if (mNum > 59) {
        cleaned = `${hStr}:59`;
      }
    }

    setInputText(cleaned);

    // If fully entered (e.g. "04:59" or "4:59"), propagate to onChange
    if (cleaned.includes(':')) {
      const [h, m] = cleaned.split(':');
      if (h && m && m.length === 2) {
        const val24 = format12to24(h, m, ampm);
        onChange(val24);
      }
    }
  };

  const handleBlur = () => {
    if (!inputText.trim()) return;

    let [hStr = '', mStr = ''] = inputText.split(':');
    let hNum = parseInt(hStr || '12', 10);
    let mNum = parseInt(mStr || '00', 10);

    // Enforce 12-hour format rules (01-12)
    if (isNaN(hNum) || hNum < 1) hNum = 12;
    if (hNum > 12) hNum = 12;
    if (isNaN(mNum) || mNum < 0) mNum = 0;
    if (mNum > 59) mNum = 59;

    const paddedH = String(hNum).padStart(2, '0');
    const paddedM = String(mNum).padStart(2, '0');
    const finalFormatted = `${paddedH}:${paddedM}`;

    setInputText(finalFormatted);

    const val24 = format12to24(paddedH, paddedM, ampm);
    onChange(val24);
  };

  const handleAmpmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAmpm = e.target.value as 'AM' | 'PM';
    setAmpm(newAmpm);

    if (inputText.includes(':')) {
      const [h, m] = inputText.split(':');
      if (h && m) {
        const val24 = format12to24(h, m, newAmpm);
        onChange(val24);
      }
    }
  };

  return (
    <div
      id={id}
      className={`flex items-center border-2 rounded-lg bg-white overflow-hidden transition-all shadow-sm
        ${hasError ? 'border-red-400 bg-red-50/30' : 'border-gray-300 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100'}
        ${disabled ? 'opacity-60 bg-gray-100 cursor-not-allowed' : ''}
        ${className}`}
    >
      {/* ── DIRECT NUMBER ENTERING INPUT (12-Hour format hh:mm) ── */}
      <input
        type="text"
        inputMode="numeric"
        value={inputText}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder="hh:mm (e.g. 04:59)"
        disabled={disabled}
        title="Enter time in 12-hour format (01:00 to 12:59)"
        className="flex-1 min-w-0 px-3.5 py-2.5 text-sm font-black text-gray-800 tracking-wider placeholder:text-gray-400 placeholder:font-normal focus:outline-none bg-transparent"
      />

      {/* ── DOWN DROP OPTION FOR SELECTING AM / PM ── */}
      <div className="relative border-l-2 border-gray-200 flex-shrink-0">
        <select
          value={ampm}
          onChange={handleAmpmChange}
          disabled={disabled}
          title="Select AM or PM"
          className="appearance-none bg-orange-50 hover:bg-orange-100/80 text-orange-950 font-black text-xs sm:text-sm pl-3.5 pr-8 py-2.5 focus:outline-none cursor-pointer transition-colors"
        >
          <option value="AM" className="font-bold text-gray-800 bg-white">
            AM
          </option>
          <option value="PM" className="font-bold text-gray-800 bg-white">
            PM
          </option>
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-orange-700 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* Clock Icon Indicator */}
      <div className="px-2.5 sm:px-3 text-gray-400 border-l border-gray-200 flex items-center justify-center shrink-0">
        <Clock className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
}
