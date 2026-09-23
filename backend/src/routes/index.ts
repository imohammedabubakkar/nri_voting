import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import candidateRoutes from './candidateRoutes.js';
import electionRoutes from './electionRoutes.js';
import voteRoutes from './voteRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/candidates', candidateRoutes);
router.use('/election', electionRoutes);
router.use('/votes', voteRoutes);

export default router;
