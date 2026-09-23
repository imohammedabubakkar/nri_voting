import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { ArrowLeft, TrendingUp, MapPin, Trophy, UserX, Building2, Landmark, Filter } from 'lucide-react';
import { DISTRICTS_BY_STATE } from '../data/indiaData';
import { PARTY_SYMBOL_IMAGES } from '../data/partySymbolImages';

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

  // Sort candidates by vote count descending
  const sorted = [...candidates].sort(
    (a, b) => (constitVotes[String(b.id)] || 0) - (constitVotes[String(a.id)] || 0)
  );
  const winner = sorted[0];
  const winnerVotes = winner ? (constitVotes[String(winner.id)] || 0) : 0;
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

        {candidates.length === 0 ? (
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
                <span className="text-xs text-gray-400">{candidates.length} candidate{candidates.length !== 1 ? 's' : ''}</span>
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

            {/* ── WINNING PARTY BANNER ── shown at bottom when votes exist */}
            {hasVotes && winnerVotes > 0 ? (
              <div className="rounded-2xl p-[3px] bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400 shadow-xl">
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-7">
                  {/* Title */}
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <Trophy className="w-7 h-7 text-yellow-600" />
                    <h4 className="text-xl font-black text-yellow-800 uppercase tracking-widest">
                      Winner — Majority Party
                    </h4>
                    <Trophy className="w-7 h-7 text-yellow-600" />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Large party symbol */}
                    <div className="w-32 h-32 flex-shrink-0 bg-white border-4 border-yellow-400 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg">
                      {PARTY_SYMBOL_IMAGES[winner.partyName] || winner.partySymbolImage ? (
                        <img
                          src={PARTY_SYMBOL_IMAGES[winner.partyName] || winner.partySymbolImage}
                          alt={winner.partyName}
                          className="w-28 h-28 object-contain"
                        />
                      ) : (
                        <span className="text-7xl">{winner.partySymbol}</span>
                      )}
                    </div>

                    {/* Party details */}
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-3xl font-black text-yellow-900 mb-1">
                        {winner.partyAbbr || winner.partyName}
                      </p>
                      <p className="text-base text-yellow-800 font-semibold mb-1">{winner.partyName}</p>
                      <p className="text-sm text-gray-600 mb-4">
                        Candidate:{' '}
                        <span className="font-bold text-blue-900">{winner.name}</span>
                      </p>

                      {/* Vote numbers */}
                      <div className="flex items-center justify-center sm:justify-start gap-6">
                        <div className="text-center">
                          <p className="text-4xl font-black text-yellow-600">{winnerVotes}</p>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Votes Won</p>
                        </div>
                        <div className="w-px h-12 bg-yellow-300" />
                        <div className="text-center">
                          <p className="text-4xl font-black text-orange-500">
                            {((winnerVotes / pctBase) * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">of Registered</p>
                        </div>
                        <div className="w-px h-12 bg-yellow-300" />
                        <div className="text-center">
                          <p className="text-4xl font-black text-green-600">{registered}</p>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Registered</p>
                        </div>
                      </div>
                    </div>

                    {/* Badge */}
                    <div className="flex-shrink-0">
                      <div className="bg-yellow-500 text-white font-black px-5 py-3 rounded-2xl text-sm uppercase tracking-widest shadow-lg text-center">
                        <Trophy className="w-8 h-8 mx-auto mb-1" />
                        Elected
                        <br />
                        Winner
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-yellow-300 rounded-xl py-8 text-center text-yellow-600 bg-yellow-50">
                <Trophy className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="font-semibold text-sm">Winning party will appear here once votes are cast</p>
              </div>
            )}
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

  const allUsers: RegisteredUser[] = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
  const allCandidates: Candidate[] = JSON.parse(localStorage.getItem('registeredCandidates') || '[]');
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
        </div>
      </div>
    </Layout>
  );
}
