import { Router } from 'express';
import { ingestBinData } from '../controllers/ingestionController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

// Endpoint is guarded by auth
router.post('/bin-data', authenticate, ingestBinData);

export default router;
