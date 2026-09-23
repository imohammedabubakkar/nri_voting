import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { CheckCircle } from 'lucide-react';
import { PARTY_SYMBOL_IMAGES } from '../data/partySymbolImages';

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

export function VotingPage() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    const stored: Candidate[] = JSON.parse(localStorage.getItem('registeredCandidates') || '[]');
    // Re-resolve symbolImage from live imports (localStorage stores stale URLs after rebuilds)
    const resolved = stored.map(c => ({
      ...c,
      partySymbolImage: PARTY_SYMBOL_IMAGES[c.partyName] ?? c.partySymbolImage ?? '',
    }));
    setCandidates(resolved);
  }, []);

  const handleContinue = () => {
    if (selectedId === null) return;
    const selected = candidates.find(c => c.id === selectedId);
    const votes = JSON.parse(localStorage.getItem('votesCast') || '0');
    localStorage.setItem('votesCast', JSON.stringify(votes + 1));
    navigate('/user/vote-confirmation', { state: { selectedParty: selected } });
  };

  const selected = candidates.find(c => c.id === selectedId);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8 border-t-4 border-orange-500">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-blue-900 mb-2">Cast Your Vote</h2>
            <p className="text-gray-600">Select your preferred candidate</p>
          </div>

          {candidates.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg font-semibold">No candidates registered for your constituency.</p>
              <p className="text-sm mt-2">Please contact the election administrator.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {candidates.map((c) => (
                <div
                  key={c.id}
                  className={`bg-white border-4 rounded-lg p-6 hover:shadow-xl transition-all cursor-pointer ${
                    selectedId === c.id
                      ? 'border-green-600 shadow-xl scale-105'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                  onClick={() => setSelectedId(c.id)}
                >
                  <div className="relative">
                    {selectedId === c.id && (
                      <div className="absolute -top-3 -right-3 bg-green-600 rounded-full p-1">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="w-24 h-24 mx-auto bg-gray-50 border-2 border-gray-200 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                      {c.partySymbolImage ? (
                        <img
                          src={c.partySymbolImage}
                          alt={c.partyName}
                          className="w-20 h-20 object-contain"
                        />
                      ) : (
                        <span className="text-5xl">{c.partySymbol}</span>
                      )}
                    </div>
                    <h3 className="font-bold text-blue-900 text-center mb-1">{c.name}</h3>
                    <p className="text-sm text-gray-500 text-center mb-3">{c.partyAbbr || c.partyName}</p>
                    <div
                      className={`w-full py-2 rounded-lg font-semibold transition-all text-center ${
                        selectedId === c.id
                          ? 'bg-green-600 text-white'
                          : 'bg-blue-900 text-white'
                      }`}
                    >
                      {selectedId === c.id ? 'Selected' : 'Vote'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selected && (
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 mb-6 text-center">
              <p className="text-green-800 font-semibold text-lg">
                ✓ You have selected: {selected.name} ({selected.partyAbbr || selected.partyName})
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => navigate('/user/dashboard')}
              className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleContinue}
              disabled={selectedId === null}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                selectedId !== null
                  ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white hover:shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Continue to Confirm
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}