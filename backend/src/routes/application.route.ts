import { Router } from 'express';
import { applyJob, getMyApplicationById, getMyApplicationForJob, getMyApplications, getRankedApplicationsByJob, getRecruiterApplications, updateApplicationStage } from '../controllers/application.controller';
import { requireAuth, rolesAllowed } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/application/apply:
 *   post:
 *     tags:
 *       - Application
 *     summary: Candidate applies to a job
 *     description: Only CANDIDATE can apply. A candidate can apply to each job only once.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: Job id copied from GET /api/v1/job or POST /api/v1/job/create
 *                 example: "paste-job-id-here"
 *               resumeUrl:
 *                 type: string
 *                 example: "https://example.com/demo-cv.pdf"
 *               coverLetter:
 *                 type: string
 *                 example: "I have experience with React, TypeScript and REST APIs."
 *     responses:
 *       201:
 *         description: Application created successfully
 *       400:
 *         description: Missing jobId or candidate already applied
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: User is not CANDIDATE
 *       404:
 *         description: Job not found
 *       500:
 *         description: Server error
 */
router.post('/apply', requireAuth, rolesAllowed('CANDIDATE'), applyJob);

router.get('/status/:jobId', requireAuth, rolesAllowed('CANDIDATE'), getMyApplicationForJob);
router.get('/my', requireAuth, rolesAllowed('CANDIDATE'), getMyApplications);
router.get('/my/:applicationId', requireAuth, rolesAllowed('CANDIDATE'), getMyApplicationById);

/**
 * @swagger
 * /api/v1/application/recruiter:
 *   get:
 *     tags:
 *       - Application
 *     summary: Get applications for recruiter review
 *     description: RECRUITER sees applications for owned jobs. ADMIN and MANAGER can see all applications.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Application list with job, candidate profile, and matching scores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   jobId:
 *                     type: string
 *                   stage:
 *                     type: string
 *                     enum: ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"]
 *                   matchingScore:
 *                     type: number
 *                     example: 82
 *                   skillScore:
 *                     type: number
 *                     example: 88
 *                   experienceScore:
 *                     type: number
 *                     example: 75
 *                   aiExplanation:
 *                     type: string
 *                     example: "Candidate has strong overlap with the job requirements."
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: User is not RECRUITER, MANAGER, or ADMIN
 *       500:
 *         description: Server error
 */
router.get('/recruiter', requireAuth, rolesAllowed('RECRUITER', 'MANAGER', 'ADMIN'), getRecruiterApplications);

/**
 * @swagger
 * /api/v1/application/ranking/{jobId}:
 *   get:
 *     tags:
 *       - Application
 *     summary: Rank applications for a job
 *     description: Returns applications ordered by matching score. Recruiters can only view their own jobs; managers and admins can view all jobs.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ranked candidate applications
 *       400:
 *         description: Missing job id
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Recruiter does not own this job
 *       404:
 *         description: Job not found
 */
router.get('/ranking/:jobId', requireAuth, rolesAllowed('RECRUITER', 'MANAGER', 'ADMIN'), getRankedApplicationsByJob);

/**
 * @swagger
 * /api/v1/application/update-stage:
 *   put:
 *     tags:
 *       - Application
 *     summary: Update application stage
 *     description: RECRUITER can update owned applications. ADMIN and MANAGER can update any application.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - applicationId
 *               - stage
 *             properties:
 *               applicationId:
 *                 type: string
 *                 example: "paste-application-id-here"
 *               stage:
 *                 type: string
 *                 enum: ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"]
 *                 example: "INTERVIEW"
 *     responses:
 *       200:
 *         description: Stage updated successfully
 *       400:
 *         description: Missing applicationId/stage or invalid stage
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: User does not have permission to update this application
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
 */
router.put('/update-stage', requireAuth, rolesAllowed('RECRUITER', 'MANAGER', 'ADMIN'), updateApplicationStage);

export default router;
