import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import {
  Vote, MapPin, CreditCard, Globe, Home, User, CheckCircle,
  Building2, Landmark, Clock, AlertTriangle, CalendarX, Lock,
} from 'lucide-react';
import { PARTY_SYMBOL_IMAGES } from '../data/partySymbolImages';
import { RegionalClockCard } from '../components/RegionalClockCard';

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
}

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
      return schedule.assemblyConstituency === user.assemblyConstituency;
    }
    // Admin scheduled only parliament, not assembly
    return !schedule.parliamentConstituency; // if neither set, allow all
  } else {
    if (schedule.parliamentConstituency) {
      return schedule.parliamentConstituency === (user.parliamentConstituency || user.constituency);
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
function ElectionGate({ status, fromTime, toTime, date }: {
  status: ElectionStatus;
  fromTime?: string;
  toTime?: string;
  date?: string;
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
        <h4 className="text-lg font-black text-blue-700 mb-2">Voting Has Not Started Yet</h4>
        {formattedDate && (
          <p className="text-blue-600 font-semibold text-sm mb-1">{formattedDate}</p>
        )}
        {fromTime && (
          <p className="text-gray-500 text-sm">
            Voting opens at <span className="font-bold text-blue-700">{formatTime(fromTime)}</span>
            {toTime && <> and closes at <span className="font-bold text-blue-700">{formatTime(toTime)}</span></>}
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
        <h4 className="text-lg font-black text-red-600 mb-2">Voting Time Has Ended</h4>
        {toTime && (
          <p className="text-gray-500 text-sm">
            Voting closed at <span className="font-bold text-red-600">{formatTime(toTime)}</span>.
          </p>
        )}
        <p className="text-gray-400 text-sm mt-1">No more votes can be cast for this election.</p>
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
  electionStatus, schedule,
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
              Voting Open · Closes {formatTime(schedule.toTime)}
            </span>
          </div>
        )}
        {electionStatus === 'ended' && (
          <div className="flex items-center gap-1.5 bg-red-100 border border-red-300 rounded-full px-3 py-1">
            <CalendarX className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs font-bold text-red-600">Voting Closed</span>
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
          /* Election gate — blocks voting when not active */
          <ElectionGate
            status={electionStatus}
            fromTime={schedule?.fromTime}
            toTime={schedule?.toTime}
            date={schedule?.date}
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
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<number | null>(null);
  const [selectedParliamentId, setSelectedParliamentId] = useState<number | null>(null);
  const [assemblyCandidates, setAssemblyCandidates] = useState<Candidate[]>([]);
  const [parliamentCandidates, setParliamentCandidates] = useState<Candidate[]>([]);

  const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const schedule: ElectionSchedule | null = JSON.parse(localStorage.getItem('electionSchedule') || 'null');

  // Live ticking clock (1-second precision) for regional time and election gate reactions
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!user) return;
    const stored: Candidate[] = JSON.parse(localStorage.getItem('registeredCandidates') || '[]');
    const resolved = stored.map(c => ({
      ...c,
      partySymbolImage: PARTY_SYMBOL_IMAGES[c.partyName] ?? c.partySymbolImage ?? '',
    }));
    setAssemblyCandidates(
      resolved.filter(c => c.electionType === 'assembly' && c.constituency?.trim().toUpperCase() === user.assemblyConstituency?.trim().toUpperCase())
    );
    setParliamentCandidates(
      resolved.filter(c => c.electionType === 'parliament' && c.constituency?.trim().toUpperCase() === (user.parliamentConstituency || user.constituency)?.trim().toUpperCase())
    );
  }, []);

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

  // Derive per-section election status
  const globalStatus = getElectionStatus(schedule, now);
  const assemblyStatus: ElectionStatus =
    globalStatus !== 'active' ? globalStatus
    : isElectionInScopeForUser(schedule, user, 'assembly') ? 'active' : 'not_in_scope';
  const parliamentStatus: ElectionStatus =
    globalStatus !== 'active' ? globalStatus
    : isElectionInScopeForUser(schedule, user, 'parliament') ? 'active' : 'not_in_scope';

  function handleConfirm(type: 'assembly' | 'parliament') {
    // Re-validate election is still active at confirm time
    const currentStatus = getElectionStatus(schedule, new Date());
    if (currentStatus !== 'active') {
      alert('Voting time has ended. Your vote cannot be submitted.');
      return;
    }
    const selectedId = type === 'assembly' ? selectedAssemblyId : selectedParliamentId;
    const pool = type === 'assembly' ? assemblyCandidates : parliamentCandidates;
    const selected = pool.find(c => c.id === selectedId);
    if (!selected) return;
    navigate('/user/vote-confirmation', { state: { selectedParty: selected, electionType: type } });
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
          <h2 className="text-3xl font-bold text-blue-900 mb-6 text-center">Voter Dashboard</h2>

          {/* Live Regional Clock & Date (12-hour format with seconds based on voter's country/region) */}
          <RegionalClockCard country={user.country} city={user.currentPlace} currentTime={now} />

          {/* Election status banner */}
          {globalStatus !== 'active' && globalStatus !== 'no_election' && (
            <div className={`mb-6 rounded-xl border-2 p-4 flex items-center gap-3 ${
              globalStatus === 'ended' ? 'bg-red-50 border-red-400' : 'bg-blue-50 border-blue-300'
            }`}>
              {globalStatus === 'ended'
                ? <CalendarX className="w-5 h-5 text-red-500 flex-shrink-0" />
                : <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />}
              <p className={`text-sm font-semibold ${globalStatus === 'ended' ? 'text-red-700' : 'text-blue-700'}`}>
                {globalStatus === 'ended'
                  ? `Voting has ended. Polls closed at ${formatTime(schedule?.toTime || '')}.`
                  : `Election scheduled — voting opens at ${formatTime(schedule?.fromTime || '')} on ${schedule?.date ? new Date(schedule.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}.`}
              </p>
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
        />

      </div>
    </Layout>
  );
}
