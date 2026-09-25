import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { UserCircle, Shield } from 'lucide-react';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto my-auto w-full py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-blue-900 mb-4">Welcome to NRI Remote Voting</h2>
          <p className="text-lg text-gray-600">Secure and convenient voting for Non-Resident Indians</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <button
            onClick={() => navigate('/user/login')}
            className="bg-white border-2 border-orange-500 rounded-lg p-8 shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center group-hover:from-orange-600 group-hover:to-orange-700 transition-all">
                <UserCircle className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-blue-900">USER LOGIN</h3>
              <p className="text-gray-600 text-center">Cast your vote securely from anywhere in the world</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/login')}
            className="bg-white border-2 border-green-600 rounded-lg p-8 shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center group-hover:from-green-700 group-hover:to-green-800 transition-all">
                <Shield className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-blue-900">ADMIN LOGIN</h3>
              <p className="text-gray-600 text-center">Manage users and monitor election results</p>
            </div>
          </button>
        </div>

      </div>
    </Layout>
  );
}
