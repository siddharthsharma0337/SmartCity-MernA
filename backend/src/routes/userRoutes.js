import express from 'express';
import { createUser, listUsers, getUser, updateUser, deleteUser } from '../controllers/userController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/requireRole.js';

const router = express.Router();
router.use(authenticate);

// Only admin manages accounts — this is why you still needed one manually
// SQL-inserted admin user first (chicken-and-egg: creating a user requires
// already being authenticated as an admin).
router.get('/', requireRole('admin'), listUsers);
router.get('/:id', requireRole('admin'), getUser);
router.post('/', requireRole('admin'), createUser);
router.put('/:id', requireRole('admin'), updateUser);
router.delete('/:id', requireRole('admin'), deleteUser);

export default router;