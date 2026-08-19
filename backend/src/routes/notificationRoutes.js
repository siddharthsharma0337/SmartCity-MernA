import express from 'express';
import { listMyNotifications, markNotificationRead } from '../controllers/notificationController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(authenticate);

router.get('/', listMyNotifications);
router.put('/:id/read', markNotificationRead);

export default router;