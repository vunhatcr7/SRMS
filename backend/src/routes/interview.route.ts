import { Router } from 'express';
import { 
  cancelInterview, 
  createInterview, 
  getCandidateInterviews, 
  getInterviewById, 
  getInterviewsByApplication, 
  getRecruiterInterviews, 
  updateInterview 
} from '../controllers/interview.controller';
import { requireAuth, rolesAllowed } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/interview/recruiter:
 *   get:
 *     tags:
 *       - Interview
 *     summary: Lay danh sach phong van cho Recruiter
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: SCHEDULED, COMPLETED, CANCELLED, hoac all
 *       - in: query
 *         name: jobId
 *         schema:
 *           type: string
 *         description: Loc theo jobId
 */
router.get('/recruiter', requireAuth, rolesAllowed('RECRUITER', 'MANAGER', 'ADMIN'), getRecruiterInterviews);

/**
 * @swagger
 * /api/v1/interview/candidate:
 *   get:
 *     tags:
 *       - Interview
 *     summary: Lay danh sach lich phong van cua ung vien hien tai
 *     security:
 *       - BearerAuth: []
 */
router.get('/candidate', requireAuth, rolesAllowed('CANDIDATE'), getCandidateInterviews);

/**
 * @swagger
 * /api/v1/interview/application/{applicationId}:
 *   get:
 *     tags:
 *       - Interview
 *     summary: Xem lich phong van theo application id
 *     security:
 *       - BearerAuth: []
 */
router.get('/application/:applicationId', requireAuth, getInterviewsByApplication);

/**
 * @swagger
 * /api/v1/interview/{id}:
 *   get:
 *     tags:
 *       - Interview
 *     summary: Xem chi tiet mot cuoc phong van
 *     security:
 *       - BearerAuth: []
 */
router.get('/:id', requireAuth, getInterviewById);

/**
 * @swagger
 * /api/v1/interview:
 *   post:
 *     tags:
 *       - Interview
 *     summary: Tao lich phong van
 *     security:
 *       - BearerAuth: []
 */
router.post('/', requireAuth, rolesAllowed('RECRUITER', 'MANAGER', 'ADMIN'), createInterview);

/**
 * @swagger
 * /api/v1/interview/{id}:
 *   put:
 *     tags:
 *       - Interview
 *     summary: Cap nhat lich phong van
 *     security:
 *       - BearerAuth: []
 */
router.put('/:id', requireAuth, rolesAllowed('RECRUITER', 'MANAGER', 'ADMIN'), updateInterview);

/**
 * @swagger
 * /api/v1/interview/{id}:
 *   delete:
 *     tags:
 *       - Interview
 *     summary: Huy lich phong van
 *     security:
 *       - BearerAuth: []
 */
router.delete('/:id', requireAuth, rolesAllowed('RECRUITER', 'MANAGER', 'ADMIN'), cancelInterview);

export default router;
