import { Router } from 'express';
import {
  getUsers,
  checkDuplicate,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';

const router = Router();

router.get('/', getUsers);
router.get('/check-duplicate', checkDuplicate);
router.post('/', createUser);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
