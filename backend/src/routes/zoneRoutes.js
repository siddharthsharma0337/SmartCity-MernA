import express from 'express';
import { createZone, listZones, getZone, updateZone, deleteZone } from '../controllers/zoneController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/requireRole.js';

const router = express.Router();
router.use(authenticate);

router.get('/', listZones);
router.get('/:id', getZone);
router.post('/', requireRole('admin'), createZone);
router.put('/:id', requireRole('admin'), updateZone);
router.delete('/:id', requireRole('admin'), deleteZone);

export default router;