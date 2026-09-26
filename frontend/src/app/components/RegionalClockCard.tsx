import { useState, useEffect } from 'react';
import { Clock, Calendar, Globe2, ChevronDown, MapPin } from 'lucide-react';
import {
  formatRegionalTime,
  resolveUserTimeZone,
  getCountryFlag,
  getDefaultCityForCountry,
  getAvailableCitiesForCountry,
  ALL_COUNTRIES,
  POPULAR_NRI_COUNTRIES,
} from '../utils/timezoneUtils';

export interface RegionalClockCardProps {
  country?: string;
  city?: string;
  currentTime?: Date;
  className?: string;
  showCountrySelect?: boolean;
  defaultCountry?: string;
  onCountryChange?: (country: string, city?: string) => void;
}

export function RegionalClockCard({
  country: controlledCountry,
  city: controlledCity,
  currentTime: controlledTime,
  className = '',
  showCountrySelect = false,
  defaultCountry = '',
  onCountryChange,
}: RegionalClockCardProps) {
  // Live ticking fallback if no external currentTime is provided
  const [internalTime, setInternalTime] = useState<Date>(new Date());
  useEffect(() => {
    if (controlledTime) return;
    const interval = setInterval(() => setInternalTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [controlledTime]);

  const currentTime = controlledTime || internalTime;

  // Selected country state (empty by default if selecting from dropdown)
  const [selectedCountry, setSelectedCountry] = useState<string>(
    controlledCountry || (showCountrySelect ? (defaultCountry || '') : (defaultCountry || 'India'))
  );

  // Sync if controlledCountry prop changes
  useEffect(() => {
    if (controlledCountry !== undefined) {
      setSelectedCountry(controlledCountry);
    }
  }, [controlledCountry]);

  // Selected city state
  const [selectedCity, setSelectedCity] = useState<string>(
    controlledCity || (selectedCountry ? getDefaultCityForCountry(selectedCountry) : '')
  );

  useEffect(() => {
    if (controlledCity !== undefined) {
      setSelectedCity(controlledCity);
    } else if (selectedCountry) {
      setSelectedCity(getDefaultCityForCountry(selectedCountry));
    } else {
      setSelectedCity('');
    }
  }, [selectedCountry, controlledCity]);

  const activeCountry = showCountrySelect ? selectedCountry : (controlledCountry || defaultCountry || 'India');
  const activeCity = showCountrySelect
    ? selectedCity
    : (controlledCity !== undefined ? controlledCity : (activeCountry ? getDefaultCityForCountry(activeCountry) : ''));

  const availableCities = activeCountry ? getAvailableCitiesForCountry(activeCountry) : [];
  const hasMultipleCities = availableCities.length > 1;

  function handleCountrySelect(newCountry: string) {
    setSelectedCountry(newCountry);
    const newDefaultCity = newCountry ? getDefaultCityForCountry(newCountry) : '';
    setSelectedCity(newDefaultCity);
    onCountryChange?.(newCountry, newDefaultCity);
  }

  function handleCitySelect(newCity: string) {
    setSelectedCity(newCity);
    onCountryChange?.(activeCountry, newCity);
  }

  // Resolve timezone & format only when a country is selected
  const hasSelectedCountry = Boolean(activeCountry);
  const isAllCountries = activeCountry === 'All Countries';
  const timeZone = isAllCountries
    ? 'Asia/Kolkata'
    : (hasSelectedCountry ? resolveUserTimeZone(activeCountry, activeCity) : '');
  const timeData = hasSelectedCountry ? formatRegionalTime(currentTime, timeZone) : null;
  const countryFlag = isAllCountries
    ? '🌍'
    : (hasSelectedCountry ? getCountryFlag(activeCountry) : '');

  const locationLabel = isAllCountries
    ? 'All Countries (Global Rolling Schedule)'
    : hasSelectedCountry
    ? `${activeCountry}${activeCity ? ` (${activeCity})` : ''}`
    : '';

  return (
    <div className={`space-y-3 ${className}`}>
      {showCountrySelect && (
        <div className="bg-slate-100/90 hover:bg-slate-100 border border-slate-200/90 rounded-xl p-3 sm:p-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600 flex-shrink-0">
                <Globe2 className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <label
                  htmlFor="country-timezone-dropdown"
                  className="block text-xs font-black text-blue-950 uppercase tracking-wider cursor-pointer"
                >
                  Select Country Timezone
                </label>
                <p className="text-[11px] text-gray-500">
                  Select any country to view its real-time date, day, time and AM/PM
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Country Dropdown */}
              <div className="relative min-w-[200px] sm:min-w-[240px]">
                <select
                  id="country-timezone-dropdown"
                  value={activeCountry}
                  onChange={(e) => handleCountrySelect(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-white border-2 border-orange-300 hover:border-orange-500 focus:border-orange-500 rounded-xl text-xs sm:text-sm font-bold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all cursor-pointer appearance-none"
                >
                  <option value="">-- Select Country --</option>
                  <option value="All Countries" className="font-black text-blue-900 bg-blue-50">
                    🌍 All Countries (Global - Country-Local Time)
                  </option>
                  <optgroup label="Popular NRI Locations">
                    {POPULAR_NRI_COUNTRIES.map((c) => (
                      <option key={`pop-${c}`} value={c}>
                        {getCountryFlag(c)} {c}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="All Countries (A–Z)">
                    {ALL_COUNTRIES.map((c) => (
                      <option key={`all-${c}`} value={c}>
                        {getCountryFlag(c)} {c}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <ChevronDown className="w-4 h-4 text-orange-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* City selector if country has multiple timezones */}
              {hasSelectedCountry && !isAllCountries && hasMultipleCities && (
                <div className="relative min-w-[140px]">
                  <select
                    id="city-timezone-dropdown"
                    value={activeCity}
                    onChange={(e) => handleCitySelect(e.target.value)}
                    className="w-full pl-3 pr-7 py-2 bg-white border-2 border-blue-300 hover:border-blue-500 focus:border-blue-500 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all cursor-pointer appearance-none"
                  >
                    {availableCities.map((cityOption) => (
                      <option key={cityOption} value={cityOption}>
                        {cityOption}
                      </option>
                    ))}
                  </select>
                  <MapPin className="w-3.5 h-3.5 text-blue-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── LIVE REGIONAL CLOCK CARD (Only visible after country is selected) ── */}
      {hasSelectedCountry && timeData && (
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-xl px-4 py-2.5 shadow-md border border-blue-900/60 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            {/* Country & Region Info */}
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold">{countryFlag}</span>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <span className="text-orange-400 font-semibold text-xs uppercase tracking-wider">Region:</span>
                  <span>{locationLabel}</span>
                  <span className="text-slate-400 font-normal text-xs hidden sm:inline">
                    {isAllCountries ? '(IST Reference Clock)' : `(${timeData.gmtOffset})`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium">
                  {isAllCountries
                    ? 'Country-Local Clocks: Voters vote according to their respective registered country times'
                    : timeData.timeZoneLabel}
                </p>
              </div>
            </div>

            {/* Date & 12-Hour Clock with Seconds */}
            <div className="flex items-center gap-3 ml-auto">
              {/* Calendar Date with Day of Week */}
              <div className="flex items-center gap-1.5 text-slate-200 text-xs sm:text-sm">
                <Calendar className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                <span className="font-medium whitespace-nowrap">{timeData.fullDate}</span>
              </div>

              <span className="text-slate-600 hidden sm:inline">|</span>

              {/* 12-Hour Digital Clock with Seconds & AM/PM */}
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
      )}
    </div>
  );
}

// Standalone Dropdown Selector alias component for easy use
export function CountryClockSelector(props: RegionalClockCardProps) {
  return <RegionalClockCard {...props} showCountrySelect={true} />;
}
