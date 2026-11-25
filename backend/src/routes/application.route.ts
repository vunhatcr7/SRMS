import { Router } from 'express';
import { applyJob, getMyApplicationById, getMyApplicationForJob, getMyApplications, getRecruiterApplicationById, getRecruiterApplications, getRecruiterApplicationsByCandidate, updateApplicationStage } from '../controllers/application.controller';
import { requireAuth, rolesAllowed } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/application/apply:
 *   post:
 *     tags:
 *       - Application
 *     summary: Candidate applies to a job
 *     description: Only CANDIDATE can apply once per job. Candidates manage their resume through their profile.
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
 *               coverLetter:
 *                 type: string
 *                 example: "I have experience with React, TypeScript and REST APIs."
 *     responses:
 *       201:
 *         description: Application created successfully
 *       400:
 *         description: Missing jobId, closed job, duplicate application, or resumeUrl supplied on the application
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
 *     description: RECRUITER sees applications for owned jobs. ADMIN can see all applications.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Application list with job and candidate profile
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
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: This endpoint requires a RECRUITER or ADMIN account
 *       500:
 *         description: Server error
 */
router.get('/recruiter', requireAuth, rolesAllowed('RECRUITER', 'MANAGER', 'ADMIN'), getRecruiterApplications);
router.get('/recruiter/candidate/:candidateId', requireAuth, rolesAllowed('RECRUITER', 'MANAGER', 'ADMIN'), getRecruiterApplicationsByCandidate);
router.get('/recruiter/:applicationId', requireAuth, rolesAllowed('RECRUITER', 'MANAGER', 'ADMIN'), getRecruiterApplicationById);

/**
 * @swagger
 * /api/v1/application/update-stage:
 *   put:
 *     tags:
 *       - Application
 *     summary: Update application stage
 *     description: RECRUITER can update owned applications. ADMIN can update any application.
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
