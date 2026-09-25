import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';

// Calculate age from date string (YYYY-MM-DD)
function calculateAge(dob: string): number {
  if (!dob) return 0;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// Get all voters with optional search & filtering
export async function getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { search, country, currentPlace, state, district, constituency } = req.query;

    const query: any = {};

    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim();
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { aadhaar: { $regex: term, $options: 'i' } },
        { voterId: { $regex: term, $options: 'i' } },
        { country: { $regex: term, $options: 'i' } },
      ];
    }

    if (country && typeof country === 'string' && country.trim()) {
      query.country = country.trim();
    }
    if (currentPlace && typeof currentPlace === 'string' && currentPlace.trim()) {
      query.currentPlace = currentPlace.trim();
    }
    if (state && typeof state === 'string' && state.trim()) {
      query.indianState = state.trim();
    }
    if (district && typeof district === 'string' && district.trim()) {
      query.indianDistrict = district.trim();
    }
    if (constituency && typeof constituency === 'string' && constituency.trim()) {
      query.$or = [
        { assemblyConstituency: constituency.trim() },
        { parliamentConstituency: constituency.trim() },
        { constituency: constituency.trim() },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
}

// Check duplicate field (real-time helper for frontend)
export async function checkDuplicate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { field, value, excludeId } = req.query;

    if (!field || !value || typeof field !== 'string' || typeof value !== 'string') {
      res.status(400).json({ success: false, message: 'field and value query parameters are required.' });
      return;
    }

    const validFields = ['aadhaar', 'voterId', 'passport'];
    if (!validFields.includes(field)) {
      res.status(400).json({ success: false, message: `Field must be one of: ${validFields.join(', ')}` });
      return;
    }

    const query: any = { [field]: value.trim() };
    if (excludeId && typeof excludeId === 'string') {
      query._id = { $ne: excludeId };
    }

    const existing = await User.findOne(query);

    res.json({
      success: true,
      exists: !!existing,
      message: existing ? `This ${field} is already registered.` : 'Available',
    });
  } catch (error) {
    next(error);
  }
}

// Create new voter
export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      name, dob, aadhaar, voterId, passport,
      country, currentPlace, currentAddress, currentPincode,
      indianAddress, indianState, indianDistrict, indianPlace,
      assemblyConstituency, parliamentConstituency, indianPincode,
    } = req.body;

    // Validate required fields
    if (!name || !dob || !aadhaar || !voterId || !country || !indianState || !indianDistrict) {
      res.status(400).json({
        success: false,
        message: 'Missing mandatory registration fields. Name, DOB, Aadhaar, Voter ID, Country, State, and District are required.',
      });
      return;
    }

    // Age validation (must be >= 18)
    const age = calculateAge(dob);
    if (age < 18) {
      res.status(400).json({
        success: false,
        message: `Voter is ${age} years old. Must be at least 18 years of age to register.`,
      });
      return;
    }

    // Voter ID format validation (3 capital letters followed by 7 numbers)
    const VOTER_ID_REGEX = /^[A-Z]{3}[0-9]{7}$/;
    const cleanVoterId = voterId.trim().toUpperCase();
    if (!VOTER_ID_REGEX.test(cleanVoterId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid Voter ID format. Must be 3 capital letters followed by 7 numbers (e.g., ABC1234567).',
      });
      return;
    }

    // Check duplicates
    const duplicateAadhaar = await User.findOne({ aadhaar: aadhaar.trim() });
    if (duplicateAadhaar) {
      res.status(409).json({ success: false, message: 'A voter with this Aadhaar number already exists.' });
      return;
    }

    const duplicateVoterId = await User.findOne({ voterId: voterId.trim() });
    if (duplicateVoterId) {
      res.status(409).json({ success: false, message: 'A voter with this Voter ID already exists.' });
      return;
    }

    if (passport && passport.trim()) {
      const PASSPORT_REGEX = /^([A-Z]{2}[0-9]{6}|[A-Z][0-9]{7})$/;
      const cleanPassport = passport.trim().toUpperCase();
      if (!PASSPORT_REGEX.test(cleanPassport)) {
        res.status(400).json({
          success: false,
          message: 'Invalid Passport format. Must be 2 capital letters followed by 6 numbers (e.g., AB123456) or 1 capital letter followed by 7 numbers (e.g., A1234567).',
        });
        return;
      }
      const duplicatePassport = await User.findOne({ passport: cleanPassport });
      if (duplicatePassport) {
        res.status(409).json({ success: false, message: 'A voter with this Passport number already exists.' });
        return;
      }
    }

    const newUser = await User.create({
      name: name.trim(),
      dob: dob.trim(),
      age,
      aadhaar: aadhaar.trim(),
      voterId: voterId.trim(),
      passport: passport ? passport.trim().toUpperCase() : '',
      country: country.trim(),
      currentPlace: currentPlace ? currentPlace.trim() : '',
      currentAddress: currentAddress ? currentAddress.trim() : '',
      currentPincode: currentPincode ? currentPincode.trim() : '',
      indianAddress: indianAddress ? indianAddress.trim() : '',
      indianState: indianState.trim(),
      indianDistrict: indianDistrict.trim(),
      indianPlace: indianPlace ? indianPlace.trim() : '',
      assemblyConstituency: assemblyConstituency ? assemblyConstituency.trim() : '',
      parliamentConstituency: parliamentConstituency ? parliamentConstituency.trim() : '',
      constituency: parliamentConstituency ? parliamentConstituency.trim() : (assemblyConstituency ? assemblyConstituency.trim() : ''),
      indianPincode: indianPincode ? indianPincode.trim() : '',
      hasVotedAssembly: false,
      hasVotedParliament: false,
    });

    res.status(201).json({
      success: true,
      message: 'Voter registered successfully.',
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
}

// Get voter by ID
export async function getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'Voter not found.' });
      return;
    }
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
}

// Update voter details
export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.dob) {
      updates.age = calculateAge(updates.dob);
      if (updates.age < 18) {
        res.status(400).json({
          success: false,
          message: 'Voter must be at least 18 years of age.',
        });
        return;
      }
    }

    if (updates.parliamentConstituency && !updates.constituency) {
      updates.constituency = updates.parliamentConstituency;
    }

    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      res.status(404).json({ success: false, message: 'Voter not found.' });
      return;
    }

    res.json({
      success: true,
      message: 'Voter updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

// Delete voter
export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      res.status(404).json({ success: false, message: 'Voter not found.' });
      return;
    }

    res.json({
      success: true,
      message: 'Voter deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}
