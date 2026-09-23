import { Clock, Calendar } from 'lucide-react';
import {
  formatRegionalTime,
  resolveUserTimeZone,
  COUNTRY_FLAGS,
} from '../utils/timezoneUtils';

interface RegionalClockCardProps {
  country?: string;
  city?: string;
  currentTime: Date;
}

export function RegionalClockCard({
  country,
  city,
  currentTime,
}: RegionalClockCardProps) {
  // Resolve only that particular country's timezone
  const timeZone = resolveUserTimeZone(country, city);
  const timeData = formatRegionalTime(currentTime, timeZone);

  const countryFlag = country ? COUNTRY_FLAGS[country] || '🌍' : '🌍';
  const locationLabel = country
    ? `${country}${city ? ` (${city})` : ''}`
    : 'Country Time';

  return (
    <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-xl px-4 py-2.5 shadow-md border border-blue-900/60 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        {/* Country & Region Info */}
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg">{countryFlag}</span>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-white">
              <span className="text-orange-400 font-semibold text-xs uppercase tracking-wider">Region:</span>
              <span>{locationLabel}</span>
              <span className="text-slate-400 font-normal text-xs hidden sm:inline">
                ({timeData.gmtOffset})
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium">
              {timeData.timeZoneLabel}
            </p>
          </div>
        </div>

        {/* Date & 12-Hour Clock with Seconds */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Calendar Date */}
          <div className="flex items-center gap-1.5 text-slate-200 text-xs sm:text-sm">
            <Calendar className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
            <span className="font-medium whitespace-nowrap">{timeData.fullDate}</span>
          </div>

          <span className="text-slate-600 hidden sm:inline">|</span>

          {/* 12-Hour Digital Clock with Seconds */}
          <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-lg border border-white/10">
            <Clock className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 animate-pulse" />
            <div className="font-mono font-bold text-base sm:text-lg tracking-wider text-white flex items-center">
              <span>{timeData.hours}</span>
              <span className="text-orange-400 animate-pulse mx-0.5">:</span>
              <span>{timeData.minutes}</span>
              <span className="text-orange-400 animate-pulse mx-0.5">:</span>
              <span className="text-orange-400">{timeData.seconds}</span>
            </div>
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-black rounded bg-orange-500 text-white uppercase tracking-wider">
              {timeData.ampm}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
