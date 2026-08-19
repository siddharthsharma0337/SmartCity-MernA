import express from 'express';
import { recalculateBinPriority, recalculateAllPriorities } from '../controllers/priorityController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/requireRole.js';

const router = express.Router();
router.use(authenticate);

router.post('/recalculate/:id', requireRole('admin', 'maintenance'), recalculateBinPriority);
router.post('/recalculate-all', requireRole('admin', 'maintenance'), recalculateAllPriorities);

export default router;
