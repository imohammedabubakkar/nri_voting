import { Request, Response, NextFunction } from 'express';
import { Admin } from '../models/Admin.js';
import { User } from '../models/User.js';
import { generateToken } from '../utils/token.js';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { config } from '../config/index.js';

// Admin Login
export async function adminLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide both username and password.',
      });
      return;
    }

    let admin = await Admin.findOne({ username: username.toLowerCase().trim() });

    // Auto-bootstrap default admin if none exists
    if (!admin && username.toLowerCase().trim() === config.adminDefaultUsername.toLowerCase()) {
      admin = await Admin.create({
        username: config.adminDefaultUsername,
        password: config.adminDefaultPassword,
      });
    }

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
      return;
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
      return;
    }

    const token = generateToken({
      id: admin._id.toString(),
      role: 'admin',
      username: admin.username,
    });

    res.json({
      success: true,
      message: 'Admin logged in successfully.',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Get Admin Profile
export async function getAdminProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const admin = await Admin.findById(req.user?.id).select('-password');
    if (!admin) {
      res.status(404).json({ success: false, message: 'Admin not found.' });
      return;
    }
    res.json({ success: true, admin });
  } catch (error) {
    next(error);
  }
}

// User (Voter) Login via Aadhaar
export async function userLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { aadhaar } = req.body;

    if (!aadhaar || !aadhaar.trim()) {
      res.status(400).json({
        success: false,
        message: 'Please provide your 12-digit Aadhaar number.',
      });
      return;
    }

    const cleanedAadhaar = aadhaar.replace(/\s+/g, '').trim();
    const user = await User.findOne({
      aadhaar: { $regex: new RegExp(`^${cleanedAadhaar}$`, 'i') },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Aadhaar number not found in registered voters. Please verify or contact the admin.',
      });
      return;
    }

    const token = generateToken({
      id: user._id.toString(),
      role: 'user',
      aadhaar: user.aadhaar,
    });

    res.json({
      success: true,
      message: 'User authenticated successfully.',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
}

// Get Current User Profile
export async function getUserProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
}
