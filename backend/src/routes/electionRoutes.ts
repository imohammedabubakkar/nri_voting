import { Router } from 'express';
import {
  getSchedule,
  setSchedule,
  updateScheduleStatus,
  deleteSchedule,
} from '../controllers/electionController.js';

const router = Router();

router.get('/schedule', getSchedule);
router.post('/schedule', setSchedule);
router.patch('/schedule/status', updateScheduleStatus);
router.delete('/schedule', deleteSchedule);

export default router;
