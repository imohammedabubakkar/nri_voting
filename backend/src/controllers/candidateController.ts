import { Request, Response, NextFunction } from 'express';
import { Candidate } from '../models/Candidate.js';

// Get candidates with filters
export async function getCandidates(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { electionType, state, district, constituency, partyName } = req.query;

    const query: any = {};

    if (electionType && typeof electionType === 'string' && electionType.trim()) {
      query.electionType = electionType.trim();
    }
    if (state && typeof state === 'string' && state.trim()) {
      query.state = state.trim();
    }
    if (district && typeof district === 'string' && district.trim()) {
      query.district = district.trim();
    }
    if (constituency && typeof constituency === 'string' && constituency.trim()) {
      query.constituency = constituency.trim();
    }
    if (partyName && typeof partyName === 'string' && partyName.trim()) {
      query.partyName = partyName.trim();
    }

    const candidates = await Candidate.find(query).sort({ name: 1 });

    res.json({
      success: true,
      count: candidates.length,
      candidates,
    });
  } catch (error) {
    next(error);
  }
}

// Get candidate by ID
export async function getCandidateById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      res.status(404).json({ success: false, message: 'Candidate not found.' });
      return;
    }
    res.json({ success: true, candidate });
  } catch (error) {
    next(error);
  }
}

// Create new candidate
export async function createCandidate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      name, dob, age, electionType, state, district,
      constituency, partyName, partySymbol, partyAbbr, partySymbolImage
    } = req.body;

    if (!name || !dob || !electionType || !state || !district || !constituency || !partyName) {
      res.status(400).json({
        success: false,
        message: 'Name, DOB, election type, state, district, constituency, and party are required.',
      });
      return;
    }

    // Verify party uniqueness in this constituency
    const existing = await Candidate.findOne({
      electionType,
      state,
      district,
      constituency,
      partyName,
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: `Party "${partyName}" already has a candidate registered in ${constituency} (${electionType}).`,
      });
      return;
    }

    const candidate = await Candidate.create({
      name: name.trim(),
      dob: dob.trim(),
      age: age ? String(age).trim() : '',
      electionType,
      state: state.trim(),
      district: district.trim(),
      constituency: constituency.trim(),
      partyName: partyName.trim(),
      partySymbol: partySymbol ? partySymbol.trim() : '',
      partyAbbr: partyAbbr ? partyAbbr.trim() : '',
      partySymbolImage: partySymbolImage ? partySymbolImage.trim() : '',
    });

    res.status(201).json({
      success: true,
      message: 'Candidate registered successfully.',
      candidate,
    });
  } catch (error) {
    next(error);
  }
}

// Update candidate
export async function updateCandidate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check for party uniqueness if changing party or constituency
    if (updates.partyName || updates.constituency) {
      const existingCandidate = await Candidate.findById(id);
      if (existingCandidate) {
        const checkParty = updates.partyName || existingCandidate.partyName;
        const checkType = updates.electionType || existingCandidate.electionType;
        const checkState = updates.state || existingCandidate.state;
        const checkDistrict = updates.district || existingCandidate.district;
        const checkConstituency = updates.constituency || existingCandidate.constituency;

        const conflict = await Candidate.findOne({
          _id: { $ne: id },
          electionType: checkType,
          state: checkState,
          district: checkDistrict,
          constituency: checkConstituency,
          partyName: checkParty,
        });

        if (conflict) {
          res.status(409).json({
            success: false,
            message: `Party "${checkParty}" already has a candidate registered in ${checkConstituency}.`,
          });
          return;
        }
      }
    }

    const candidate = await Candidate.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!candidate) {
      res.status(404).json({ success: false, message: 'Candidate not found.' });
      return;
    }

    res.json({
      success: true,
      message: 'Candidate updated successfully.',
      candidate,
    });
  } catch (error) {
    next(error);
  }
}

// Delete candidate
export async function deleteCandidate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const candidate = await Candidate.findByIdAndDelete(id);

    if (!candidate) {
      res.status(404).json({ success: false, message: 'Candidate not found.' });
      return;
    }

    res.json({
      success: true,
      message: 'Candidate removed successfully.',
    });
  } catch (error) {
    next(error);
  }
}
