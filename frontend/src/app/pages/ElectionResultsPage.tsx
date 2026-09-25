import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import {
  ArrowLeft, TrendingUp, MapPin, UserX, Building2, Landmark, Filter,
  Lock, Clock, CalendarDays, CheckCircle2, Eye, EyeOff, AlertTriangle, ShieldCheck,
} from 'lucide-react';
import { DISTRICTS_BY_STATE } from '../data/indiaData';
import { PARTY_SYMBOL_IMAGES } from '../data/partySymbolImages';
import { ensureNotaCandidates, isNotaCandidate } from '../utils/candidateUtils';
import { getResultReleaseStatus } from '../utils/timezoneUtils';

interface RegisteredUser {
  id: number;
  name: string;
  aadhaar: string;
  indianState?: string;
  indianDistrict?: string;
  assemblyConstituency?: string;
  parliamentConstituency?: string;
  constituency?: string;
  hasVotedAssembly?: boolean;
  hasVotedParliament?: boolean;
}

interface Candidate {
  id: number;
  name: string;
  partyName: string;
  partySymbol: string;
  partyAbbr: string;
  partySymbolImage?: string;
  constituency: string;
  electionType: string;
  state?: string;
  district?: string;
  isDefault?: boolean;
}

const ALL_STATES = Object.keys(DISTRICTS_BY_STATE).sort();
const selectCls =
  'w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none bg-white text-sm';

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className={`rounded-xl p-5 text-white ${color}`}>
      <p className="text-xs font-semibold opacity-80 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-black">{value}</p>
    </div>
  );
}

function ResultPanel({
  electionType,
  constituencyName,
  candidates,
  voters,
  votesData,
}: {
  electionType: 'assembly' | 'parliament';
  constituencyName: string;
  candidates: Candidate[];
  voters: RegisteredUser[];
  votesData: Record<string, Record<string, Record<string, number>>>;
}) {
  const voteKey = electionType === 'assembly' ? 'hasVotedAssembly' : 'hasVotedParliament';
  const registered = voters.length;
  const voted = voters.filter(u => u[voteKey]).length;
  const absent = registered - voted;
  const turnout = registered > 0 ? ((voted / registered) * 100).toFixed(1) : '0.0';

  // Collect votes for this constituency from votesData
  const constitVotes: Record<string, number> = votesData[electionType]?.[constituencyName] || {};
  const totalVotesRecorded = Object.values(constitVotes).reduce((s, v) => s + v, 0);

  // Only display candidates and NOTA if at least one real candidate is assigned
  const hasRealCandidate = candidates.some(c => !isNotaCandidate(c));
  const effectiveCandidates = hasRealCandidate ? candidates : [];

  // Sort candidates by vote count descending
  const sorted = [...effectiveCandidates].sort(
    (a, b) => (constitVotes[String(b.id)] || 0) - (constitVotes[String(a.id)] || 0)
  );
  const hasVotes = totalVotesRecorded > 0;

  // Base for percentage = registered voters (the true electorate size)
  const pctBase = registered > 0 ? registered : 1;

  const isAssembly = electionType === 'assembly';
  const headerBg = isAssembly ? 'from-blue-600 to-blue-700' : 'from-green-600 to-green-700';
  const borderColor = isAssembly ? 'border-blue-500' : 'border-green-500';
  const barColor = isAssembly ? 'bg-blue-500' : 'bg-green-500';

  return (
    <div className={`border-2 ${borderColor} rounded-2xl overflow-hidden shadow-lg`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${headerBg} px-6 py-4 flex items-center gap-3`}>
        {isAssembly ? <Building2 className="w-5 h-5 text-white" /> : <Landmark className="w-5 h-5 text-white" />}
        <div>
          <p className="text-xs text-white opacity-75 uppercase tracking-widest">
            {isAssembly ? 'Assembly Constituency' : 'Parliament Constituency'}
          </p>
          <h3 className="text-xl font-black text-white">{constituencyName}</h3>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Registered Voters" value={registered} color="bg-gradient-to-br from-blue-600 to-blue-700" />
          <StatCard label="Votes Cast" value={voted} color="bg-gradient-to-br from-green-600 to-green-700" />
          <StatCard label="Absentees" value={absent} color="bg-gradient-to-br from-red-500 to-red-600" />
          <StatCard label="Voter Turnout" value={`${turnout}%`} color="bg-gradient-to-br from-orange-500 to-orange-600" />
        </div>

        {effectiveCandidates.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-base font-semibold">No candidates registered for this constituency.</p>
          </div>
        ) : (
          <>
            {/* ── ALL PARTIES TABLE ── always visible */}
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
                  All Parties — Vote Count &amp; Percentage
                </h4>
                <span className="text-xs text-gray-400">{effectiveCandidates.length} candidate{effectiveCandidates.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="divide-y divide-gray-100">
                {sorted.map((c, idx) => {
                  const voteCount = constitVotes[String(c.id)] || 0;
                  const pct = (voteCount / pctBase) * 100;
                  const isTop = hasVotes && idx === 0 && voteCount > 0;

                  return (
                    <div
                      key={c.id}
                      className={`flex items-center gap-4 px-5 py-4 ${isTop ? 'bg-yellow-50' : 'bg-white'}`}
                    >
                      {/* Rank */}
                      <div className="w-7 flex-shrink-0 text-center">
                        <span className={`text-sm font-black ${isTop ? 'text-yellow-500' : 'text-gray-400'}`}>
                          #{idx + 1}
                        </span>
                      </div>

                      {/* Party symbol */}
                      <div className="w-14 h-14 flex-shrink-0 bg-gray-50 border-2 border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                        {PARTY_SYMBOL_IMAGES[c.partyName] || c.partySymbolImage ? (
                          <img
                            src={PARTY_SYMBOL_IMAGES[c.partyName] || c.partySymbolImage}
                            alt={c.partyName}
                            className="w-11 h-11 object-contain"
                          />
                        ) : (
                          <span className="text-2xl">{c.partySymbol}</span>
                        )}
                      </div>

                      {/* Candidate name + party + bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <p className="font-bold text-blue-900 text-sm">{c.name}</p>
                          {isTop && (
                            <span className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full font-bold">
                              WINNER
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{c.partyAbbr ? `${c.partyAbbr} — ` : ''}{c.partyName}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all duration-700 ${isTop ? 'bg-yellow-500' : barColor}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-700 w-14 text-right shrink-0">
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Vote count */}
                      <div className="flex-shrink-0 text-right w-16">
                        <p className={`text-2xl font-black ${isTop ? 'text-yellow-600' : 'text-gray-700'}`}>
                          {voteCount}
                        </p>
                        <p className="text-xs text-gray-400">votes</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Absentee row */}
              <div className="flex items-center gap-4 px-5 py-3 bg-red-50 border-t-2 border-red-200">
                <UserX className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="flex-1 text-sm font-semibold text-red-700">Did not vote (Absentees)</p>
                <span className="text-xl font-black text-red-500">{absent}</span>
                <span className="text-sm font-bold text-red-400 w-14 text-right">
                  {((absent / pctBase) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  );
}

export function ElectionResultsPage() {
  const navigate = useNavigate();

  const [filterState, setFilterState] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterAssembly, setFilterAssembly] = useState('');
  const [filterParliament, setFilterParliament] = useState('');
  const [, setRefresh] = useState(0);
  const [now, setNow] = useState<Date>(new Date());
  const [adminPreviewUnlocked, setAdminPreviewUnlocked] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleUpdate = () => setRefresh(r => r + 1);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('constituency_vote_reset', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('constituency_vote_reset', handleUpdate);
    };
  }, []);

  const schedule = JSON.parse(localStorage.getItem('electionSchedule') || 'null');
  const releaseStatus = getResultReleaseStatus(schedule, now);

  const allUsers: RegisteredUser[] = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
  const rawCandidates: Candidate[] = JSON.parse(localStorage.getItem('registeredCandidates') || '[]');
  const allCandidates: Candidate[] = ensureNotaCandidates(rawCandidates as any) as Candidate[];
  const votesData: Record<string, Record<string, Record<string, number>>> = JSON.parse(
    localStorage.getItem('votesData') || '{}'
  );

  const districtOptions = filterState ? DISTRICTS_BY_STATE[filterState] || [] : [];

  // Filter users + candidates by state & district
  const usersInLoc = allUsers.filter(
    u =>
      (!filterState || u.indianState === filterState) &&
      (!filterDistrict || u.indianDistrict === filterDistrict)
  );
  const candidatesInLoc = allCandidates.filter(
    c =>
      (!filterState || c.state === filterState) &&
      (!filterDistrict || c.district === filterDistrict)
  );

  // Build assembly options from both users AND candidates so the dropdown always shows relevant constituencies
  const assemblyFromUsers = usersInLoc.map(u => u.assemblyConstituency).filter(Boolean) as string[];
  const assemblyFromCandidates = candidatesInLoc
    .filter(c => c.electionType === 'assembly')
    .map(c => c.constituency)
    .filter(Boolean);
  const assemblyOptions = Array.from(new Set([...assemblyFromUsers, ...assemblyFromCandidates])).sort();

  // Build parliament options from both users AND candidates
  const parliamentFromUsers = usersInLoc
    .map(u => u.parliamentConstituency || u.constituency)
    .filter(Boolean) as string[];
  const parliamentFromCandidates = candidatesInLoc
    .filter(c => c.electionType === 'parliament')
    .map(c => c.constituency)
    .filter(Boolean);
  const parliamentOptions = Array.from(new Set([...parliamentFromUsers, ...parliamentFromCandidates])).sort();

  // Voters for selected constituencies
  const assemblyVoters = filterAssembly
    ? allUsers.filter(
        u =>
          (!filterState || u.indianState === filterState) &&
          (!filterDistrict || u.indianDistrict === filterDistrict) &&
          u.assemblyConstituency === filterAssembly
      )
    : [];

  const parliamentVoters = filterParliament
    ? allUsers.filter(
        u =>
          (!filterState || u.indianState === filterState) &&
          (!filterDistrict || u.indianDistrict === filterDistrict) &&
          (u.parliamentConstituency || u.constituency) === filterParliament
      )
    : [];

  // Candidates for selected constituencies
  const assemblyCandidates = filterAssembly
    ? allCandidates.filter(c => c.electionType === 'assembly' && c.constituency === filterAssembly)
    : [];

  const parliamentCandidates = filterParliament
    ? allCandidates.filter(c => c.electionType === 'parliament' && c.constituency === filterParliament)
    : [];

  const showResults = filterAssembly || filterParliament;

  function handleStateChange(val: string) {
    setFilterState(val);
    setFilterDistrict('');
    setFilterAssembly('');
    setFilterParliament('');
  }
  function handleDistrictChange(val: string) {
    setFilterDistrict(val);
    setFilterAssembly('');
    setFilterParliament('');
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 text-blue-900 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-green-600">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-blue-900 mb-1">Election Results</h2>
              <p className="text-gray-500 text-sm">
                Select state, district and constituency to view results
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-600" />
          </div>

          {/* ── RESULT RELEASE GATE (INDIA TIME ONLY) ── */}
          {releaseStatus.isConfigured && !releaseStatus.isReleased && !adminPreviewUnlocked ? (
            <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-6 sm:p-10 shadow-2xl border-4 border-orange-500 overflow-hidden relative">
              {/* Background watermark */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none select-none text-9xl">
                🇮🇳
              </div>

              <div className="relative z-10 space-y-6">
                {/* Header Tag */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/20 border border-orange-400 text-orange-300 text-xs font-bold uppercase tracking-wider">
                    <span>🇮🇳</span>
                    <span>India Standard Time (IST / GMT+5:30) Controlled Release</span>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">
                    Timezone: Asia/Kolkata (UTC+05:30)
                  </span>
                </div>

                {/* Title and Lock */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border-2 border-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/10">
                    <Lock className="w-8 h-8 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white">
                      Election Results Awaited
                    </h3>
                    <p className="text-blue-200 text-sm mt-1 max-w-xl">
                      Official election results are confidential and locked. They will only be published when the official clock in India reaches the scheduled release date and time.
                    </p>
                  </div>
                </div>

                {/* Live Countdown Display */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                  <p className="text-xs font-bold text-orange-400 uppercase tracking-widest text-center mb-4">
                    ⏳ Time Remaining Until Official India Time Release
                  </p>
                  <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-lg mx-auto text-center">
                    <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                      <span className="block text-2xl sm:text-4xl font-black text-white">
                        {String(releaseStatus.days).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold">Days</span>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                      <span className="block text-2xl sm:text-4xl font-black text-white">
                        {String(releaseStatus.hours).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold">Hours</span>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                      <span className="block text-2xl sm:text-4xl font-black text-white">
                        {String(releaseStatus.minutes).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold">Minutes</span>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                      <span className="block text-2xl sm:text-4xl font-black text-orange-400">
                        {String(releaseStatus.seconds).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold">Seconds</span>
                    </div>
                  </div>
                </div>

                {/* Two Details Cards: Scheduled IST vs Current IST */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                      <CalendarDays className="w-4 h-4 text-green-400" />
                      Scheduled Release (India Time)
                    </p>
                    <p className="text-base font-bold text-white">
                      {releaseStatus.resultFormattedDate}
                    </p>
                    <p className="text-sm font-black text-green-400 mt-0.5">
                      {releaseStatus.resultFormattedTime12} IST (GMT+5:30)
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                      <Clock className="w-4 h-4 text-blue-400" />
                      Current Official India Clock
                    </p>
                    <p className="text-base font-bold text-white">
                      {releaseStatus.indiaCurrentDate}
                    </p>
                    <p className="text-sm font-black text-blue-300 mt-0.5 font-mono">
                      {releaseStatus.indiaCurrentTime12} IST
                    </p>
                  </div>
                </div>

                {/* Policy Notice */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-200">
                  <p className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    Strict India Time Policy
                  </p>
                  Election results will only be unlocked based on India time only. NRI voters and portal visitors in any other country timezone (e.g., USA, UK, UAE, Australia, Canada, Singapore) cannot view results until India reaches the release schedule.
                </div>

                {/* Admin Confidential Preview Option */}
                <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-xs text-gray-400">
                    Administrator verification needed? You can preview confidential draft counts before official public release.
                  </p>
                  <button
                    onClick={() => setAdminPreviewUnlocked(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-md"
                  >
                    <Eye className="w-4 h-4" />
                    Inspect Confidential Results (Admin Preview)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* If Admin Preview Override is active */}
              {releaseStatus.isConfigured && !releaseStatus.isReleased && adminPreviewUnlocked && (
                <div className="bg-amber-50 border-2 border-amber-500 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="font-black text-amber-900 text-sm">
                        CONFIDENTIAL ADMIN PREVIEW — NOT YET RELEASED IN INDIA TIME (IST)
                      </p>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Official public release in {releaseStatus.countdownFormatted} on {releaseStatus.resultFormattedDate} at {releaseStatus.resultFormattedTime12} IST. Voters currently cannot access these results.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAdminPreviewUnlocked(false)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shrink-0"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    Re-lock View
                  </button>
                </div>
              )}

              {/* If Officially Released */}
              {releaseStatus.isConfigured && releaseStatus.isReleased && (
                <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-7 h-7 text-green-600 flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-green-800 text-base">
                          ✓ Official Election Results Declared
                        </span>
                        <span className="px-2 py-0.5 bg-green-600 text-white text-[11px] font-black rounded uppercase">
                          Published
                        </span>
                      </div>
                      <p className="text-xs text-green-700 mt-0.5">
                        Declared on {releaseStatus.resultFormattedDate} at {releaseStatus.resultFormattedTime12} (India Standard Time - IST). Results are now public across all countries.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1.5 bg-green-200 text-green-900 rounded-lg shrink-0">
                    🇮🇳 India Time (IST)
                  </span>
                </div>
              )}

              {/* Filter Panel */}
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 mb-8">
                <h3 className="text-sm font-black text-blue-900 mb-4 flex items-center gap-2 uppercase tracking-widest">
                  <Filter className="w-4 h-4 text-orange-500" />
                  Select Location &amp; Constituency
                </h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* State */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      State / UT
                    </label>
                    <select
                      value={filterState}
                      onChange={e => handleStateChange(e.target.value)}
                      className={selectCls}
                    >
                      <option value="">-- Select State --</option>
                      {ALL_STATES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* District */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      District
                    </label>
                    <select
                      value={filterDistrict}
                      onChange={e => handleDistrictChange(e.target.value)}
                      className={selectCls}
                      disabled={!filterState}
                    >
                      <option value="">{filterState ? '-- Select District --' : 'Select state first'}</option>
                      {districtOptions.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Assembly */}
                  <div>
                    <label className="block text-xs font-bold text-blue-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" /> Assembly Constituency
                    </label>
                    <select
                      value={filterAssembly}
                      onChange={e => setFilterAssembly(e.target.value)}
                      className={`${selectCls} ${filterAssembly ? 'border-blue-500 bg-blue-50' : ''}`}
                      disabled={!filterDistrict}
                    >
                      <option value="">
                        {filterDistrict
                          ? assemblyOptions.length
                            ? '-- Select Assembly Constituency --'
                            : 'No assembly data for this district'
                          : 'Select district first'}
                      </option>
                      {assemblyOptions.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  {/* Parliament */}
                  <div>
                    <label className="block text-xs font-bold text-green-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <Landmark className="w-3.5 h-3.5" /> Parliament Constituency
                    </label>
                    <select
                      value={filterParliament}
                      onChange={e => setFilterParliament(e.target.value)}
                      className={`${selectCls} ${filterParliament ? 'border-green-500 bg-green-50' : ''}`}
                      disabled={!filterDistrict}
                    >
                      <option value="">
                        {filterDistrict
                          ? parliamentOptions.length
                            ? '-- Select Parliament Constituency --'
                            : 'No parliament data for this district'
                          : 'Select district first'}
                      </option>
                      {parliamentOptions.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {showResults && (
                  <button
                    onClick={() => { setFilterAssembly(''); setFilterParliament(''); }}
                    className="mt-4 text-xs text-red-500 hover:text-red-700 underline"
                  >
                    Clear constituency selection
                  </button>
                )}
              </div>

              {/* Results */}
              {!showResults ? (
                <div className="text-center py-20 text-gray-400">
                  <MapPin className="w-14 h-14 mx-auto mb-4 opacity-25" />
                  <p className="text-lg font-semibold text-gray-500">Select a constituency above to view results</p>
                  <p className="text-sm mt-1">Choose Assembly, Parliament, or both</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {filterAssembly && (
                    <ResultPanel
                      electionType="assembly"
                      constituencyName={filterAssembly}
                      candidates={assemblyCandidates}
                      voters={assemblyVoters}
                      votesData={votesData}
                    />
                  )}
                  {filterParliament && (
                    <ResultPanel
                      electionType="parliament"
                      constituencyName={filterParliament}
                      candidates={parliamentCandidates}
                      voters={parliamentVoters}
                      votesData={votesData}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
