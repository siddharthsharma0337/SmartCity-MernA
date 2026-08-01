import express from 'express';
import { createTicket, listTickets, getTicket, updateTicket, deleteTicket } from '../controllers/ticketController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/requireRole.js';

const router = express.Router();
router.use(authenticate);

router.get('/', listTickets);
router.get('/:id', getTicket);
router.post('/', createTicket); // any authenticated role (citizen/driver) can file
router.put('/:id', requireRole('admin', 'maintenance'), updateTicket);
router.delete('/:id', requireRole('admin'), deleteTicket);

export default router;