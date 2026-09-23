import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { Search, ArrowLeft, Pencil, Trash2, X, Save, ChevronDown, ChevronUp } from 'lucide-react';

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

export function RegisteredUsersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>(JSON.parse(localStorage.getItem('registeredUsers') || '[]'));
  const [expandedId, setExpandedId] = useState<number | null>(null);
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

  const setField = (field: keyof User) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setEditForm(prev => prev ? { ...prev, [field]: e.target.value } : prev);

  const deleteUser = (id: number) => {
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    localStorage.setItem('registeredUsers', JSON.stringify(updated));
    setDeleteConfirmId(null);
    if (expandedId === id) setExpandedId(null);
  };

  const saveEdit = () => {
    if (!editForm) return;
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
            <p className="text-gray-600">{users.length} registered candidate{users.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
              placeholder="Search by name, Aadhaar, or country..."
            />
          </div>

          {filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              {users.length === 0
                ? 'No users registered yet. Use Create User to add candidates.'
                : 'No results match your search.'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user, index) => (
                <div key={user.id} className="border-2 border-gray-200 rounded-xl overflow-hidden">
                  {/* Row header */}
                  <div
                    className="flex items-center justify-between px-5 py-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-green-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-bold text-blue-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.aadhaar} &bull; {user.country} &bull; {user.constituency}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(user); }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(user.id); }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                      {expandedId === user.id
                        ? <ChevronUp className="w-5 h-5 text-gray-500" />
                        : <ChevronDown className="w-5 h-5 text-gray-500" />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {expandedId === user.id && (
                    <div className="px-6 py-5 border-t border-gray-200 bg-white">
                      <SectionHeading title="Personal Information" />
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-2">
                        <Field label="Full Name" value={user.name} />
                        <Field label="Date of Birth" value={user.dob} />
                        <Field label="Age" value={user.age} />
                      </div>

                      <SectionHeading title="Identity Information" />
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-2">
                        <Field label="Aadhaar Number" value={user.aadhaar} />
                        <Field label="Voter ID" value={user.voterId} />
                        <Field label="Passport Number" value={user.passport} />
                      </div>

                      <SectionHeading title="Current Residence (Abroad)" />
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-2">
                        <Field label="Country" value={user.country} />
                        <Field label="Current Place" value={user.currentPlace} />
                        <Field label="Current Pincode" value={user.currentPincode} />
                        <div className="col-span-2 md:col-span-3">
                          <Field label="Current Address" value={user.currentAddress} />
                        </div>
                      </div>

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
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 text-sm text-gray-500">
            Showing {filteredUsers.length} of {users.length} registered users
          </div>
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
                  <input value={editForm.voterId || ''} onChange={setField('voterId')}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Passport Number</label>
                  <input value={editForm.passport || ''} onChange={setField('passport')}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none" />
                </div>
              </div>

              <h4 className="font-bold text-blue-900 border-b pb-1">Current Residence (Abroad)</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Country</label>
                  <input value={editForm.country} onChange={setField('country')}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Current Place</label>
                  <input value={editForm.currentPlace || ''} onChange={setField('currentPlace')}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Current Address</label>
                  <textarea value={editForm.currentAddress || ''} onChange={setField('currentAddress')} rows={2}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Current Pincode</label>
                  <input value={editForm.currentPincode || ''} onChange={setField('currentPincode')}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none" />
                </div>
              </div>

              <h4 className="font-bold text-blue-900 border-b pb-1">Indian Permanent Address</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                  <textarea value={editForm.indianAddress || ''} onChange={setField('indianAddress')} rows={2}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">State</label>
                  <input value={editForm.indianState || ''} onChange={setField('indianState')}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">District</label>
                  <input value={editForm.indianDistrict || ''} onChange={setField('indianDistrict')}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Place / City / Town</label>
                  <input value={editForm.indianPlace || ''} onChange={setField('indianPlace')}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Assembly Constituency</label>
                  <input value={editForm.assemblyConstituency || ''} onChange={setField('assemblyConstituency')}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Parliament Constituency</label>
                  <input value={editForm.parliamentConstituency || ''} onChange={setField('parliamentConstituency')}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none" />
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
