import { Router } from 'express';
import {
  adminLogin,
  getAdminProfile,
  userLogin,
  getUserProfile,
} from '../controllers/authController.js';
import { protectAdmin, protectUser } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/admin/login', adminLogin);
router.get('/admin/me', protectAdmin, getAdminProfile);

router.post('/user/login', userLogin);
router.get('/user/me', protectUser, getUserProfile);

export default router;
