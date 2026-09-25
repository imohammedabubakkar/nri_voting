import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { UserPlus, Users, BarChart3, Download, Vote, Play, CheckCircle2, Square, Clock } from 'lucide-react';

function formatTime(t: string) {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function AdminDashboardPage() {
  const navigate = useNavigate();

  const electionSchedule = JSON.parse(localStorage.getItem('electionSchedule') || 'null') as {
    date: string; fromTime: string; toTime: string; status: string;
    allConstituencies: boolean; state?: string; district?: string;
    assemblyConstituency?: string; parliamentConstituency?: string;
  } | null;

  const isElectionActive = electionSchedule?.status === 'active';
  const isElectionEnded = electionSchedule?.status === 'ended';

  const dashboardCards = [
    {
      title: 'Create User Login',
      description: 'Register new NRI voters in the system',
      icon: UserPlus,
      color: 'from-orange-500 to-orange-600',
      path: '/admin/create-user',
    },
    {
      title: 'Registered Users Details',
      description: 'View and manage registered voters',
      icon: Users,
      color: 'from-blue-600 to-blue-700',
      path: '/admin/registered-users',
    },
    {
      title: 'Election Results',
      description: 'View real-time voting statistics',
      icon: BarChart3,
      color: 'from-green-600 to-green-700',
      path: '/admin/election-results',
    },
    {
      title: 'Download Voter Details',
      description: 'Export voter data country-wise as PDF',
      icon: Download,
      color: 'from-blue-900 to-blue-800',
      path: '/admin/download-voters',
    },
    {
      title: 'Election Candidate Registration',
      description: 'Register candidates for Assembly & Parliament elections',
      icon: Vote,
      color: 'from-purple-600 to-purple-700',
      path: '/admin/candidate-registration',
    },
    {
      title: 'Election Start',
      description: 'Schedule date, time & constituency for an election',
      icon: Play,
      color: 'from-red-500 to-orange-500',
      path: '/admin/election-start',
    },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-blue-900">Admin Dashboard</h2>
          <p className="text-gray-600 mt-2">Manage the NRI voting system</p>
        </div>

        {/* ── ELECTION STATUS BANNER ── */}
        {electionSchedule && (
          <div
            onClick={() => navigate('/admin/election-start')}
            className={`mb-6 rounded-xl border-2 p-5 cursor-pointer hover:shadow-md transition-shadow
              ${isElectionActive
                ? 'bg-green-50 border-green-500'
                : isElectionEnded
                ? 'bg-gray-50 border-gray-300'
                : 'bg-yellow-50 border-yellow-400'}`}
          >
            <div className="flex items-center gap-4">
              {isElectionActive ? (
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
              ) : isElectionEnded ? (
                <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <Square className="w-6 h-6 text-white" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              )}
              <div className="flex-1">
                <p className={`font-black text-base ${isElectionActive ? 'text-green-700' : isElectionEnded ? 'text-gray-500' : 'text-yellow-700'}`}>
                  Election is {isElectionActive ? 'ACTIVE' : isElectionEnded ? 'ENDED' : 'SCHEDULED'}
                </p>
                <p className="text-sm text-gray-600">
                  {new Date(electionSchedule.date + 'T00:00:00').toLocaleDateString('en-IN', {
                    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                  })}
                  {' '}&nbsp;·&nbsp;{' '}
                  {formatTime(electionSchedule.fromTime)} – {formatTime(electionSchedule.toTime)}
                  {' '}&nbsp;·&nbsp;{' '}
                  <span className="font-semibold">
                    {electionSchedule.allConstituencies
                      ? 'All Constituencies'
                      : [
                          electionSchedule.state,
                          electionSchedule.district,
                          electionSchedule.assemblyConstituency && `Assembly: ${electionSchedule.assemblyConstituency}`,
                          electionSchedule.parliamentConstituency && `Parliament: ${electionSchedule.parliamentConstituency}`,
                        ].filter(Boolean).join(' → ')}
                  </span>
                </p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">Click to manage →</span>
            </div>
          </div>
        )}

        {/* ── DASHBOARD CARDS ── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardCards.map((card) => {
            const Icon = card.icon;
            const isElectionCard = card.path === '/admin/election-start';
            return (
              <button
                key={card.title}
                onClick={() => navigate(card.path)}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105 text-left group relative"
              >
                {isElectionCard && isElectionActive && (
                  <span className="absolute top-3 right-3 bg-green-500 text-white text-xs font-black px-2 py-0.5 rounded-full uppercase tracking-wide animate-pulse">
                    LIVE
                  </span>
                )}
                <div className={`w-16 h-16 bg-gradient-to-br ${card.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-blue-900 mb-2">{card.title}</h3>
                <p className="text-gray-600">{card.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
