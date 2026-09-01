import { Router } from 'express';
import { createJob, getAllJobs, getRecommendedJobs } from '../controllers/job.controller';
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
 *               benefits:
 *                 type: string
 *                 example: "Bảo hiểm đầy đủ, lương tháng 13, hybrid remote"
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

/**
 * @swagger
 * /api/v1/job/recommendations:
 *   get:
 *     tags:
 *       - Job
 *     summary: Get jobs recommended for the current candidate
 *     description: Candidate-only endpoint. Ranks active jobs using the candidate profile skills and experience.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: Ranked job recommendations
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: User is not CANDIDATE
 *       404:
 *         description: Candidate profile not found
 */
router.get('/recommendations', requireAuth, rolesAllowed('CANDIDATE'), getRecommendedJobs);

export default router;
