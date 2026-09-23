import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { CheckCircle } from 'lucide-react';
import { getBrowserTimeZone } from '../utils/timezoneUtils';

const DEFAULT_DEMO_USERS = [
  {
    id: 1711000000001,
    name: 'Rahul Sharma',
    dob: '1990-05-15',
    age: '36',
    aadhaar: '123456789012',
    voterId: 'IND8472910',
    passport: 'N8472910',
    country: 'United Arab Emirates',
    currentPlace: 'Dubai',
    currentAddress: 'Apartment 402, Marina Heights, Dubai Marina',
    currentPincode: '00000',
    indianAddress: '42, Park Avenue, Indiranagar',
    indianState: 'Karnataka',
    indianDistrict: 'Bangalore Urban',
    indianPlace: 'Bangalore',
    assemblyConstituency: 'Shantinagar',
    parliamentConstituency: 'Bangalore Central',
    indianPincode: '560038',
    constituency: 'Bangalore Central',
  },
  {
    id: 1711000000002,
    name: 'Priya Patel',
    dob: '1992-08-20',
    age: '34',
    aadhaar: '987654321098',
    voterId: 'USA9182734',
    passport: 'P9182734',
    country: 'United States',
    currentPlace: 'New York',
    currentAddress: '742 5th Avenue, Manhattan',
    currentPincode: '10001',
    indianAddress: '15, Navrangpura Road',
    indianState: 'Gujarat',
    indianDistrict: 'Ahmedabad',
    indianPlace: 'Ahmedabad',
    assemblyConstituency: 'Ellis Bridge',
    parliamentConstituency: 'Ahmedabad West',
    indianPincode: '380009',
    constituency: 'Ahmedabad West',
  },
];

export function UserLoginPage() {
  const navigate = useNavigate();
  const [aadhaar, setAadhaar] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem('registeredUsers');
    const users = raw ? JSON.parse(raw) : [];
    if (!users || users.length === 0) {
      localStorage.setItem('registeredUsers', JSON.stringify(DEFAULT_DEMO_USERS));
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAadhaar = aadhaar.replace(/\s+/g, '').trim();
    const registeredUsers: any[] = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const matched = registeredUsers.find((u: any) => (u.aadhaar || '').replace(/\s+/g, '') === cleanAadhaar);

    if (matched) {
      const clientTimeZone = getBrowserTimeZone();
      const sessionUser = {
        ...matched,
        deviceTimeZone: clientTimeZone,
        lastLoginAt: new Date().toISOString(),
      };
      localStorage.setItem('currentUser', JSON.stringify(sessionUser));
      navigate('/user/dashboard');
    } else {
      setError('Aadhaar number not found. Please check and try again.');
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-orange-500">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-blue-900">User Login</h2>
            <p className="text-gray-600 mt-2">Enter your 12-digit Aadhaar number to access your dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Aadhaar Number
              </label>
              <input
                type="text"
                value={aadhaar}
                onChange={(e) => {
                  setAadhaar(e.target.value);
                  if (error) setError('');
                }}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none text-center text-lg tracking-widest font-mono ${
                  error ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'
                }`}
                placeholder="XXXX XXXX XXXX"
                maxLength={14}
                required
              />
              {error && (
                <p className="mt-2 text-sm text-red-600 font-medium text-center">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3.5 rounded-xl font-bold text-base hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg active:scale-[0.99]"
            >
              Login to Dashboard
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
