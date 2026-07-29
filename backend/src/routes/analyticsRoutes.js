import { Router } from 'express';
import { getAggregatedStats, getAllOpenTickets } from '../controllers/analyticsController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

// Endpoint is guarded by auth
// Additionally, we could add a role check here to ensure only 'admin' can access these
router.get('/analytics', authenticate, getAggregatedStats);
router.get('/all-tickets', authenticate, getAllOpenTickets);

export default router;
