import { Router } from 'express';
import {
  castVote,
  getResults,
  getDashboardStats,
} from '../controllers/voteController.js';

const router = Router();

router.post('/', castVote);
router.get('/results', getResults);
router.get('/stats', getDashboardStats);

export default router;
