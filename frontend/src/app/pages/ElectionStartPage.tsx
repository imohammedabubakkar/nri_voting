import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import {
  ArrowLeft, CalendarDays, Clock, Play, Square, CheckSquare, Building2,
  Landmark, MapPin, AlertTriangle, CheckCircle2, Globe2, RotateCcw, Award,
} from 'lucide-react';
import { DISTRICTS_BY_STATE } from '../data/indiaData';
import { CountryClockSelector } from '../components/RegionalClockCard';
import { getCountryElectionStatus, getCountryFlag, computeLiveElectionStatus, checkAndAutoStopElection, addDaysToDate } from '../utils/timezoneUtils';
import { resetConstituencyVoting, resetAllConstituencyVoting } from '../utils/voteUtils';
import { Time12Input } from '../components/Time12Input';

interface ElectionSchedule {
  date: string;
  fromTime: string;
  toTime: string;
  resultDate: string;
  resultTime: string;
  country?: string;
  city?: string;
  allConstituencies: boolean;
  state: string;
  district: string;
  assemblyConstituency: string;
  parliamentConstituency: string;
  status: 'active' | 'ended' | 'scheduled';
  startedAt: number;
}

const ALL_STATES = Object.keys(DISTRICTS_BY_STATE).sort();

const inputCls =
  'w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none bg-white text-sm text-gray-800';
const selectCls =
  'w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none bg-white text-sm text-gray-800';

function formatTime(t: string) {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatDate(d: string) {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export function ElectionStartPage() {
  const navigate = useNavigate();

  const [date, setDate] = useState('');
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [resultDate, setResultDate] = useState('');
  const [resultTime, setResultTime] = useState('');
  const [allConstituencies, setAllConstituencies] = useState(true);
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [assemblyConstituency, setAssemblyConstituency] = useState('');
  const [parliamentConstituency, setParliamentConstituency] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [existing, setExisting] = useState<ElectionSchedule | null>(null);
  const [previewCountry, setPreviewCountry] = useState<string>(() => {
    return (typeof localStorage !== 'undefined' && localStorage.getItem('selectedPreviewCountry')) || '';
  });
  const [previewCity, setPreviewCity] = useState<string>(() => {
    return (typeof localStorage !== 'undefined' && localStorage.getItem('selectedPreviewCity')) || '';
  });
  const [now, setNow] = useState(new Date());

  // Live ticking clock (1-second precision) and automatic election stop checker
  useEffect(() => {
    const update = () => {
      const current = new Date();
      setNow(current);
      checkAndAutoStopElection(current, previewCountry, previewCity);
      const saved = localStorage.getItem('electionSchedule');
      if (saved) {
        setExisting(JSON.parse(saved));
      } else {
        setExisting(null);
      }
    };

    update();
    const id = setInterval(update, 1000);
    window.addEventListener('electionScheduleUpdated', update);
    window.addEventListener('storage', update);
    return () => {
      clearInterval(id);
      window.removeEventListener('electionScheduleUpdated', update);
      window.removeEventListener('storage', update);
    };
  }, [previewCountry, previewCity]);

  // Initialize input fields from existing schedule on mount
  useEffect(() => {
    const saved = localStorage.getItem('electionSchedule');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date) setDate(parsed.date);
      if (parsed.fromTime) setFromTime(parsed.fromTime);
      if (parsed.toTime) setToTime(parsed.toTime);
      if (parsed.resultDate) setResultDate(parsed.resultDate);
      if (parsed.resultTime) setResultTime(parsed.resultTime);
      if (parsed.allConstituencies !== undefined) setAllConstituencies(parsed.allConstituencies);
      if (parsed.state) setState(parsed.state);
      if (parsed.district) setDistrict(parsed.district);
      if (parsed.assemblyConstituency) setAssemblyConstituency(parsed.assemblyConstituency);
      if (parsed.parliamentConstituency) setParliamentConstituency(parsed.parliamentConstituency);
    }
  }, []);

  // For "All Countries" election, automatically ensure resultDate is at least 2 days after election start date
  useEffect(() => {
    if (previewCountry === 'All Countries' && date) {
      const minResDate = addDaysToDate(date, 2);
      if (!resultDate || resultDate < minResDate) {
        setResultDate(minResDate);
      }
    }
  }, [previewCountry, date]);

  // Derive constituency options from registered candidates + users for this state/district
  const allCandidates: { electionType: string; constituency: string; state?: string; district?: string }[] =
    JSON.parse(localStorage.getItem('registeredCandidates') || '[]');
  const allUsers: { indianState?: string; indianDistrict?: string; assemblyConstituency?: string; parliamentConstituency?: string }[] =
    JSON.parse(localStorage.getItem('registeredUsers') || '[]');

  const districtOptions = state ? DISTRICTS_BY_STATE[state] || [] : [];

  const candidatesInLoc = allCandidates.filter(
    c => (!state || c.state === state) && (!district || c.district === district)
  );
  const usersInLoc = allUsers.filter(
    u => (!state || u.indianState === state) && (!district || u.indianDistrict === district)
  );

  const assemblyOptions = Array.from(
    new Set([
      ...usersInLoc.map(u => u.assemblyConstituency).filter(Boolean),
      ...candidatesInLoc.filter(c => c.electionType === 'assembly').map(c => c.constituency),
    ])
  ).sort() as string[];

  const parliamentOptions = Array.from(
    new Set([
      ...usersInLoc.map(u => u.parliamentConstituency).filter(Boolean),
      ...candidatesInLoc.filter(c => c.electionType === 'parliament').map(c => c.constituency),
    ])
  ).sort() as string[];

  function validate() {
    const errs: string[] = [];
    if (!date) errs.push('Election date is required.');
    if (!fromTime) errs.push('Start time is required.');
    if (!toTime) errs.push('End time is required.');
    if (fromTime && toTime && fromTime >= toTime) errs.push('End time must be after start time.');
    if (!resultDate) errs.push('Result release date (India Time) is required.');
    if (!resultTime) errs.push('Result release time (India Time) is required.');

    // For "All Countries" election selection, enforce result release date to be after 2 days of election start date
    if (previewCountry === 'All Countries' && date && resultDate) {
      const minResultDate = addDaysToDate(date, 2);
      if (resultDate < minResultDate) {
        errs.push(
          `For "All Countries" election, the result release date must be after 2 days of the conducting election start date (Earliest allowed: ${formatDate(minResultDate)}).`
        );
      }
    }

    if (!allConstituencies) {
      if (!state) errs.push('Please select a state.');
      if (!district) errs.push('Please select a district.');
      if (!assemblyConstituency && !parliamentConstituency)
        errs.push('Select at least one constituency (Assembly or Parliament).');
    }
    return errs;
  }

  function handleStart() {
    const errs = validate();
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);

    const schedule: ElectionSchedule = {
      date,
      fromTime,
      toTime,
      resultDate,
      resultTime,
      country: previewCountry,
      city: previewCity,
      allConstituencies,
      state: allConstituencies ? '' : state,
      district: allConstituencies ? '' : district,
      assemblyConstituency: allConstituencies ? '' : assemblyConstituency,
      parliamentConstituency: allConstituencies ? '' : parliamentConstituency,
      status: 'active',
      startedAt: Date.now(),
    };
    localStorage.setItem('electionSchedule', JSON.stringify(schedule));
    setExisting(schedule);
    window.dispatchEvent(new CustomEvent('electionScheduleUpdated', { detail: schedule }));

    // Whenever an election is launched from this page, reset voting so vote starts
    // from first (0 votes) for all candidates of the same constituency
    if (allConstituencies) {
      resetAllConstituencyVoting({ reason: 'Election started for all constituencies' });
    } else {
      resetConstituencyVoting({
        state,
        district,
        assemblyConstituency,
        parliamentConstituency,
        reason: 'Election started for selected constituencies',
      });
    }

    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  }

  function handleStop() {
    localStorage.removeItem('electionSchedule');
    localStorage.removeItem('selectedPreviewCountry');
    localStorage.removeItem('selectedPreviewCity');
    window.dispatchEvent(new CustomEvent('electionScheduleUpdated', { detail: null }));
    setDate(''); setFromTime(''); setToTime('');
    setResultDate(''); setResultTime('');
    setState(''); setDistrict(''); setAssemblyConstituency(''); setParliamentConstituency('');
    setAllConstituencies(true);
    setPreviewCountry('');
    setPreviewCity('');
    setExisting(null);
    window.location.reload();
  }

  function handleClear() {
    localStorage.removeItem('electionSchedule');
    localStorage.removeItem('selectedPreviewCountry');
    localStorage.removeItem('selectedPreviewCity');
    window.dispatchEvent(new CustomEvent('electionScheduleUpdated', { detail: null }));
    setDate(''); setFromTime(''); setToTime('');
    setResultDate(''); setResultTime('');
    setState(''); setDistrict(''); setAssemblyConstituency(''); setParliamentConstituency('');
    setAllConstituencies(true);
    setPreviewCountry('');
    setPreviewCity('');
    setExisting(null);
    window.location.reload();
  }

  function handleStateChange(val: string) {
    setState(val);
    setDistrict('');
    setAssemblyConstituency('');
    setParliamentConstituency('');
  }
  function handleDistrictChange(val: string) {
    setDistrict(val);
    setAssemblyConstituency('');
    setParliamentConstituency('');
  }

  const liveStatus = computeLiveElectionStatus(existing, now, previewCountry, previewCity);
  const isElectionActive = liveStatus === 'active';

  const effectiveSchedule = existing || (date && fromTime && toTime && resultDate && resultTime ? {
    date,
    fromTime,
    toTime,
    resultDate,
    resultTime,
    status: 'active',
    allConstituencies: true,
    state: '',
    district: '',
    assemblyConstituency: '',
    parliamentConstituency: '',
    startedAt: Date.now(),
  } as ElectionSchedule : null);

  const countryPreview = effectiveSchedule && previewCountry
    ? getCountryElectionStatus(effectiveSchedule, previewCountry, previewCity, now)
    : null;

  // Automatically stop, reset all entered fields, and refresh the whole page when election ends
  useEffect(() => {
    if (!existing) return;

    const checkCountry = existing.country || previewCountry;
    const checkCity = existing.city || previewCity;
    const targetStatus = checkCountry
      ? getCountryElectionStatus(existing, checkCountry, checkCity, now).status
      : null;

    const isEnded =
      existing.status === 'ended' ||
      liveStatus === 'ended' ||
      countryPreview?.status === 'ended' ||
      targetStatus === 'ended';

    if (isEnded) {
      localStorage.removeItem('electionSchedule');
      localStorage.removeItem('selectedPreviewCountry');
      localStorage.removeItem('selectedPreviewCity');
      window.dispatchEvent(new CustomEvent('electionScheduleUpdated', { detail: null }));

      setDate('');
      setFromTime('');
      setToTime('');
      setResultDate('');
      setResultTime('');
      setState('');
      setDistrict('');
      setAssemblyConstituency('');
      setParliamentConstituency('');
      setAllConstituencies(true);
      setPreviewCountry('');
      setPreviewCity('');
      setExisting(null);

      window.location.reload();
    }
  }, [existing, liveStatus, countryPreview?.status, previewCountry, previewCity]);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 text-blue-900 hover:text-blue-700 mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-xl border-t-4 border-orange-500 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Play className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Election Start</h2>
              <p className="text-orange-100 text-sm">Schedule and launch an election for constituencies</p>
            </div>
          </div>

          <div className="p-8 space-y-8">

            {/* ── CURRENT ELECTION STATUS (ONLY SHOWN DURING ELECTION TIME) ── */}
            {existing && isElectionActive && (
              <div className="rounded-xl border-2 p-5 border-green-500 bg-green-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-black text-base text-green-700">
                        Election is ACTIVE
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {formatDate(existing.date)} &nbsp;·&nbsp; {formatTime(existing.fromTime)} – {formatTime(existing.toTime)}
                        <span className="ml-1 text-xs text-blue-600 font-semibold">(Country-Local Time)</span>
                      </p>
                      {existing.resultDate && existing.resultTime && (
                        <p className="text-xs text-green-700 font-semibold mt-1 flex items-center gap-1.5">
                          <span className="text-sm">🇮🇳</span>
                          <span>Result Release (IST):</span>
                          <span className="font-bold text-green-800">
                            {formatDate(existing.resultDate)} at {formatTime(existing.resultTime)} (India Time Only)
                          </span>
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Scope:{' '}
                        <span className="font-semibold">
                          {existing.allConstituencies
                            ? 'All Constituencies'
                            : [existing.state, existing.district, existing.assemblyConstituency, existing.parliamentConstituency]
                                .filter(Boolean)
                                .join(' → ')}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={handleStop}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors cursor-pointer"
                    >
                      <Square className="w-4 h-4" />
                      Stop
                    </button>
                    <button
                      onClick={handleClear}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-bold transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── LIVE REGIONAL CLOCK / WORLD TIME REFERENCE ── */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Global Time &amp; Regional Status Inspector
                </p>
                {countryPreview && previewCountry && (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                    countryPreview.status === 'active'
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : countryPreview.status === 'not_started'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-red-100 text-red-700 border border-red-300'
                  }`}>
                    <span>{getCountryFlag(previewCountry)}</span>
                    <span>{previewCountry}:</span>
                    <span className="uppercase">{countryPreview.status.replace('_', ' ')}</span>
                    <span className="text-[11px] opacity-80 font-normal">
                      {previewCountry === 'All Countries' ? '(Worldwide Local Time)' : `(${countryPreview.localFormattedTime12})`}
                    </span>
                  </span>
                )}
              </div>
              <CountryClockSelector
                country={previewCountry}
                city={previewCity}
                defaultCountry=""
                onCountryChange={(c, city) => {
                  setPreviewCountry(c);
                  setPreviewCity(city || '');
                  if (c === 'All Countries' && date) {
                    const minResDate = addDaysToDate(date, 2);
                    if (!resultDate || resultDate < minResDate) {
                      setResultDate(minResDate);
                    }
                  }
                  if (c) {
                    localStorage.setItem('selectedPreviewCountry', c);
                    if (city) localStorage.setItem('selectedPreviewCity', city);
                  } else {
                    localStorage.removeItem('selectedPreviewCountry');
                    localStorage.removeItem('selectedPreviewCity');
                  }
                }}
              />
            </div>

            {/* ── ELECTION DATE & TIME (APPLIES TO EACH VOTER'S COUNTRY TIME) ── */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-black text-blue-900 flex items-center gap-2 uppercase tracking-wide">
                  <CalendarDays className="w-5 h-5 text-orange-500" />
                  Election Date &amp; Time
                </h3>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1.5 shadow-sm">
                  <Globe2 className="w-3.5 h-3.5 text-blue-700" />
                  <span>Applies to Each Voter's Respective Country Time</span>
                </span>
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                <span className="text-base leading-none">🌍</span>
                <div>
                  <p className="font-bold">Country-Local Voting Schedule (Not Indian Time)</p>
                  <p className="text-blue-800 mt-0.5">
                    Start time and end time apply directly to each NRI voter according to their respective registered country's local clock. For example, if you set <strong>9:00 AM – 5:00 PM</strong>, a voter in Australia votes 9:00 AM–5:00 PM Australian time, a voter in the UAE votes 9:00 AM–5:00 PM UAE time, and a voter in the USA votes 9:00 AM–5:00 PM US time.
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5 text-orange-500" /> Date of Election
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => {
                      const newDate = e.target.value;
                      setDate(newDate);
                      if (previewCountry === 'All Countries') {
                        if (newDate) {
                          const minResDate = addDaysToDate(newDate, 2);
                          if (!resultDate || resultDate < minResDate) {
                            setResultDate(minResDate);
                          }
                        }
                      } else {
                        if (!resultDate) setResultDate(newDate);
                      }
                    }}
                    className={inputCls}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-orange-500" /> From Time (Start)
                    </label>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      12-Hr · AM/PM
                    </span>
                  </div>
                  <Time12Input
                    value={fromTime}
                    onChange={setFromTime}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-orange-500" /> To Time (End)
                    </label>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      12-Hr · AM/PM
                    </span>
                  </div>
                  <Time12Input
                    value={toTime}
                    onChange={val => {
                      setToTime(val);
                      if (!resultTime) setResultTime(val);
                    }}
                  />
                </div>

                {/* Preview */}
                {(date || fromTime || toTime) && (
                  <div className="sm:col-span-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-blue-600 font-bold uppercase tracking-wide">
                        🌍 Country-Local Voting Window (Each Voter's Country Clock)
                      </p>
                      <p className="text-sm font-black text-blue-950 mt-0.5">
                        {date ? formatDate(date) : 'Date not set'} &nbsp;·&nbsp; {formatTime(fromTime)} → {formatTime(toTime)}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Every NRI voter will be able to cast their vote within this time window on their respective country clock.
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 bg-blue-200 text-blue-800 rounded-md">
                      Local Country Time
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ── RESULT RELEASE DATE & TIME (STRICTLY INDIA TIME ONLY) ── */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-black text-blue-900 flex items-center gap-2 uppercase tracking-wide">
                  <Award className="w-5 h-5 text-green-600" />
                  Result Release Date &amp; Time
                </h3>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-300 flex items-center gap-1.5 shadow-sm">
                  <span>🇮🇳</span>
                  <span>India Standard Time (IST / GMT+5:30) Only</span>
                </span>
              </div>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <span className="text-base leading-none">ℹ️</span>
                <div>
                  <p className="font-bold">Strict India Standard Time Enforcement</p>
                  <p className="text-amber-800 mt-0.5">
                    Election results will only be unlocked and published strictly when the official clock in India reaches this scheduled release date and time. Local times in other countries will not release results earlier.
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5 text-green-600" /> Result Release Date (India Date)
                  </label>
                  <input
                    type="date"
                    value={resultDate}
                    min={
                      previewCountry === 'All Countries' && date
                        ? addDaysToDate(date, 2)
                        : date || ''
                    }
                    onChange={e => setResultDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-green-600" /> Result Release Time (India IST)
                    </label>
                    <span className="text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                      12-Hr · AM/PM
                    </span>
                  </div>
                  <Time12Input
                    value={resultTime}
                    onChange={setResultTime}
                  />
                </div>

                {/* Result Release Preview */}
                {(resultDate || resultTime) && (
                  <div className="sm:col-span-2 bg-green-50 border-2 border-green-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-green-700 font-bold uppercase tracking-wide">
                        🇮🇳 Scheduled Result Publication (India Standard Time)
                      </p>
                      <p className="text-sm font-black text-green-900 mt-0.5">
                        {formatDate(resultDate)} &nbsp;·&nbsp; {formatTime(resultTime)} IST
                      </p>
                      <p className="text-[11px] text-green-800 mt-0.5">
                        Results will be officially released simultaneously across all countries when India's clock reaches this IST time.
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 bg-green-200 text-green-800 rounded-md">
                      IST (GMT+5:30)
                    </span>
                  </div>
                )}

                {/* Informational Callout when 'All Countries' is selected */}
                {previewCountry === 'All Countries' && (
                  <div className="sm:col-span-2 p-3.5 bg-blue-50 border-2 border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5 shadow-sm">
                    <span className="text-base leading-none">🌍</span>
                    <div>
                      <p className="font-bold text-blue-950">2-Day Result Release Delay Enforced for "All Countries"</p>
                      <p className="text-blue-800 mt-0.5">
                        Because election is conducted across all international timezones based on each country's own local clock, election results can only be released after 2 days of conducting the election start date (Earliest:{' '}
                        <strong className="text-blue-950 font-bold">{date ? formatDate(addDaysToDate(date, 2)) : 'Date + 2 Days'}</strong>).
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* ── CONSTITUENCY SCOPE ── */}
            <div>
              <h3 className="text-base font-black text-blue-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
                <MapPin className="w-5 h-5 text-orange-500" />
                Election Scope
              </h3>

              {/* All constituencies checkbox */}
              <label className="flex items-center gap-3 cursor-pointer mb-5 group">
                <div
                  onClick={() => setAllConstituencies(!allConstituencies)}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer
                    ${allConstituencies ? 'bg-orange-500 border-orange-500' : 'bg-white border-gray-400 group-hover:border-orange-400'}`}
                >
                  {allConstituencies && <CheckSquare className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <p className="font-bold text-blue-900 flex items-center gap-2">
                    <Globe2 className="w-4 h-4 text-orange-500" />
                    All Constituencies
                  </p>
                  <p className="text-xs text-gray-500">Run this election across every registered constituency</p>
                </div>
              </label>

              {/* Specific constituency selectors */}
              {!allConstituencies && (
                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-5 space-y-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Select Specific Location &amp; Constituency
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* State */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                        State / UT
                      </label>
                      <select value={state} onChange={e => handleStateChange(e.target.value)} className={selectCls}>
                        <option value="">-- Select State --</option>
                        {ALL_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    {/* District */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                        District
                      </label>
                      <select
                        value={district}
                        onChange={e => handleDistrictChange(e.target.value)}
                        className={selectCls}
                        disabled={!state}
                      >
                        <option value="">{state ? '-- Select District --' : 'Select state first'}</option>
                        {districtOptions.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>

                    {/* Assembly */}
                    <div>
                      <label className="block text-xs font-bold text-blue-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" /> Assembly Constituency
                      </label>
                      <select
                        value={assemblyConstituency}
                        onChange={e => setAssemblyConstituency(e.target.value)}
                        className={`${selectCls} ${assemblyConstituency ? 'border-blue-500 bg-blue-50' : ''}`}
                        disabled={!district}
                      >
                        <option value="">
                          {district
                            ? assemblyOptions.length ? '-- Select Assembly --' : 'No assembly data'
                            : 'Select district first'}
                        </option>
                        {assemblyOptions.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>

                    {/* Parliament */}
                    <div>
                      <label className="block text-xs font-bold text-green-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                        <Landmark className="w-3.5 h-3.5" /> Parliament Constituency
                      </label>
                      <select
                        value={parliamentConstituency}
                        onChange={e => setParliamentConstituency(e.target.value)}
                        className={`${selectCls} ${parliamentConstituency ? 'border-green-500 bg-green-50' : ''}`}
                        disabled={!district}
                      >
                        <option value="">
                          {district
                            ? parliamentOptions.length ? '-- Select Parliament --' : 'No parliament data'
                            : 'Select district first'}
                        </option>
                        {parliamentOptions.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 mt-1">
                    You can select both Assembly and Parliament, or just one.
                  </p>
                </div>
              )}
            </div>

            {/* ── ERRORS ── */}
            {errors.length > 0 && (
              <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <p className="font-bold text-red-700 text-sm">Please fix the following:</p>
                </div>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((e, i) => (
                    <li key={i} className="text-sm text-red-600">{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── SUCCESS ── */}
            {success && (
              <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-green-800 text-base">Election has been started successfully!</p>
                  <p className="text-green-700 text-sm mt-0.5">
                    Voting has been reset to start fresh from first (0 votes) for all candidates in the scheduled constituencies, and all voters are ready to vote.
                  </p>
                </div>
              </div>
            )}

            {/* ── SUMMARY BEFORE START ── */}
            {date && fromTime && toTime && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
                <p className="text-xs font-black text-blue-700 uppercase tracking-widest mb-3">Election Summary</p>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Date:</span>{' '}
                    <span className="font-bold text-blue-900">{formatDate(date)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Time (Country Local):</span>{' '}
                    <span className="font-bold text-blue-900">{formatTime(fromTime)} → {formatTime(toTime)}</span>
                  </div>
                  {resultDate && resultTime && (
                    <div className="sm:col-span-2 pt-2 border-t border-blue-200 flex items-center justify-between">
                      <span className="text-gray-500">Result Release (India Time):</span>
                      <span className="font-bold text-green-800">
                        {formatDate(resultDate)} &nbsp;·&nbsp; {formatTime(resultTime)} IST (GMT+5:30)
                      </span>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <span className="text-gray-500">Scope:</span>{' '}
                    <span className="font-bold text-blue-900">
                      {allConstituencies
                        ? 'All Constituencies'
                        : [
                            state,
                            district,
                            assemblyConstituency && `Assembly: ${assemblyConstituency}`,
                            parliamentConstituency && `Parliament: ${parliamentConstituency}`,
                          ]
                            .filter(Boolean)
                            .join(' → ') || 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── START BUTTON ── */}
            <button
              onClick={handleStart}
              className="w-full py-4 rounded-xl font-black text-lg flex items-center justify-center gap-3
                bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700
                hover:shadow-xl transition-all active:scale-98"
            >
              <Play className="w-6 h-6" />
              Start Election
            </button>

          </div>
        </div>
      </div>
    </Layout>
  );
}
