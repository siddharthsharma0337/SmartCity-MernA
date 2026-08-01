import express from 'express';
import { createBin, listBins, getBin, updateBin, deleteBin } from '../controllers/binController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/requireRole.js';

const router = express.Router();
router.use(authenticate);

router.get('/', listBins);
router.get('/:id', getBin);
router.post('/', requireRole('admin', 'maintenance'), createBin);
router.put('/:id', requireRole('admin', 'maintenance'), updateBin);
router.delete('/:id', requireRole('admin'), deleteBin);

export default router;