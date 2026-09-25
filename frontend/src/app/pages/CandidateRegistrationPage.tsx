import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { ArrowLeft, UserPlus, Pencil, Trash2, UserCheck, X } from 'lucide-react';
import { DISTRICTS_BY_STATE } from '../data/indiaData';
import { PARTIES, Party } from '../data/partiesData';
import { PARTY_SYMBOL_IMAGES } from '../data/partySymbolImages';

type ElectionType = 'assembly' | 'parliament' | '';

export interface Candidate {
  id: number;
  electionType: ElectionType;
  state: string;
  district: string;
  constituency: string;
  name: string;
  dob: string;
  age: string;
  partyName: string;
  partySymbol: string;
  partyAbbr: string;
  partySymbolImage?: string;
}

const ALL_STATES = Object.keys(DISTRICTS_BY_STATE).sort();

function calcAge(dob: string): string {
  if (!dob) return '';
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? String(age) : '';
}

function formatDobToDDMMYYYY(dob?: string): string {
  if (!dob || !dob.trim()) return '—';
  const clean = dob.trim();
  if (/^\d{2}-\d{2}-\d{4}$/.test(clean)) return clean;
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [year, month, day] = clean.split('-');
    return `${day}-${month}-${year}`;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    const [day, month, year] = clean.split('/');
    return `${day}-${month}-${year}`;
  }
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}-${month}-${year}`;
  }
  return clean;
}

const BLANK_FORM = {
  electionType: '' as ElectionType,
  state: '',
  district: '',
  constituency: '',
  name: '',
  dob: '',
  age: '',
  partyName: '',
  partySymbol: '',
  partyAbbr: '',
  partySymbolImage: '',
};

const inputCls = 'w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none bg-white text-gray-800';
const selectCls = inputCls;
const labelCls = 'block text-sm font-semibold text-gray-700 mb-1';

export function CandidateRegistrationPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...BLANK_FORM });
  const [showForm, setShowForm] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [filterState, setFilterState] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterElectionType, setFilterElectionType] = useState<ElectionType>('');
  const [filterConstituency, setFilterConstituency] = useState('');

  useEffect(() => {
    const stored: Candidate[] = JSON.parse(localStorage.getItem('registeredCandidates') || '[]');
    // Re-resolve symbolImage from live Vite imports — localStorage URLs go stale after rebuilds
    setCandidates(stored.map(c => ({
      ...c,
      partySymbolImage: PARTY_SYMBOL_IMAGES[c.partyName] ?? c.partySymbolImage ?? '',
    })));
  }, []);

  // Derive constituency options from registered voters
  const allUsers: { assemblyConstituency?: string; parliamentConstituency?: string; constituency?: string; indianState?: string; indianDistrict?: string }[] =
    JSON.parse(localStorage.getItem('registeredUsers') || '[]');

  const assemblyOptions = Array.from(
    new Set(
      allUsers
        .filter(u => (!form.state || u.indianState === form.state) && (!form.district || u.indianDistrict === form.district))
        .map(u => u.assemblyConstituency)
        .filter(Boolean)
    )
  ) as string[];

  const parliamentOptions = Array.from(
    new Set(
      allUsers
        .filter(u => (!form.state || u.indianState === form.state) && (!form.district || u.indianDistrict === form.district))
        .map(u => u.parliamentConstituency || u.constituency)
        .filter(Boolean)
    )
  ) as string[];

  const districtOptions = form.state ? (DISTRICTS_BY_STATE[form.state] || []) : [];

  const constituencyOptions = form.electionType === 'assembly' ? assemblyOptions : form.electionType === 'parliament' ? parliamentOptions : [];

  // Parties already assigned to candidates in the same constituency (exclude from dropdown for new entries)
  const usedPartyNames = new Set(
    candidates
      .filter(c =>
        c.electionType === form.electionType &&
        c.state === form.state &&
        c.district === form.district &&
        c.constituency === form.constituency &&
        (editId === null || c.id !== editId) // allow own party when editing
      )
      .map(c => c.partyName)
  );

  const availableParties = PARTIES.filter(p => !usedPartyNames.has(p.name));

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleElectionTypeChange(val: ElectionType) {
    setForm(prev => ({ ...prev, electionType: val, state: '', district: '', constituency: '' }));
  }

  function handleStateChange(val: string) {
    setForm(prev => ({ ...prev, state: val, district: '', constituency: '' }));
  }

  function handleDistrictChange(val: string) {
    setForm(prev => ({ ...prev, district: val, constituency: '' }));
  }

  function handleDobChange(val: string) {
    setForm(prev => ({ ...prev, dob: val, age: calcAge(val) }));
  }

  function handlePartyChange(val: string) {
    const party: Party | undefined = PARTIES.find(p => p.name === val);
    setForm(prev => ({
      ...prev,
      partyName: val,
      partySymbol: party?.symbol || '',
      partyAbbr: party?.abbr || '',
      // Always resolve from live import so the URL never goes stale
      partySymbolImage: (val && PARTY_SYMBOL_IMAGES[val]) || party?.symbolImage || '',
    }));
  }

  function saveToStorage(list: Candidate[]) {
    localStorage.setItem('registeredCandidates', JSON.stringify(list));
    setCandidates(list);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.electionType) return setError('Please select election type.');
    if (!form.state) return setError('Please select state.');
    if (!form.district) return setError('Please select district.');
    if (!form.constituency) return setError('Please enter/select constituency name.');
    if (!form.name.trim()) return setError('Please enter candidate name.');
    if (!form.partyName) return setError('Please select a party.');

    if (editId !== null) {
      const updated = candidates.map(c =>
        c.id === editId ? { ...form, id: editId, partySymbolImage: form.partySymbolImage } as Candidate : c
      );
      saveToStorage(updated);
      setSelectedCandidateId(editId);
      setSuccess('Candidate updated successfully!');
    } else {
      const newId = Date.now();
      const newCandidate: Candidate = { ...form, id: newId } as Candidate;
      const updated = [...candidates, newCandidate];
      saveToStorage(updated);
      setSelectedCandidateId(newId);
      setSuccess('Candidate registered successfully!');
    }

    setForm({ ...BLANK_FORM });
    setEditId(null);
    setShowForm(false);
    setTimeout(() => setSuccess(''), 3000);
  }

  function handleEdit(c: Candidate) {
    setForm({
      electionType: c.electionType,
      state: c.state,
      district: c.district,
      constituency: c.constituency,
      name: c.name,
      dob: c.dob,
      age: c.age,
      partyName: c.partyName,
      partySymbol: c.partySymbol,
      partyAbbr: c.partyAbbr,
      partySymbolImage: c.partySymbolImage || '',
    });
    setEditId(c.id);
    setShowForm(true);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDelete(id: number) {
    const updated = candidates.filter(c => c.id !== id);
    saveToStorage(updated);
    if (selectedCandidateId === id) {
      setSelectedCandidateId('');
    }
    setDeleteId(null);
    setSuccess('Candidate deleted.');
    setTimeout(() => setSuccess(''), 2500);
  }

  function handleCancel() {
    setForm({ ...BLANK_FORM });
    setEditId(null);
    setShowForm(false);
    setError('');
  }

  const electionLabel = (t: ElectionType) =>
    t === 'assembly' ? 'Assembly Constituency' : t === 'parliament' ? 'Parliament Constituency' : '—';

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

        <div className="bg-white rounded-xl shadow-xl border-t-4 border-orange-500 overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-orange-500 to-green-600 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-white tracking-wide">Election Candidate Registration</h2>
              <p className="text-orange-100 text-sm mt-1">Register candidates for Assembly or Parliament elections</p>
            </div>
            <UserPlus className="w-10 h-10 text-white opacity-80" />
          </div>

          <div className="p-8">
            {success && (
              <div className="mb-4 p-3 bg-green-50 border-2 border-green-500 rounded-lg text-green-800 font-semibold text-sm">
                ✓ {success}
              </div>
            )}

            {/* Step 1 – Election Type + Location Selectors */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 mb-6">
              <h3 className="text-base font-bold text-blue-900 mb-4 uppercase tracking-wider">
                Step 1 — Select Election &amp; Location
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Election Type */}
                <div>
                  <label className={labelCls}>Election Type <span className="text-red-500">*</span></label>
                  <select
                    value={form.electionType}
                    onChange={e => handleElectionTypeChange(e.target.value as ElectionType)}
                    className={selectCls}
                  >
                    <option value="">-- Select Type --</option>
                    <option value="assembly">Assembly Constituency</option>
                    <option value="parliament">Parliament Constituency</option>
                  </select>
                </div>

                {/* State */}
                <div>
                  <label className={labelCls}>State / UT <span className="text-red-500">*</span></label>
                  <select
                    value={form.state}
                    onChange={e => handleStateChange(e.target.value)}
                    className={selectCls}
                    disabled={!form.electionType}
                  >
                    <option value="">{form.electionType ? '-- Select State --' : 'Select election type first'}</option>
                    {ALL_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* District */}
                <div>
                  <label className={labelCls}>District <span className="text-red-500">*</span></label>
                  <select
                    value={form.district}
                    onChange={e => handleDistrictChange(e.target.value)}
                    className={selectCls}
                    disabled={!form.state}
                  >
                    <option value="">{form.state ? '-- Select District --' : 'Select state first'}</option>
                    {districtOptions.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {/* Constituency */}
                <div>
                  <label className={labelCls}>
                    {form.electionType === 'assembly' ? 'Assembly Constituency' : form.electionType === 'parliament' ? 'Parliament Constituency' : 'Constituency'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.constituency}
                    onChange={e => set('constituency', e.target.value)}
                    className={inputCls}
                    placeholder={form.district ? 'Enter constituency name' : 'Select district first'}
                    disabled={!form.district}
                  />
                </div>
              </div>

              {/* Add Candidate Button */}
              {!showForm && (
                <button
                  onClick={() => { setShowForm(true); setEditId(null); setError(''); setForm({ ...BLANK_FORM, electionType: form.electionType, state: form.state, district: form.district, constituency: form.constituency }); }}
                  disabled={!form.constituency}
                  className="mt-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Candidate
                </button>
              )}
            </div>

            {/* Step 2 – Candidate Form */}
            {showForm && (
              <form onSubmit={handleSubmit}>
                <div className="bg-blue-50 rounded-xl border-2 border-blue-200 p-6 mb-6">
                  <h3 className="text-base font-bold text-blue-900 mb-4 uppercase tracking-wider">
                    Step 2 — {editId !== null ? 'Edit' : 'Add'} Candidate Details
                  </h3>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border-2 border-red-400 rounded-lg text-red-700 text-sm font-semibold">
                      {error}
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-5">
                    {/* Candidate Name */}
                    <div>
                      <label className={labelCls}>Candidate Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => set('name', e.target.value)}
                        className={inputCls}
                        placeholder="Full name of candidate"
                      />
                    </div>

                    {/* DOB */}
                    <div>
                      <label className={labelCls}>Date of Birth <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        value={form.dob}
                        onChange={e => handleDobChange(e.target.value)}
                        className={inputCls}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    {/* Age (auto-calculated) */}
                    <div>
                      <label className={labelCls}>Age (Auto-calculated)</label>
                      <input
                        type="text"
                        value={form.age}
                        readOnly
                        className={`${inputCls} bg-gray-100 text-gray-500 cursor-not-allowed`}
                        placeholder="Calculated from DOB"
                      />
                    </div>

                    {/* Party Dropdown */}
                    <div>
                      <label className={labelCls}>Party Name <span className="text-red-500">*</span></label>
                      <select
                        value={form.partyName}
                        onChange={e => handlePartyChange(e.target.value)}
                        className={selectCls}
                      >
                        <option value="">-- Select Party --</option>
                        {availableParties.map(p => (
                          <option key={p.name} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Party Symbol (auto-shown) */}
                    {form.partyName && (
                      <div className="md:col-span-2">
                        <label className={labelCls}>Party Symbol</label>
                        <div className="flex items-center gap-4 p-4 bg-white border-2 border-green-400 rounded-xl">
                          {form.partySymbolImage ? (
                            <img
                              src={form.partySymbolImage}
                              alt={form.partyName}
                              className="w-16 h-16 object-contain flex-shrink-0"
                            />
                          ) : (
                            <span className="text-5xl flex-shrink-0">{form.partySymbol}</span>
                          )}
                          <div>
                            <p className="font-bold text-blue-900 text-lg">{form.partyName}</p>
                            {form.partyAbbr && (
                              <p className="text-sm text-gray-500 font-semibold">Abbreviation: {form.partyAbbr}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="submit"
                      className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow"
                    >
                      {editId !== null ? 'Update Candidate' : 'Register Candidate'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-8 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Registered Candidates List */}
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-green-600 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-white">Registered Candidates</h3>
                  <span className="bg-white text-orange-600 font-bold text-sm px-3 py-0.5 rounded-full">
                    {candidates.length} Total
                  </span>
                </div>
              </div>

              {candidates.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="font-semibold">No candidates registered yet.</p>
                  <p className="text-sm mt-1">Use the form above to add the first candidate.</p>
                </div>
              ) : (() => {
                // Derive filter dropdown options from actual candidate data
                const fStates = Array.from(new Set(candidates.map(c => c.state).filter(Boolean))).sort();
                const fDistricts = Array.from(new Set(
                  candidates.filter(c => !filterState || c.state === filterState).map(c => c.district).filter(Boolean)
                )).sort();
                const fConstituencies = Array.from(new Set(
                  candidates.filter(c =>
                    (!filterState || c.state === filterState) &&
                    (!filterDistrict || c.district === filterDistrict) &&
                    (!filterElectionType || c.electionType === filterElectionType)
                  ).map(c => c.constituency).filter(Boolean)
                )).sort();

                const filtered = candidates.filter(c =>
                  (!filterState || c.state === filterState) &&
                  (!filterDistrict || c.district === filterDistrict) &&
                  (!filterElectionType || c.electionType === filterElectionType) &&
                  (!filterConstituency || c.constituency === filterConstituency)
                );

                const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);

                return (
                  <>
                    {/* Filter and Selection Section */}
                    <div className="p-6 bg-gray-50 border-b border-gray-200 space-y-4">
                      {/* Regional Filters */}
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                          Filter by Region (Optional)
                        </p>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {/* State */}
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">State / UT</label>
                            <select
                              value={filterState}
                              onChange={e => {
                                setFilterState(e.target.value);
                                setFilterDistrict('');
                                setFilterConstituency('');
                              }}
                              className={selectCls}
                            >
                              <option value="">All States</option>
                              {fStates.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>

                          {/* District */}
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">District</label>
                            <select
                              value={filterDistrict}
                              onChange={e => {
                                setFilterDistrict(e.target.value);
                                setFilterConstituency('');
                              }}
                              className={selectCls}
                              disabled={!filterState}
                            >
                              <option value="">All Districts</option>
                              {fDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>

                          {/* Constituency Type */}
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Constituency Type</label>
                            <select
                              value={filterElectionType}
                              onChange={e => {
                                setFilterElectionType(e.target.value as ElectionType);
                                setFilterConstituency('');
                              }}
                              className={selectCls}
                            >
                              <option value="">All Types</option>
                              <option value="assembly">Assembly Constituency</option>
                              <option value="parliament">Parliament Constituency</option>
                            </select>
                          </div>

                          {/* Constituency Name */}
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                              {filterElectionType === 'assembly' ? 'Assembly Constituency' : filterElectionType === 'parliament' ? 'Parliament Constituency' : 'Constituency Name'}
                            </label>
                            <select
                              value={filterConstituency}
                              onChange={e => setFilterConstituency(e.target.value)}
                              className={selectCls}
                              disabled={fConstituencies.length === 0}
                            >
                              <option value="">All Constituencies</option>
                              {fConstituencies.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* ── SELECT CANDIDATE DROPDOWN ── */}
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                          <label className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                            <UserCheck className="w-4 h-4 text-orange-600" />
                            Select Candidate <span className="text-orange-600 font-bold">({filtered.length} available)</span>
                          </label>
                          {selectedCandidateId !== '' && (
                            <button
                              type="button"
                              onClick={() => setSelectedCandidateId('')}
                              className="text-xs text-orange-600 hover:text-orange-800 font-semibold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              Clear Selection
                            </button>
                          )}
                        </div>
                        <select
                          value={selectedCandidateId}
                          onChange={e => setSelectedCandidateId(e.target.value ? Number(e.target.value) : '')}
                          className="w-full px-4 py-2.5 text-sm font-semibold border-2 border-orange-400 focus:border-orange-600 rounded-lg outline-none bg-white text-gray-800 shadow-sm transition-all cursor-pointer"
                        >
                          <option value="">-- Choose Candidate to View Details --</option>
                          {filtered.map((c, idx) => (
                            <option key={c.id} value={c.id}>
                              #{idx + 1} — {c.name} ({c.partyName} · {c.constituency})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Candidate Details Section */}
                    {!selectedCandidate ? (
                      <div className="py-14 px-6 text-center bg-white">
                        <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <UserCheck className="w-7 h-7 text-orange-600" />
                        </div>
                        <h4 className="text-base font-bold text-gray-800">Candidate Details Hidden</h4>
                        <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                          Please choose a candidate from the <strong className="text-orange-600">"Select Candidate"</strong> dropdown above to view their details.
                        </p>
                      </div>
                    ) : (
                      <div className="p-6 bg-white border-t border-orange-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-orange-50 border-2 border-orange-200 rounded-2xl flex items-center justify-center p-2 flex-shrink-0">
                              {selectedCandidate.partySymbolImage ? (
                                <img
                                  src={selectedCandidate.partySymbolImage}
                                  alt={selectedCandidate.partyName}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <span className="text-3xl">{selectedCandidate.partySymbol}</span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xl font-black text-blue-900">{selectedCandidate.name}</h4>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-800">
                                  {electionLabel(selectedCandidate.electionType)}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-gray-600 mt-0.5">
                                {selectedCandidate.partyName} {selectedCandidate.partyAbbr ? `(${selectedCandidate.partyAbbr})` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(selectedCandidate)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                              Edit Candidate
                            </button>
                            <button
                              onClick={() => setDeleteId(selectedCandidate.id)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </div>

                        {/* Candidate Details Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 pt-5 pb-6 border-b border-gray-100">
                          <Detail label="Candidate Name" value={selectedCandidate.name} />
                          <Detail label="Election Type" value={electionLabel(selectedCandidate.electionType)} />
                          <Detail label="State / UT" value={selectedCandidate.state} />
                          <Detail label="District" value={selectedCandidate.district} />
                          <Detail label="Constituency" value={selectedCandidate.constituency} />
                          <Detail label="Date of Birth" value={formatDobToDDMMYYYY(selectedCandidate.dob)} />
                          <Detail label="Age" value={selectedCandidate.age ? `${selectedCandidate.age} years` : '—'} />
                        </div>

                        {/* Centered Party & Symbol Section */}
                        <div className="pt-6 flex flex-col items-center justify-center text-center">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Party & Symbol</p>
                          <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border-2 border-orange-200/80 w-full max-w-md shadow-sm">
                            <div className="w-28 h-28 sm:w-32 sm:h-32 bg-white border-2 border-orange-300 rounded-2xl flex items-center justify-center p-3 mb-3 shadow-md">
                              {selectedCandidate.partySymbolImage ? (
                                <img
                                  src={selectedCandidate.partySymbolImage}
                                  alt={selectedCandidate.partyName}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <span className="text-7xl">{selectedCandidate.partySymbol}</span>
                              )}
                            </div>
                            <span className="text-xs font-extrabold uppercase tracking-wider text-orange-600 block mb-1">
                              Official Election Symbol
                            </span>
                            <h5 className="font-black text-blue-900 text-lg sm:text-xl leading-tight">
                              {selectedCandidate.partyName}
                            </h5>
                            {selectedCandidate.partyAbbr && (
                              <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                                {selectedCandidate.partyAbbr}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-7 max-w-sm w-full text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Candidate?</h3>
            <p className="text-gray-600 mb-6 text-sm">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function Detail({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value || '—'}</p>
    </div>
  );
}
