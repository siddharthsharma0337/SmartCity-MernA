import express from 'express';
import { createDispatch, listRoutes, getRouteDetail } from '../controllers/dispatchController.js';
import { getMyRoute, completeTask } from '../controllers/driverController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/requireRole.js';

const router = express.Router();
router.use(authenticate);

// admin/maintenance side — assigning + monitoring routes
router.post('/', requireRole('admin', 'maintenance'), createDispatch);
router.get('/', requireRole('admin', 'maintenance'), listRoutes);
router.get('/:id', requireRole('admin', 'maintenance'), getRouteDetail);

// driver side — this is the Android hand-off contract (Phase 7)
router.get('/driver/route', requireRole('driver'), getMyRoute);
router.post('/driver/task-complete', requireRole('driver'), completeTask);

export default router;