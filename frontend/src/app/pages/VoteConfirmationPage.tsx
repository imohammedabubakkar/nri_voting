import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Layout } from '../components/Layout';
import { CheckCircle, AlertCircle, Globe } from 'lucide-react';
import { PARTY_SYMBOL_IMAGES } from '../data/partySymbolImages';
import { getCountryElectionStatus } from '../utils/timezoneUtils';

interface Candidate {
  id: number;
  name: string;
  partyName: string;
  partySymbol: string;
  partyAbbr: string;
  partySymbolImage?: string;
  constituency: string;
  electionType: string;
}

export function VoteConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedParty = location.state?.selectedParty as Candidate;
  const electionType: 'assembly' | 'parliament' = location.state?.electionType ?? selectedParty?.electionType ?? 'assembly';
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const votingCountry: string = location.state?.votingCountry || currentUser?.country || 'India';
  const votingCity: string = location.state?.votingCity || currentUser?.currentPlace || '';
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    if (!selectedParty) {
      navigate('/user/dashboard');
    }
  }, [selectedParty, navigate]);

  if (!selectedParty) return null;

  const electionLabel = electionType === 'assembly' ? 'Assembly Constituency' : 'Parliament Constituency';

  const handleConfirm = () => {
    // Guard: verify election is still within time window according to the voter's country timezone
    const schedule = JSON.parse(localStorage.getItem('electionSchedule') || 'null');
    const countryStatus = getCountryElectionStatus(schedule, votingCountry, votingCity, new Date());

    if (countryStatus.status !== 'active') {
      alert(countryStatus.message || `Voting is currently closed in ${votingCountry}. Your vote cannot be submitted.`);
      navigate('/user/dashboard');
      return;
    }

    setIsConfirming(true);
    setTimeout(() => {
      // Mark the specific election type as voted
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (currentUser) {
        const voteKey = electionType === 'assembly' ? 'hasVotedAssembly' : 'hasVotedParliament';
        const updated = { ...currentUser, [voteKey]: true };
        localStorage.setItem('currentUser', JSON.stringify(updated));
        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const updatedUsers = users.map((u: { aadhaar?: string }) =>
          u.aadhaar === currentUser.aadhaar ? { ...u, [voteKey]: true } : u
        );
        localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));
      }

      // Record which candidate received this vote
      const votesData: Record<string, Record<string, Record<string, number>>> =
        JSON.parse(localStorage.getItem('votesData') || '{}');
      if (!votesData[electionType]) votesData[electionType] = {};
      if (!votesData[electionType][selectedParty.constituency]) votesData[electionType][selectedParty.constituency] = {};
      const key = String(selectedParty.id);
      votesData[electionType][selectedParty.constituency][key] =
        (votesData[electionType][selectedParty.constituency][key] || 0) + 1;
      localStorage.setItem('votesData', JSON.stringify(votesData));

      const votes = JSON.parse(localStorage.getItem('votesCast') || '0');
      localStorage.setItem('votesCast', JSON.stringify(votes + 1));
      setIsConfirmed(true);
      setTimeout(() => {
        navigate('/user/dashboard');
      }, 3000);
    }, 1500);
  };

  const PartySymbol = ({ size }: { size: 'lg' | 'sm' }) => {
    const dim = size === 'lg' ? 'w-32 h-32' : 'w-20 h-20';
    const imgDim = size === 'lg' ? 'w-28 h-28' : 'w-16 h-16';
    const emoji = size === 'lg' ? 'text-6xl' : 'text-4xl';
    const symbolImg = PARTY_SYMBOL_IMAGES[selectedParty.partyName] || selectedParty.partySymbolImage;
    return (
      <div className={`${dim} bg-gray-50 border-2 border-gray-200 rounded-lg flex items-center justify-center mx-auto overflow-hidden`}>
        {symbolImg ? (
          <img src={symbolImg} alt={selectedParty.partyName} className={`${imgDim} object-contain`} />
        ) : (
          <span className={emoji}>{selectedParty.partySymbol}</span>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {!isConfirmed ? (
          <div className="bg-white rounded-lg shadow-xl p-8 border-t-4 border-orange-500">
            <div className="text-center mb-8">
              <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-blue-900 mb-2">Confirm Your Vote</h2>
              <p className="text-gray-600">Please review your selection before confirming</p>
            </div>

            <div className="mb-4 flex flex-col items-center gap-1.5">
              <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold text-white ${electionType === 'assembly' ? 'bg-blue-600' : 'bg-green-600'}`}>
                {electionLabel}
              </span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold text-blue-800">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>Voting from: <strong>{votingCountry}</strong> (Local country time applies)</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-green-50 rounded-lg p-8 mb-8 border-2 border-blue-900">
              <p className="text-center text-sm text-gray-600 mb-4">You are voting for:</p>
              <div className="flex flex-col items-center gap-3">
                <PartySymbol size="lg" />
                <h3 className="text-2xl font-bold text-blue-900 text-center">{selectedParty.name}</h3>
                <p className="text-gray-600 font-semibold">{selectedParty.partyAbbr || selectedParty.partyName}</p>
                <p className="text-sm text-gray-500">{selectedParty.constituency}</p>
              </div>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800 text-center">
                <strong>Important:</strong> Once confirmed, your vote cannot be changed. Please ensure your selection is correct.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/user/dashboard')}
                disabled={isConfirming}
                className="bg-gray-300 text-gray-700 py-4 rounded-lg font-semibold hover:bg-gray-400 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isConfirming}
                className="bg-gradient-to-r from-orange-500 to-green-600 text-white py-4 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isConfirming ? 'Confirming...' : 'Confirm Vote'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-xl p-8 border-t-4 border-green-600">
            <div className="text-center">
              <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <CheckCircle className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-green-600 mb-4">Vote Confirmed!</h2>
              <p className="text-xl text-gray-700 mb-2">Thank you for voting</p>
              <p className="text-gray-600 mb-8">Your vote has been recorded successfully</p>

              <div className="bg-gradient-to-br from-orange-50 to-green-50 rounded-lg p-6 border-2 border-green-600 flex flex-col items-center gap-3">
                <p className="text-sm text-gray-600">Your vote for:</p>
                <PartySymbol size="sm" />
                <p className="font-bold text-blue-900 text-lg">{selectedParty.name}</p>
                <p className="text-gray-600 text-sm">{selectedParty.partyAbbr || selectedParty.partyName}</p>
              </div>

              <p className="text-sm text-gray-500 mt-6">Redirecting to dashboard...</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}