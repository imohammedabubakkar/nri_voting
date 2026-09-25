import { PARTY_SYMBOL_IMAGES, NOTA_SYMBOL_IMAGE } from '../data/partySymbolImages';

export interface Candidate {
  id: number;
  electionType: 'assembly' | 'parliament' | '';
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
  isDefault?: boolean;
}

export const NOTA_PARTY_NAME = 'None of the Above';
export const NOTA_PARTY_ABBR = 'NOTA';
export const NOTA_CANDIDATE_NAME = 'None of the Above';

/**
 * Checks if a candidate is the NOTA candidate
 */
export function isNotaCandidate(candidate: {
  partyAbbr?: string;
  partyName?: string;
  name?: string;
}): boolean {
  if (!candidate) return false;
  return (
    candidate.partyAbbr === 'NOTA' ||
    candidate.partyName === 'None of the Above' ||
    candidate.partyName === 'None of the Above (NOTA)' ||
    candidate.name === 'None of the Above'
  );
}

/**
 * Generates a stable unique ID for NOTA in a given constituency
 */
export function generateNotaId(electionType: string, constituency: string): number {
  let hash = 0;
  const str = `NOTA-${(electionType || '').toUpperCase()}-${(constituency || '').toUpperCase()}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return 900000000 + (Math.abs(hash) % 99999999);
}

/**
 * Creates a default NOTA candidate object for a constituency
 */
export function createNotaCandidate(params: {
  electionType: 'assembly' | 'parliament';
  constituency: string;
  state: string;
  district: string;
}): Candidate {
  const upperConstituency = params.constituency.trim().toUpperCase();
  return {
    id: generateNotaId(params.electionType, upperConstituency),
    electionType: params.electionType,
    state: params.state,
    district: params.district,
    constituency: upperConstituency,
    name: NOTA_CANDIDATE_NAME,
    dob: '',
    age: '',
    partyName: NOTA_PARTY_NAME,
    partySymbol: '✖️',
    partyAbbr: NOTA_PARTY_ABBR,
    partySymbolImage: NOTA_SYMBOL_IMAGE,
    isDefault: true,
  };
}

interface ConstituencyInfo {
  electionType: 'assembly' | 'parliament';
  constituency: string;
  state: string;
  district: string;
}

/**
 * Ensures that EVERY assembly and parliament constituency (from registered candidates and registered voters)
 * has the default 'None of the Above (NOTA)' candidate.
 * Sorts candidates so that NOTA is always placed at the end of each constituency.
 */
export function ensureNotaCandidates(inputCandidates: Candidate[]): Candidate[] {
  // Normalize existing candidates and resolve partySymbolImage
  const existing = (inputCandidates || []).map(c => {
    const isNota = isNotaCandidate(c);
    const resolvedImage = isNota
      ? NOTA_SYMBOL_IMAGE
      : (PARTY_SYMBOL_IMAGES[c.partyName] || c.partySymbolImage || '');

    return {
      ...c,
      constituency: (c.constituency || '').trim().toUpperCase(),
      partySymbolImage: resolvedImage,
      isDefault: isNota ? true : c.isDefault,
      ...(isNota
        ? {
            name: NOTA_CANDIDATE_NAME,
            partyName: NOTA_PARTY_NAME,
            partyAbbr: NOTA_PARTY_ABBR,
            partySymbol: '✖️',
            partySymbolImage: NOTA_SYMBOL_IMAGE,
            dob: '',
            age: '',
          }
        : {}),
    };
  });

  // 1. Separate real (non-NOTA) candidates from any existing NOTA candidates
  const realCandidates = existing.filter(c => !isNotaCandidate(c));

  // 2. Identify ONLY constituencies that have at least ONE REAL CANDIDATE assigned
  // If no candidate is assigned to a constituency, do not show NOTA either!
  const constituencyMap = new Map<string, ConstituencyInfo>();
  for (const c of realCandidates) {
    if ((c.electionType === 'assembly' || c.electionType === 'parliament') && c.constituency) {
      const normConst = c.constituency.trim().toUpperCase();
      const key = `${c.electionType}:${normConst}`;
      if (!constituencyMap.has(key)) {
        constituencyMap.set(key, {
          electionType: c.electionType,
          constituency: normConst,
          state: c.state || '',
          district: c.district || '',
        });
      }
    }
  }

  // 3. Keep real candidates, and add NOTA ONLY for constituencies that have real candidates
  const resultCandidates: Candidate[] = [...realCandidates];
  let changed = false;

  for (const [, info] of constituencyMap) {
    const existingNota = existing.find(
      c =>
        c.electionType === info.electionType &&
        c.constituency?.trim().toUpperCase() === info.constituency &&
        isNotaCandidate(c)
    );

    if (existingNota) {
      resultCandidates.push(existingNota);
    } else {
      const nota = createNotaCandidate(info);
      resultCandidates.push(nota);
      changed = true;
    }
  }

  // If any orphaned NOTA (for a constituency without candidates) was removed, mark changed
  if (resultCandidates.length !== existing.length) {
    changed = true;
  }

  // Always keep NOTA at the end of each constituency list
  resultCandidates.sort((a, b) => {
    const constA = (a.constituency || '').trim().toUpperCase();
    const constB = (b.constituency || '').trim().toUpperCase();
    if (constA !== constB) {
      return constA.localeCompare(constB);
    }
    const aIsNota = isNotaCandidate(a);
    const bIsNota = isNotaCandidate(b);
    if (aIsNota && !bIsNota) return 1;
    if (!aIsNota && bIsNota) return -1;
    return a.name.localeCompare(b.name);
  });

  // Save back to localStorage if new NOTA candidate(s) were added or orphaned NOTAs were removed
  if (changed) {
    try {
      localStorage.setItem('registeredCandidates', JSON.stringify(resultCandidates));
    } catch (err) {
      console.error('Failed to sync registeredCandidates with NOTA:', err);
    }
  }

  return resultCandidates;
}
