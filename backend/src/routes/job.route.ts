import { Router } from 'express';
import { createJob, getAllJobs, getJobById, getManagedJobById, getManagedJobs, toggleManagedJob, updateManagedJob } from '../controllers/job.controller';
import { requireAuth, rolesAllowed } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/job/create:
 *   post:
 *     tags:
 *       - Job
 *     summary: Create a new job post
 *     description: Only RECRUITER or ADMIN can create job posts.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - requirements
 *               - location
 *               - companyName
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Backend Developer Intern"
 *               description:
 *                 type: string
 *                 example: "Build REST APIs for the SRMS platform."
 *               requirements:
 *                 type: string
 *                 example: "Node.js, Express, Prisma, PostgreSQL"
 *               salaryRange:
 *                 type: string
 *                 example: "8M - 12M"
 *               location:
 *                 type: string
 *                 example: "Ho Chi Minh City"
 *               companyName:
 *                 type: string
 *                 example: "FPT Software"
 *     responses:
 *       201:
 *         description: Job created successfully
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: User is not RECRUITER or ADMIN
 *       500:
 *         description: Server error
 */
router.post('/create', requireAuth, rolesAllowed('RECRUITER', 'ADMIN'), createJob);
router.get('/manage', requireAuth, rolesAllowed('RECRUITER', 'ADMIN'), getManagedJobs);
router.get('/manage/:jobId', requireAuth, rolesAllowed('RECRUITER', 'ADMIN'), getManagedJobById);
router.put('/manage/:jobId', requireAuth, rolesAllowed('RECRUITER', 'ADMIN'), updateManagedJob);
router.patch('/manage/:jobId/toggle', requireAuth, rolesAllowed('RECRUITER', 'ADMIN'), toggleManagedJob);

/**
 * @swagger
 * /api/v1/job:
 *   get:
 *     tags:
 *       - Job
 *     summary: Get all job posts
 *     description: Public endpoint. Returns job posts with company information.
 *     responses:
 *       200:
 *         description: Job list
 *       500:
 *         description: Server error
 */
router.get('/', getAllJobs);

router.get('/:jobId', getJobById);

export default router;
