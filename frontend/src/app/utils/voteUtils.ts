/**
 * Utility functions for managing votes, vote resets, and constituency synchronisation.
 * 
 * Requirement:
 * When a candidate has been voted, the voter dashboard shows "Vote Recorded / you have been voted".
 * If another user registers in that same constituency (or an election is started for that constituency),
 * voting resets and starts from first (0 votes) for all candidates of the same constituency,
 * and all voters in that constituency are eligible to vote again.
 */

export interface ResetConstituencyParams {
  state?: string;
  district?: string;
  assemblyConstituency?: string;
  parliamentConstituency?: string;
  reason?: string;
}

/**
 * Resets candidate votes and voter vote flags for specific assembly and/or parliament constituencies.
 */
export function resetConstituencyVoting(params: ResetConstituencyParams): {
  assemblyReset: boolean;
  parliamentReset: boolean;
  affectedVoters: number;
} {
  const normState = (params.state || '').trim().toUpperCase();
  const normDistrict = (params.district || '').trim().toUpperCase();
  const normAssembly = (params.assemblyConstituency || '').trim().toUpperCase();
  const normParliament = (params.parliamentConstituency || '').trim().toUpperCase();

  let affectedVoters = 0;
  let assemblyReset = false;
  let parliamentReset = false;

  // 1. Reset votesData for the target constituencies
  try {
    const rawVotes = localStorage.getItem('votesData');
    const votesData: Record<string, Record<string, Record<string, number>>> = rawVotes ? JSON.parse(rawVotes) : {};

    if (normAssembly && votesData['assembly']) {
      for (const key of Object.keys(votesData['assembly'])) {
        if (key.trim().toUpperCase() === normAssembly) {
          delete votesData['assembly'][key];
          assemblyReset = true;
        }
      }
    }

    if (normParliament && votesData['parliament']) {
      for (const key of Object.keys(votesData['parliament'])) {
        if (key.trim().toUpperCase() === normParliament) {
          delete votesData['parliament'][key];
          parliamentReset = true;
        }
      }
    }

    localStorage.setItem('votesData', JSON.stringify(votesData));

    // Recalculate total votesCast across all remaining elections
    let totalVotes = 0;
    for (const type of Object.keys(votesData)) {
      if (votesData[type] && typeof votesData[type] === 'object') {
        for (const c of Object.keys(votesData[type])) {
          if (votesData[type][c] && typeof votesData[type][c] === 'object') {
            for (const candId of Object.keys(votesData[type][c])) {
              totalVotes += Number(votesData[type][c][candId]) || 0;
            }
          }
        }
      }
    }
    localStorage.setItem('votesCast', JSON.stringify(totalVotes));
  } catch (err) {
    console.error('Error resetting votesData:', err);
  }

  // 2. Reset hasVoted flags in registeredUsers
  try {
    const rawUsers = localStorage.getItem('registeredUsers');
    const users: any[] = rawUsers ? JSON.parse(rawUsers) : [];

    const updatedUsers = users.map(u => {
      let changed = false;
      const userState = (u.indianState || '').trim().toUpperCase();
      const userDistrict = (u.indianDistrict || '').trim().toUpperCase();
      const userAssembly = (u.assemblyConstituency || '').trim().toUpperCase();
      const userParliament = (u.parliamentConstituency || '').trim().toUpperCase();
      const userGeneral = (u.constituency || '').trim().toUpperCase();

      let newHasVotedAssembly = u.hasVotedAssembly;
      let newHasVotedParliament = u.hasVotedParliament;

      // Check assembly constituency match or location match
      const assemblyMatch =
        (normAssembly && (userAssembly === normAssembly || userGeneral === normAssembly)) ||
        (!normAssembly && !normParliament && normState && userState === normState && (!normDistrict || userDistrict === normDistrict));

      if (assemblyMatch) {
        newHasVotedAssembly = false;
        changed = true;
      }

      // Check parliament constituency match or location match
      const parliamentMatch =
        (normParliament && (userParliament === normParliament || userGeneral === normParliament)) ||
        (!normAssembly && !normParliament && normState && userState === normState && (!normDistrict || userDistrict === normDistrict));

      if (parliamentMatch) {
        newHasVotedParliament = false;
        changed = true;
      }

      if (changed) {
        affectedVoters++;
        return {
          ...u,
          hasVotedAssembly: newHasVotedAssembly,
          hasVotedParliament: newHasVotedParliament,
        };
      }
      return u;
    });

    localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));

    // 3. Sync currentUser session if logged in
    const rawCurrent = localStorage.getItem('currentUser');
    if (rawCurrent) {
      const currentUser = JSON.parse(rawCurrent);
      const userAssembly = (currentUser.assemblyConstituency || '').trim().toUpperCase();
      const userParliament = (currentUser.parliamentConstituency || '').trim().toUpperCase();
      const userGeneral = (currentUser.constituency || '').trim().toUpperCase();

      let updatedCurrent = { ...currentUser };
      let currentChanged = false;

      if (normAssembly && (userAssembly === normAssembly || userGeneral === normAssembly)) {
        updatedCurrent.hasVotedAssembly = false;
        currentChanged = true;
      }
      if (normParliament && (userParliament === normParliament || userGeneral === normParliament)) {
        updatedCurrent.hasVotedParliament = false;
        currentChanged = true;
      }

      // Also check if currentUser matches any updated registered user by Aadhaar
      const matched = updatedUsers.find(u => u.aadhaar && u.aadhaar === currentUser.aadhaar);
      if (matched) {
        updatedCurrent.hasVotedAssembly = !!matched.hasVotedAssembly;
        updatedCurrent.hasVotedParliament = !!matched.hasVotedParliament;
        currentChanged = true;
      }

      if (currentChanged) {
        localStorage.setItem('currentUser', JSON.stringify(updatedCurrent));
      }
    }
  } catch (err) {
    console.error('Error resetting registeredUsers vote flags:', err);
  }

  // 4. Dispatch event for live UI update across pages
  try {
    window.dispatchEvent(
      new CustomEvent('constituency_vote_reset', {
        detail: {
          ...params,
          assemblyReset,
          parliamentReset,
          timestamp: Date.now(),
        },
      })
    );
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    // Ignore in non-browser context
  }

  return { assemblyReset, parliamentReset, affectedVoters };
}

/**
 * Resets all votes and voter vote flags across all constituencies.
 */
export function resetAllConstituencyVoting(params?: { reason?: string }) {
  try {
    localStorage.setItem('votesData', JSON.stringify({ assembly: {}, parliament: {} }));
    localStorage.setItem('votesCast', JSON.stringify(0));

    const rawUsers = localStorage.getItem('registeredUsers');
    if (rawUsers) {
      const users: any[] = JSON.parse(rawUsers);
      const updated = users.map(u => ({
        ...u,
        hasVotedAssembly: false,
        hasVotedParliament: false,
      }));
      localStorage.setItem('registeredUsers', JSON.stringify(updated));
    }

    const rawCurrent = localStorage.getItem('currentUser');
    if (rawCurrent) {
      const current = JSON.parse(rawCurrent);
      localStorage.setItem(
        'currentUser',
        JSON.stringify({
          ...current,
          hasVotedAssembly: false,
          hasVotedParliament: false,
        })
      );
    }

    window.dispatchEvent(
      new CustomEvent('constituency_vote_reset', {
        detail: { all: true, reason: params?.reason, timestamp: Date.now() },
      })
    );
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error('Error resetting all constituency voting:', err);
  }
}
