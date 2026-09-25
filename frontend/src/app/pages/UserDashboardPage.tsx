import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import {
  Vote, MapPin, CreditCard, Globe, Home, User, CheckCircle, CheckCircle2,
  Building2, Landmark, Clock, AlertTriangle, CalendarX, Lock, LogOut,
} from 'lucide-react';
import { PARTY_SYMBOL_IMAGES } from '../data/partySymbolImages';
import { RegionalClockCard } from '../components/RegionalClockCard';
import { getCountryElectionStatus, formatTime12 } from '../utils/timezoneUtils';
import { ensureNotaCandidates, isNotaCandidate } from '../utils/candidateUtils';

interface Candidate {
  id: number;
  name: string;
  partyName: string;
  partySymbol: string;
  partyAbbr: string;
  partySymbolImage?: string;
  constituency: string;
  electionType: string;
  state: string;
  district: string;
  isDefault?: boolean;
}

interface ElectionSchedule {
  date: string;
  fromTime: string;
  toTime: string;
  resultDate?: string;
  resultTime?: string;
  allConstituencies: boolean;
  state: string;
  district: string;
  assemblyConstituency: string;
  parliamentConstituency: string;
  status: 'active' | 'ended' | 'scheduled';
}

type ElectionStatus = 'no_election' | 'not_started' | 'active' | 'ended' | 'not_in_scope';

function getElectionStatus(schedule: ElectionSchedule | null, now: Date): ElectionStatus {
  if (!schedule || schedule.status !== 'active') return 'no_election';

  // Build Date objects for today compared against schedule date
  const [year, month, day] = schedule.date.split('-').map(Number);
  const [fromH, fromM] = schedule.fromTime.split(':').map(Number);
  const [toH, toM] = schedule.toTime.split(':').map(Number);

  const electionStart = new Date(year, month - 1, day, fromH, fromM, 0);
  const electionEnd = new Date(year, month - 1, day, toH, toM, 0);

  if (now < electionStart) return 'not_started';
  if (now > electionEnd) return 'ended';
  return 'active';
}

function isElectionInScopeForUser(
  schedule: ElectionSchedule | null,
  user: Record<string, string>,
  electionType: 'assembly' | 'parliament',
): boolean {
  if (!schedule) return false;
  if (schedule.allConstituencies) return true;

  // State / district must match if specified
  if (schedule.state && schedule.state !== user.indianState) return false;
  if (schedule.district && schedule.district !== user.indianDistrict) return false;

  if (electionType === 'assembly') {
    // If admin specified an assembly constituency, user must match it
    if (schedule.assemblyConstituency) {
      return (
        (schedule.assemblyConstituency || '').trim().toUpperCase() ===
        (user.assemblyConstituency || '').trim().toUpperCase()
      );
    }
    // Admin scheduled only parliament, not assembly
    return !schedule.parliamentConstituency; // if neither set, allow all
  } else {
    if (schedule.parliamentConstituency) {
      const userParliament = (user.parliamentConstituency || user.constituency || '').trim().toUpperCase();
      return (schedule.parliamentConstituency || '').trim().toUpperCase() === userParliament;
    }
    return !schedule.assemblyConstituency;
  }
}

function formatTime(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/* ── Election gate banner shown inside each vote section ── */
function ElectionGate({
  status,
  fromTime,
  toTime,
  date,
  countryName,
  timeZoneLabel,
  currentLocalTime,
}: {
  status: ElectionStatus;
  fromTime?: string;
  toTime?: string;
  date?: string;
  countryName?: string;
  timeZoneLabel?: string;
  currentLocalTime?: string;
}) {
  const formattedDate = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';

  if (status === 'no_election') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-gray-400" />
        </div>
        <h4 className="text-lg font-black text-gray-600 mb-2">No Election Active</h4>
        <p className="text-gray-500 text-sm">Voting is currently closed. Please wait for the administrator to start an election.</p>
      </div>
    );
  }

  if (status === 'not_started') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-blue-500" />
        </div>
        <h4 className="text-lg font-black text-blue-700 mb-2">Voting Has Not Started Yet in {countryName || 'Your Country'}</h4>
        {formattedDate && (
          <p className="text-blue-600 font-semibold text-sm mb-1">{formattedDate}</p>
        )}
        {fromTime && (
          <p className="text-gray-600 text-sm">
            Voting opens at <span className="font-bold text-blue-700">{formatTime(fromTime)}</span>
            {toTime && <> and closes at <span className="font-bold text-blue-700">{formatTime(toTime)}</span></>}
            {' '}<span className="text-xs font-semibold text-blue-600">({countryName} Local Time)</span>
          </p>
        )}
        {currentLocalTime && (
          <p className="text-xs text-gray-500 mt-2">
            Current local time in {countryName}: <span className="font-semibold text-gray-700">{currentLocalTime}</span> ({timeZoneLabel})
          </p>
        )}
      </div>
    );
  }

  if (status === 'ended') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CalendarX className="w-8 h-8 text-red-500" />
        </div>
        <h4 className="text-lg font-black text-red-600 mb-2">Voting Time Has Ended in {countryName || 'Your Country'}</h4>
        {toTime && (
          <p className="text-gray-600 text-sm">
            Voting closed at <span className="font-bold text-red-600">{formatTime(toTime)}</span>
            {' '}<span className="text-xs font-semibold text-red-500">({countryName} Local Time)</span>.
          </p>
        )}
        {currentLocalTime && (
          <p className="text-xs text-gray-500 mt-1">
            Current local time in {countryName}: <span className="font-semibold text-gray-700">{currentLocalTime}</span>
          </p>
        )}
        <p className="text-gray-400 text-sm mt-1">No more votes can be cast for this election in {countryName}.</p>
      </div>
    );
  }

  if (status === 'not_in_scope') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-yellow-500" />
        </div>
        <h4 className="text-lg font-black text-yellow-700 mb-2">Not Scheduled for Your Constituency</h4>
        <p className="text-gray-500 text-sm">This election has not been scheduled for your constituency.</p>
      </div>
    );
  }

  return null;
}

function CandidateCard({ c, selectedId, onSelect }: {
  c: Candidate; selectedId: number | null; onSelect: (id: number) => void;
}) {
  const isSelected = selectedId === c.id;
  return (
    <div
      className={`bg-white border-4 rounded-lg p-5 cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'border-green-600 shadow-lg scale-105' : 'border-gray-200 hover:border-blue-400'
      }`}
      onClick={() => onSelect(c.id)}
    >
      <div className="relative">
        {isSelected && (
          <div className="absolute -top-3 -right-3 bg-green-600 rounded-full p-1">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
        )}
        <div className="w-20 h-20 mx-auto bg-gray-50 border-2 border-gray-200 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
          {c.partySymbolImage ? (
            <img src={c.partySymbolImage} alt={c.partyName} className="w-16 h-16 object-contain" />
          ) : (
            <span className="text-4xl">{c.partySymbol}</span>
          )}
        </div>
        <h4 className="font-bold text-blue-900 text-center text-sm mb-0.5">{c.name}</h4>
        <p className="text-xs text-gray-500 text-center mb-3">{c.partyAbbr || c.partyName}</p>
        <div className={`w-full py-1.5 rounded-lg font-semibold text-sm text-center ${
          isSelected ? 'bg-green-600 text-white' : 'bg-blue-900 text-white'
        }`}>
          {isSelected ? 'Selected' : 'Select'}
        </div>
      </div>
    </div>
  );
}

function VoteSection({
  title, icon: Icon, accentColor, constituencyName, candidates,
  selectedId, onSelect, hasVoted, onConfirm,
  electionStatus, schedule, countryName, timeZoneLabel, currentLocalTime,
}: {
  title: string;
  icon: React.ElementType;
  accentColor: string;
  constituencyName: string;
  candidates: Candidate[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  hasVoted: boolean;
  onConfirm: () => void;
  electionStatus: ElectionStatus;
  schedule: ElectionSchedule | null;
  countryName?: string;
  timeZoneLabel?: string;
  currentLocalTime?: string;
}) {
  const selected = candidates.find(c => c.id === selectedId);
  const canVote = electionStatus === 'active';

  return (
    <div className={`bg-white rounded-lg shadow-xl border-t-4 ${accentColor}`}>
      <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6 opacity-70" />
          <div>
            <h3 className="text-xl font-bold text-blue-900">{title}</h3>
            {constituencyName && <p className="text-sm text-gray-500 font-medium">{constituencyName}</p>}
          </div>
        </div>
        {/* Live election timer badge */}
        {canVote && schedule && (
          <div className="flex items-center gap-1.5 bg-green-100 border border-green-400 rounded-full px-3 py-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-green-700">
              Voting Open in {countryName || 'Local Region'} · Closes {formatTime(schedule.toTime)}
            </span>
          </div>
        )}
        {electionStatus === 'ended' && (
          <div className="flex items-center gap-1.5 bg-red-100 border border-red-300 rounded-full px-3 py-1">
            <CalendarX className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs font-bold text-red-600">Voting Closed in {countryName || 'Local Region'}</span>
          </div>
        )}
      </div>

      <div className="p-8">
        {/* Already voted — always show regardless of election status */}
        {hasVoted ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h4 className="text-xl font-bold text-green-600 mb-1">Vote Recorded</h4>
            <p className="text-gray-500 text-sm">You have already cast your vote for this election.</p>
          </div>
        ) : !canVote ? (
          /* Election gate — blocks voting when not active in this country */
          <ElectionGate
            status={electionStatus}
            fromTime={schedule?.fromTime}
            toTime={schedule?.toTime}
            date={schedule?.date}
            countryName={countryName}
            timeZoneLabel={timeZoneLabel}
            currentLocalTime={currentLocalTime}
          />
        ) : !constituencyName ? (
          <div className="text-center py-10 text-gray-400">
            <p className="font-semibold">No constituency registered for your profile.</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Vote className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No candidates registered for <span className="font-bold text-gray-600">{constituencyName}</span>.</p>
            <p className="text-sm mt-1">Please contact the election administrator.</p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-5 text-center text-sm">
              Select your preferred candidate for <span className="font-bold text-blue-900">{constituencyName}</span>
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 mb-6">
              {candidates.map(c => (
                <CandidateCard key={c.id} c={c} selectedId={selectedId} onSelect={onSelect} />
              ))}
            </div>
            {selected && (
              <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 mb-5 text-center">
                <p className="text-green-800 font-semibold text-sm">
                  ✓ Selected: <span className="font-bold">{selected.name}</span> ({selected.partyAbbr || selected.partyName})
                </p>
              </div>
            )}
            <button
              onClick={onConfirm}
              disabled={selectedId === null}
              className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
                selectedId !== null
                  ? 'bg-gradient-to-r from-orange-500 via-white to-green-600 border-4 border-blue-900 text-blue-900 hover:shadow-2xl hover:scale-105'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Continue to Confirm Vote
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">Your vote is confidential and secure.</p>
          </>
        )}
      </div>
    </div>
  );
}

export function UserDashboardPage() {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [tick, setTick] = useState(0);
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<number | null>(null);
  const [selectedParliamentId, setSelectedParliamentId] = useState<number | null>(null);
  const [assemblyCandidates, setAssemblyCandidates] = useState<Candidate[]>([]);
  const [parliamentCandidates, setParliamentCandidates] = useState<Candidate[]>([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userToken');
    navigate('/user/login');
  };

  // Synchronize currentUser with registeredUsers so any constituency vote reset is immediately reflected
  const rawCurrentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const registeredUsers: any[] = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
  const matchedUser = rawCurrentUser
    ? registeredUsers.find((u: any) => u.aadhaar && u.aadhaar === rawCurrentUser.aadhaar)
    : null;
  const user = matchedUser
    ? {
        ...rawCurrentUser,
        hasVotedAssembly: !!matchedUser.hasVotedAssembly,
        hasVotedParliament: !!matchedUser.hasVotedParliament,
      }
    : rawCurrentUser;

  const schedule: ElectionSchedule | null = JSON.parse(localStorage.getItem('electionSchedule') || 'null');

  // Voter's country and city are taken directly from their registered profile
  const voterCountry: string = user?.country || 'India';
  const voterCity: string = user?.currentPlace || '';

  // Live ticking clock (1-second precision) for regional time and election gate reactions
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Listen for vote reset and storage events to ensure real-time reactive update
  useEffect(() => {
    const onResetOrStorage = () => {
      setTick(t => t + 1);
      setSelectedAssemblyId(null);
      setSelectedParliamentId(null);
    };
    window.addEventListener('storage', onResetOrStorage);
    window.addEventListener('constituency_vote_reset', onResetOrStorage);
    return () => {
      window.removeEventListener('storage', onResetOrStorage);
      window.removeEventListener('constituency_vote_reset', onResetOrStorage);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const stored: Candidate[] = JSON.parse(localStorage.getItem('registeredCandidates') || '[]');
    const resolved = ensureNotaCandidates(stored as any);

    const assemblyFiltered = resolved.filter(
      c => c.electionType === 'assembly' && c.constituency?.trim().toUpperCase() === user.assemblyConstituency?.trim().toUpperCase()
    );
    // If no candidate is assigned to assembly constituency, do not show NOTA either!
    const hasRealAssembly = assemblyFiltered.some(c => !isNotaCandidate(c));
    setAssemblyCandidates(hasRealAssembly ? assemblyFiltered : []);

    const parliamentFiltered = resolved.filter(
      c => c.electionType === 'parliament' && c.constituency?.trim().toUpperCase() === (user.parliamentConstituency || user.constituency)?.trim().toUpperCase()
    );
    // If no candidate is assigned to parliament constituency, do not show NOTA either!
    const hasRealParliament = parliamentFiltered.some(c => !isNotaCandidate(c));
    setParliamentCandidates(hasRealParliament ? parliamentFiltered : []);
  }, [tick, user?.assemblyConstituency, user?.parliamentConstituency]);

  if (!user) {
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center py-16">
          <p className="text-gray-600 text-lg mb-4">Session expired. Please log in again.</p>
          <button onClick={() => navigate('/user/login')} className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600">
            Go to Login
          </button>
        </div>
      </Layout>
    );
  }

  // Derive per-section election status based on voter's registered country local time (not Indian time)
  const countryElection = getCountryElectionStatus(schedule, voterCountry, voterCity, now);
  const globalStatus: ElectionStatus = countryElection.status;

  const assemblyStatus: ElectionStatus =
    globalStatus !== 'active' ? globalStatus
    : isElectionInScopeForUser(schedule, user, 'assembly') ? 'active' : 'not_in_scope';
  const parliamentStatus: ElectionStatus =
    globalStatus !== 'active' ? globalStatus
    : isElectionInScopeForUser(schedule, user, 'parliament') ? 'active' : 'not_in_scope';

  function handleConfirm(type: 'assembly' | 'parliament') {
    // Re-validate election is still active in voter's country timezone at confirm time
    const currentStatus = getCountryElectionStatus(schedule, voterCountry, voterCity, new Date());
    if (currentStatus.status !== 'active') {
      alert(currentStatus.message || 'Voting time has ended. Your vote cannot be submitted.');
      return;
    }
    const selectedId = type === 'assembly' ? selectedAssemblyId : selectedParliamentId;
    const pool = type === 'assembly' ? assemblyCandidates : parliamentCandidates;
    const selected = pool.find(c => c.id === selectedId);
    if (!selected) return;
    navigate('/user/vote-confirmation', {
      state: {
        selectedParty: selected,
        electionType: type,
        votingCountry: voterCountry,
        votingCity: voterCity,
      },
    });
  }

  const cards = [
    { label: 'Name', value: user.name, icon: User, bg: 'from-orange-50 to-white', border: 'border-orange-200', iconBg: 'bg-orange-500' },
    { label: 'Aadhaar Number', value: user.aadhaar, icon: CreditCard, bg: 'from-blue-50 to-white', border: 'border-blue-200', iconBg: 'bg-blue-600' },
    { label: 'Passport Number', value: user.passport || '—', icon: CreditCard, bg: 'from-green-50 to-white', border: 'border-green-200', iconBg: 'bg-green-600' },
    { label: 'Current Country', value: user.country, icon: Globe, bg: 'from-purple-50 to-white', border: 'border-purple-200', iconBg: 'bg-purple-600' },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Voter Info */}
        <div className="bg-white rounded-lg shadow-xl p-8 border-t-4 border-orange-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold text-blue-900">Voter Dashboard</h2>
              <p className="text-gray-500 text-sm mt-0.5">
                Welcome, <span className="font-semibold text-gray-800">{user.name}</span>
              </p>
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer self-start sm:self-auto text-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          {/* Live Regional Clock & Date (12-hour format with seconds based on voter's registered country) */}
          <RegionalClockCard
            country={voterCountry}
            city={voterCity}
            currentTime={now}
            showCountrySelect={false}
          />

          {/* Real-time Country Election Status Banner */}
          {globalStatus === 'active' && (
            <div className="mb-6 rounded-xl border-2 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-green-50 border-green-400">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 animate-pulse text-white">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-green-800 text-base">
                      Voting is LIVE in {countryElection.country}
                    </span>
                    <span className="px-2 py-0.5 bg-green-600 text-white text-[11px] font-black rounded uppercase">
                      Open
                    </span>
                  </div>
                  <p className="text-xs text-green-700 mt-0.5">
                    Polls open from {countryElection.fromTimeFormatted} to {countryElection.toTimeFormatted} local time ({countryElection.timeZoneLabel} · {countryElection.gmtOffset}).
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right flex-shrink-0 text-xs text-green-800 font-bold bg-white/80 px-3 py-1.5 rounded-lg border border-green-200">
                Local Time: {countryElection.localFormattedTime12}
              </div>
            </div>
          )}

          {globalStatus === 'not_started' && (
            <div className="mb-6 rounded-xl border-2 p-4 flex items-center gap-3 bg-blue-50 border-blue-300">
              <Clock className="w-6 h-6 text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-blue-800">
                  Voting Has Not Started Yet in {countryElection.country}
                </p>
                <p className="text-xs text-blue-600 mt-0.5">
                  {countryElection.message}
                </p>
              </div>
            </div>
          )}

          {globalStatus === 'ended' && (
            <div className="mb-6 rounded-xl border-2 p-4 flex items-center gap-3 bg-red-50 border-red-400">
              <CalendarX className="w-6 h-6 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-800">
                  Voting Time Has Ended in {countryElection.country}
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  {countryElection.message}
                </p>
              </div>
            </div>
          )}

          {/* Official Result Release Schedule Notice (Strictly India Time) */}
          {schedule?.resultDate && schedule?.resultTime && (
            <div className="mb-6 rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  🇮🇳
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-950 text-sm">
                      Official Election Result Declaration
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-200 text-indigo-900 rounded font-black uppercase text-[10px]">
                      IST Only
                    </span>
                  </div>
                  <p className="text-indigo-800 mt-0.5">
                    Scheduled on <strong>{new Date(schedule.resultDate + 'T00:00:00').toLocaleDateString('en-IN', {
                      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                    })}</strong> at <strong>{formatTime12(schedule.resultTime)}</strong> (India Standard Time - GMT+5:30).
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Results are published simultaneously across all nations strictly when India reaches this scheduled time.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold uppercase tracking-wider text-[10px] shrink-0 self-start sm:self-auto shadow-sm">
                India Clock Locked
              </span>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {cards.map(({ label, value, icon: Icon, bg, border, iconBg }) => (
              <div key={label} className={`bg-gradient-to-br ${bg} border-2 ${border} rounded-lg p-5`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{label}</p>
                    <p className="font-bold text-blue-900">{value}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="md:col-span-2 bg-gradient-to-br from-orange-50 to-white border-2 border-orange-200 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Indian Permanent Address</p>
                  <p className="font-bold text-blue-900">
                    {[user.indianAddress, user.indianPlace, user.indianPincode].filter(Boolean).join(', ') || '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm opacity-80">Assembly Constituency</p>
                  <p className="font-bold text-lg">{user.assemblyConstituency || '—'}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                  <Landmark className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm opacity-80">Parliament Constituency</p>
                  <p className="font-bold text-lg">{user.parliamentConstituency || '—'}</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-gradient-to-r from-gray-100 to-gray-50 border-2 border-gray-200 rounded-lg p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">State &nbsp;·&nbsp; District</p>
                  <p className="font-bold text-blue-900">{[user.indianState, user.indianDistrict].filter(Boolean).join(' — ') || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assembly Election */}
        <VoteSection
          title="Assembly Constituency Election"
          icon={Building2}
          accentColor="border-blue-600"
          constituencyName={user.assemblyConstituency || ''}
          candidates={assemblyCandidates}
          selectedId={selectedAssemblyId}
          onSelect={setSelectedAssemblyId}
          hasVoted={!!user.hasVotedAssembly}
          onConfirm={() => handleConfirm('assembly')}
          electionStatus={assemblyStatus}
          schedule={schedule}
          countryName={countryElection.country}
          timeZoneLabel={countryElection.timeZoneLabel}
          currentLocalTime={countryElection.localFormattedTime12}
        />

        {/* Parliament Election */}
        <VoteSection
          title="Parliament Constituency Election"
          icon={Landmark}
          accentColor="border-green-600"
          constituencyName={user.parliamentConstituency || ''}
          candidates={parliamentCandidates}
          selectedId={selectedParliamentId}
          onSelect={setSelectedParliamentId}
          hasVoted={!!user.hasVotedParliament}
          onConfirm={() => handleConfirm('parliament')}
          electionStatus={parliamentStatus}
          schedule={schedule}
          countryName={countryElection.country}
          timeZoneLabel={countryElection.timeZoneLabel}
          currentLocalTime={countryElection.localFormattedTime12}
        />

        {/* ── LOGOUT CONFIRMATION MODAL ── */}
        {showLogoutModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center border-t-4 border-red-600 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                <LogOut className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Logout</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to log out of the Voter Dashboard?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow transition-colors cursor-pointer"
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
