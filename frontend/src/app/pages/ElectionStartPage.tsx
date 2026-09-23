import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import {
  ArrowLeft, CalendarDays, Clock, Play, Square, CheckSquare, Building2,
  Landmark, MapPin, AlertTriangle, CheckCircle2, Globe2,
} from 'lucide-react';
import { DISTRICTS_BY_STATE } from '../data/indiaData';

interface ElectionSchedule {
  date: string;
  fromTime: string;
  toTime: string;
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
  const [allConstituencies, setAllConstituencies] = useState(true);
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [assemblyConstituency, setAssemblyConstituency] = useState('');
  const [parliamentConstituency, setParliamentConstituency] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [existing, setExisting] = useState<ElectionSchedule | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('electionSchedule');
    if (saved) setExisting(JSON.parse(saved));
  }, []);

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
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  function handleStop() {
    if (!existing) return;
    const updated: ElectionSchedule = { ...existing, status: 'ended' };
    localStorage.setItem('electionSchedule', JSON.stringify(updated));
    setExisting(updated);
  }

  function handleClear() {
    localStorage.removeItem('electionSchedule');
    setExisting(null);
    setDate(''); setFromTime(''); setToTime('');
    setState(''); setDistrict(''); setAssemblyConstituency(''); setParliamentConstituency('');
    setAllConstituencies(true);
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

  const isActive = existing?.status === 'active';
  const isEnded = existing?.status === 'ended';

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

            {/* ── CURRENT ELECTION STATUS ── */}
            {existing && (
              <div className={`rounded-xl border-2 p-5 ${isActive ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {isActive ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                    ) : (
                      <Square className="w-6 h-6 text-gray-400 flex-shrink-0" />
                    )}
                    <div>
                      <p className={`font-black text-base ${isActive ? 'text-green-700' : 'text-gray-500'}`}>
                        {isActive ? 'Election is ACTIVE' : 'Election has ENDED'}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {formatDate(existing.date)} &nbsp;·&nbsp; {formatTime(existing.fromTime)} – {formatTime(existing.toTime)}
                      </p>
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
                    {isActive && (
                      <button
                        onClick={handleStop}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors"
                      >
                        <Square className="w-4 h-4" />
                        Stop
                      </button>
                    )}
                    <button
                      onClick={handleClear}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-bold transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── ELECTION DATE & TIME ── */}
            <div>
              <h3 className="text-base font-black text-blue-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
                <CalendarDays className="w-5 h-5 text-orange-500" />
                Election Date &amp; Time
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Date of Election
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> From Time
                  </label>
                  <input
                    type="time"
                    value={fromTime}
                    onChange={e => setFromTime(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> To Time
                  </label>
                  <input
                    type="time"
                    value={toTime}
                    onChange={e => setToTime(e.target.value)}
                    className={inputCls}
                  />
                </div>
                {/* Preview */}
                {(date || fromTime || toTime) && (
                  <div className="sm:col-span-1 bg-blue-50 border-2 border-blue-200 rounded-lg p-3 flex flex-col justify-center">
                    <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide mb-1">Preview</p>
                    {date && <p className="text-xs font-bold text-blue-900">{formatDate(date)}</p>}
                    {(fromTime || toTime) && (
                      <p className="text-sm font-black text-blue-700 mt-1">
                        {formatTime(fromTime)} → {formatTime(toTime)}
                      </p>
                    )}
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
              <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                <p className="font-bold text-green-700">Election has been started successfully!</p>
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
                    <span className="text-gray-500">Time:</span>{' '}
                    <span className="font-bold text-blue-900">{formatTime(fromTime)} → {formatTime(toTime)}</span>
                  </div>
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
