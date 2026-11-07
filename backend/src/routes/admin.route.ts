import { Router } from 'express';
import { getAdminDashboard, getAdminUsers } from '../controllers/admin.controller';
import { requireAuth, rolesAllowed } from '../middlewares/auth.middleware';

const router = Router();

router.get('/dashboard', requireAuth, rolesAllowed('ADMIN'), getAdminDashboard);
router.get('/users', requireAuth, rolesAllowed('ADMIN'), getAdminUsers);

export default router;
