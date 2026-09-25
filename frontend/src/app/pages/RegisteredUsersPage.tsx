import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { Search, ArrowLeft, Pencil, Trash2, X, Save, UserCheck } from 'lucide-react';
import { COUNTRIES, CITIES_BY_COUNTRY, PINCODE_FORMAT } from './CreateUserPage';
import { DISTRICTS_BY_STATE } from '../data/indiaData';

interface User {
  id: number;
  name: string;
  dob?: string;
  age?: string;
  aadhaar: string;
  voterId?: string;
  passport?: string;
  country: string;
  currentPlace?: string;
  currentAddress?: string;
  currentPincode?: string;
  indianAddress?: string;
  indianState?: string;
  indianDistrict?: string;
  indianPlace?: string;
  assemblyConstituency?: string;
  parliamentConstituency?: string;
  indianPincode?: string;
  constituency: string;
}

function formatDobToDDMMYYYY(dob?: string): string {
  if (!dob || !dob.trim()) return '—';
  const clean = dob.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) return clean;
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [year, month, day] = clean.split('-');
    return `${day}/${month}/${year}`;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(clean)) {
    const [day, month, year] = clean.split('-');
    return `${day}/${month}/${year}`;
  }
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return clean;
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-blue-900">{value || '—'}</p>
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-3 mt-4 first:mt-0 border-b border-orange-100 pb-1">
      {title}
    </p>
  );
}

function UserProfileCard({
  user,
  openEdit,
  setDeleteConfirmId,
}: {
  user: User;
  openEdit: (u: User) => void;
  setDeleteConfirmId: (id: number) => void;
}) {
  return (
    <div className="border-2 border-blue-200 rounded-xl overflow-hidden shadow-sm bg-white">
      <div className="px-6 py-4 bg-gradient-to-r from-blue-900 to-blue-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-white/20 text-white font-black text-lg flex items-center justify-center flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {user.name}
            </h3>
            <p className="text-xs text-blue-200">
              {user.country} &nbsp;•&nbsp; {user.assemblyConstituency || user.constituency}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEdit(user)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-blue-900 font-bold text-sm rounded-lg hover:bg-blue-50 transition-colors shadow-sm cursor-pointer"
          >
            <Pencil className="w-4 h-4" />
            Edit User
          </button>
          <button
            onClick={() => setDeleteConfirmId(user.id)}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white font-bold text-sm rounded-lg hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <SectionHeading title="Personal Information" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Full Name" value={user.name} />
            <Field label="Date of Birth" value={formatDobToDDMMYYYY(user.dob)} />
            <Field label="Age" value={user.age ? `${user.age} years` : '—'} />
          </div>
        </div>

        <div>
          <SectionHeading title="Identity Information" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Aadhaar Number" value={user.aadhaar} />
            <Field label="Voter ID" value={user.voterId} />
            <Field label="Passport Number" value={user.passport} />
          </div>
        </div>

        <div>
          <SectionHeading title="Current Residence (Abroad)" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Country" value={user.country} />
            <Field label="Current Place" value={user.currentPlace} />
            <Field label="Current Pincode" value={user.currentPincode} />
            <div className="col-span-2 md:col-span-3">
              <Field label="Current Address" value={user.currentAddress} />
            </div>
          </div>
        </div>

        <div>
          <SectionHeading title="Indian Permanent Address" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="col-span-2 md:col-span-3">
              <Field label="Address" value={user.indianAddress} />
            </div>
            <Field label="State" value={user.indianState} />
            <Field label="District" value={user.indianDistrict} />
            <Field label="Place / City / Town" value={user.indianPlace} />
            <Field label="Assembly Constituency" value={user.assemblyConstituency} />
            <Field label="Parliament Constituency" value={user.parliamentConstituency} />
            <Field label="Pincode" value={user.indianPincode} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function RegisteredUsersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>(JSON.parse(localStorage.getItem('registeredUsers') || '[]'));
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<User | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.aadhaar.includes(searchTerm) ||
    user.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({ ...user });
  };

  const closeEdit = () => {
    setEditingUser(null);
    setEditForm(null);
  };

  const setField = (field: keyof User) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let value = e.target.value;
    if (field === 'voterId') {
      value = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    }
    if (field === 'passport') {
      value = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    }
    if (
      field === 'currentAddress' ||
      field === 'indianAddress' ||
      field === 'indianPlace' ||
      field === 'assemblyConstituency' ||
      field === 'parliamentConstituency'
    ) {
      value = value.toUpperCase();
    }
    setEditForm(prev => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };
      if (field === 'country') {
        updated.currentPlace = '';
        updated.currentPincode = '';
      }
      if (field === 'indianState') {
        updated.indianDistrict = '';
      }
      return updated;
    });
  };

  const countryOptions = editForm?.country && !COUNTRIES.includes(editForm.country)
    ? [editForm.country, ...COUNTRIES]
    : COUNTRIES;
  const baseCities = editForm?.country ? (CITIES_BY_COUNTRY[editForm.country] || []) : [];
  const citiesForCountry = editForm?.currentPlace && !baseCities.includes(editForm.currentPlace)
    ? [editForm.currentPlace, ...baseCities]
    : baseCities;
  const editPincodePlaceholder = editForm?.country ? (PINCODE_FORMAT[editForm.country] || 'Postal / ZIP code') : 'Postal / ZIP code';

  const INDIAN_STATES = Object.keys(DISTRICTS_BY_STATE);
  const stateOptions = editForm?.indianState && !INDIAN_STATES.includes(editForm.indianState)
    ? [editForm.indianState, ...INDIAN_STATES]
    : INDIAN_STATES;
  const baseDistricts = editForm?.indianState ? (DISTRICTS_BY_STATE[editForm.indianState] || []) : [];
  const districtsForState = editForm?.indianDistrict && !baseDistricts.includes(editForm.indianDistrict)
    ? [editForm.indianDistrict, ...baseDistricts]
    : baseDistricts;

  const deleteUser = (id: number) => {
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    localStorage.setItem('registeredUsers', JSON.stringify(updated));
    setDeleteConfirmId(null);
    if (selectedUserId === id) setSelectedUserId('');
  };

  const saveEdit = () => {
    if (!editForm) return;
    const VOTER_ID_REGEX = /^[A-Z]{3}[0-9]{7}$/;
    if (editForm.voterId && !VOTER_ID_REGEX.test(editForm.voterId.trim())) {
      alert('Voter ID must be 3 capital letters followed by 7 numbers (e.g. ABC1234567).');
      return;
    }
    const PASSPORT_REGEX = /^([A-Z]{2}[0-9]{6}|[A-Z][0-9]{7})$/;
    if (editForm.passport && !PASSPORT_REGEX.test(editForm.passport.trim())) {
      alert('Passport number must be 2 capital letters followed by 6 numbers (e.g. AB123456) or 1 capital letter followed by 7 numbers (e.g. A1234567).');
      return;
    }
    const updated = users.map(u => u.id === editForm.id ? editForm : u);
    setUsers(updated);
    localStorage.setItem('registeredUsers', JSON.stringify(updated));
    const current = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (current && current.id === editForm.id) {
      localStorage.setItem('currentUser', JSON.stringify(editForm));
    }
    closeEdit();
  };

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

        <div className="bg-white rounded-lg shadow-xl p-8 border-t-4 border-blue-600">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-blue-900 mb-2">Registered Users</h2>
            <p className="text-gray-600">{users.length} registered voter{users.length !== 1 ? 's' : ''}</p>
          </div>

          {/* Search bar & Dropdown Selector */}
          <div className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-200">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (e.target.value) {
                    setSelectedUserId('');
                  }
                }}
                className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none bg-white text-sm"
                placeholder="Search registered voter by name, Aadhaar, or country..."
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Select User Dropdown */}
            <div className="pt-3 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                <label className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  Select User to View Details <span className="text-blue-600 font-bold">({users.length} registered)</span>
                </label>
                {selectedUserId !== '' && (
                  <button
                    type="button"
                    onClick={() => setSelectedUserId('')}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    Clear Selection
                  </button>
                )}
              </div>
              <select
                value={selectedUserId}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : '';
                  setSelectedUserId(val);
                  if (val !== '') {
                    setSearchTerm('');
                  }
                }}
                className="w-full px-4 py-2.5 text-sm font-semibold border-2 border-blue-400 focus:border-blue-600 rounded-lg outline-none bg-white text-gray-800 shadow-sm transition-all cursor-pointer"
              >
                <option value="">-- Choose User to View Details --</option>
                {users.map((u, idx) => (
                  <option key={u.id} value={u.id}>
                    #{idx + 1} — {u.name} ({u.country} · {u.assemblyConstituency || u.constituency})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* User Details Section */}
          {(() => {
            if (users.length === 0) {
              return (
                <div className="py-16 text-center text-gray-500">
                  No users registered yet. Use Create User to add voters.
                </div>
              );
            }

            const isSearching = searchTerm.trim().length > 0;
            const selectedUser = users.find(u => u.id === selectedUserId);

            // 1. Searching by Name, Aadhaar, or Country - Immediately display matching voters
            if (isSearching) {
              if (filteredUsers.length === 0) {
                return (
                  <div className="py-16 px-6 text-center bg-gray-50 rounded-xl border border-gray-200 mt-6">
                    <Search className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <h4 className="text-base font-bold text-gray-800">No voters found</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      No registered voter matched <strong className="text-gray-800">"{searchTerm}"</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Clear Search
                    </button>
                  </div>
                );
              }

              return (
                <div className="mt-6 space-y-6">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-sm font-semibold text-gray-700">
                      Showing {filteredUsers.length} voter{filteredUsers.length === 1 ? '' : 's'} matching "{searchTerm}"
                    </span>
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Clear Search
                    </button>
                  </div>
                  {filteredUsers.map((u) => (
                    <UserProfileCard
                      key={u.id}
                      user={u}
                      openEdit={openEdit}
                      setDeleteConfirmId={setDeleteConfirmId}
                    />
                  ))}
                </div>
              );
            }

            // 2. Selected from Dropdown
            if (selectedUser) {
              return (
                <div className="mt-6">
                  <UserProfileCard
                    user={selectedUser}
                    openEdit={openEdit}
                    setDeleteConfirmId={setDeleteConfirmId}
                  />
                </div>
              );
            }

            // 3. Default state when neither searching nor selected
            return null;
          })()}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete User?</h3>
            <p className="text-gray-600 mb-6 text-sm">
              This will permanently remove the user from the system. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => deleteUser(deleteConfirmId)}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 border-2 border-gray-300 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && editForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b-2 border-orange-500">
              <h3 className="text-2xl font-bold text-blue-900">Edit User Details</h3>
              <button onClick={closeEdit} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <h4 className="font-bold text-blue-900 border-b pb-1">Personal Information</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                  <input value={editForm.name} onChange={setField('name')}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                  <input type="date" value={editForm.dob || ''} onChange={setField('dob')}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Age</label>
                  <input type="number" value={editForm.age || ''} onChange={setField('age')}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none" />
                </div>
              </div>

              <h4 className="font-bold text-blue-900 border-b pb-1">Identity Information</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Aadhaar Number</label>
                  <input value={editForm.aadhaar} onChange={setField('aadhaar')} maxLength={12}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Voter ID</label>
                  <input
                    value={editForm.voterId || ''}
                    onChange={setField('voterId')}
                    placeholder="ABC1234567"
                    maxLength={10}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none uppercase font-mono tracking-wider"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Passport Number</label>
                  <input
                    value={editForm.passport || ''}
                    onChange={setField('passport')}
                    placeholder="A1234567 or AB123456"
                    maxLength={8}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none uppercase font-mono tracking-wider"
                  />
                </div>
              </div>

              <h4 className="font-bold text-blue-900 border-b pb-1">Current Residence (Abroad)</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Country</label>
                  <select
                    value={editForm.country}
                    onChange={setField('country')}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none bg-white"
                    required
                  >
                    <option value="">-- Select Country --</option>
                    {countryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Current Place / City</label>
                  <select
                    value={editForm.currentPlace || ''}
                    onChange={setField('currentPlace')}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={!editForm.country}
                  >
                    <option value="">{editForm.country ? '-- Select City --' : 'Select a country first'}</option>
                    {citiesForCountry.map(city => <option key={city} value={city}>{city}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Current Address</label>
                  <textarea value={editForm.currentAddress || ''} onChange={setField('currentAddress')} rows={2}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none uppercase" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Current Pincode / ZIP</label>
                  <input
                    value={editForm.currentPincode || ''}
                    onChange={setField('currentPincode')}
                    placeholder={editPincodePlaceholder}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <h4 className="font-bold text-blue-900 border-b pb-1">Indian Permanent Address</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                  <textarea value={editForm.indianAddress || ''} onChange={setField('indianAddress')} rows={2}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none uppercase" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">State</label>
                  <select
                    value={editForm.indianState || ''}
                    onChange={setField('indianState')}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none bg-white"
                  >
                    <option value="">-- Select State / UT --</option>
                    {stateOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">District</label>
                  <select
                    value={editForm.indianDistrict || ''}
                    onChange={setField('indianDistrict')}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={!editForm.indianState}
                  >
                    <option value="">{editForm.indianState ? '-- Select District --' : 'Select a state first'}</option>
                    {districtsForState.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Place / City / Town</label>
                  <input value={editForm.indianPlace || ''} onChange={setField('indianPlace')}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none uppercase" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Assembly Constituency</label>
                  <input value={editForm.assemblyConstituency || ''} onChange={setField('assemblyConstituency')}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none uppercase" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Parliament Constituency</label>
                  <input value={editForm.parliamentConstituency || ''} onChange={setField('parliamentConstituency')}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none uppercase" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Pincode</label>
                  <input value={editForm.indianPincode || ''} onChange={setField('indianPincode')} maxLength={6}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t">
              <button
                onClick={saveEdit}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Changes
              </button>
              <button
                onClick={closeEdit}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
