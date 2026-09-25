import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { UserPlus, Users, BarChart3, Download, Vote, Play, CheckCircle2, Square, Clock, LogOut } from 'lucide-react';
import { RegionalClockCard } from '../components/RegionalClockCard';

import { computeLiveElectionStatus, checkAndAutoStopElection } from '../utils/timezoneUtils';

function formatTime(t: string) {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [now, setNow] = useState(new Date());
  const [schedule, setSchedule] = useState<{
    date: string; fromTime: string; toTime: string; status: string;
    resultDate?: string; resultTime?: string;
    allConstituencies: boolean; state?: string; district?: string;
    assemblyConstituency?: string; parliamentConstituency?: string;
  } | null>(() => {
    return JSON.parse(localStorage.getItem('electionSchedule') || 'null');
  });

  // Live ticking clock (1-second precision) and automatic election stop checker
  useEffect(() => {
    const update = () => {
      const current = new Date();
      setNow(current);
      checkAndAutoStopElection(current);
      const raw = localStorage.getItem('electionSchedule');
      setSchedule(raw ? JSON.parse(raw) : null);
    };

    update();
    const id = setInterval(update, 1000);
    window.addEventListener('electionScheduleUpdated', update);
    window.addEventListener('storage', update);
    return () => {
      clearInterval(id);
      window.removeEventListener('electionScheduleUpdated', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    navigate('/admin/login');
  };

  const liveStatus = computeLiveElectionStatus(schedule, now);
  const isElectionActive = liveStatus === 'active';

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-blue-900">Admin Dashboard</h2>
            <p className="text-gray-600 mt-2">Manage the NRI voting system</p>
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Live Regional Clock (Indian Standard Time) */}
        <RegionalClockCard
          country="India"
          city="New Delhi"
          currentTime={now}
          showCountrySelect={false}
        />

        {/* ── ELECTION STATUS BANNER (ONLY SHOWN DURING ELECTION TIME) ── */}
        {schedule && isElectionActive && (
          <div
            onClick={() => navigate('/admin/election-start')}
            className="mb-6 rounded-xl border-2 p-5 cursor-pointer hover:shadow-md transition-shadow bg-green-50 border-green-500"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-black text-base text-green-700">
                  Election is ACTIVE
                </p>
                <p className="text-sm text-gray-600">
                  {new Date(schedule.date + 'T00:00:00').toLocaleDateString('en-IN', {
                    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                  })}
                  {' '}&nbsp;·&nbsp;{' '}
                  {formatTime(schedule.fromTime)} – {formatTime(schedule.toTime)}
                  {' '}&nbsp;·&nbsp;{' '}
                  <span className="font-semibold">
                    {schedule.allConstituencies
                      ? 'All Constituencies'
                      : [
                          schedule.state,
                          schedule.district,
                          schedule.assemblyConstituency && `Assembly: ${schedule.assemblyConstituency}`,
                          schedule.parliamentConstituency && `Parliament: ${schedule.parliamentConstituency}`,
                        ].filter(Boolean).join(' → ')}
                  </span>
                </p>
                {schedule.resultDate && schedule.resultTime && (
                  <p className="text-xs text-green-700 font-semibold mt-1 flex items-center gap-1.5">
                    <span>🇮🇳</span>
                    <span>Result Release (IST):</span>
                    <span className="font-bold text-green-800">
                      {new Date(schedule.resultDate + 'T00:00:00').toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })} at {formatTime(schedule.resultTime)} (India Time Only)
                    </span>
                  </p>
                )}
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

        {/* ── LOGOUT CONFIRMATION MODAL ── */}
        {showLogoutModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center border-t-4 border-red-600 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                <LogOut className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Logout</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to log out of the Admin Dashboard?
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
