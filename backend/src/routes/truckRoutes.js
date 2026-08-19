import express from 'express';
import { createTruck, listTrucks, getTruck, updateTruck, deleteTruck } from '../controllers/truckController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/requireRole.js';

const router = express.Router();
router.use(authenticate);

router.get('/', listTrucks);
router.get('/:id', getTruck);
router.post('/', requireRole('admin'), createTruck);
router.put('/:id', requireRole('admin'), updateTruck);
router.delete('/:id', requireRole('admin'), deleteTruck);

export default router;