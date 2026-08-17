import { Router } from 'express';
import { getCandidateProfileByUserId, getMyCandidateProfile, upsertMyCandidateProfile } from '../controllers/candidate.controller';
import { requireAuth, rolesAllowed } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/candidate/profile:
 *   get:
 *     tags:
 *       - Candidate
 *     summary: Get my candidate profile
 *     description: Only CANDIDATE can view their own candidate profile through this endpoint.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Candidate profile
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: User is not CANDIDATE
 *       404:
 *         description: Candidate profile not found
 *       500:
 *         description: Server error
 */
router.get('/profile', requireAuth, rolesAllowed('CANDIDATE'), getMyCandidateProfile);

/**
 * @swagger
 * /api/v1/candidate/profile:
 *   put:
 *     tags:
 *       - Candidate
 *     summary: Create or update my candidate profile
 *     description: Only CANDIDATE can create or update their own profile.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skills:
 *                 oneOf:
 *                   - type: array
 *                     items:
 *                       type: string
 *                   - type: string
 *                 example: ["React", "TypeScript", "Node.js"]
 *               experience:
 *                 type: object
 *                 example:
 *                   years: 2
 *                   position: "Frontend Developer"
 *               education:
 *                 type: object
 *                 example:
 *                   school: "Demo University"
 *                   major: "Software Engineering"
 *               resumeUrl:
 *                 type: string
 *                 example: "https://example.com/resume.pdf"
 *     responses:
 *       200:
 *         description: Candidate profile updated
 *       201:
 *         description: Candidate profile created
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: User is not CANDIDATE
 *       500:
 *         description: Server error
 */
router.put('/profile', requireAuth, rolesAllowed('CANDIDATE'), upsertMyCandidateProfile);

/**
 * @swagger
 * /api/v1/candidate/profile/{userId}:
 *   get:
 *     tags:
 *       - Candidate
 *     summary: Get candidate profile by user id
 *     description: The owner can view their own profile. ADMIN, MANAGER, and RECRUITER can view candidate profiles.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         example: "paste-candidate-user-id-here"
 *     responses:
 *       200:
 *         description: Candidate profile
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: User does not have permission to view this profile
 *       404:
 *         description: Candidate profile not found
 *       500:
 *         description: Server error
 */
router.get('/profile/:userId', requireAuth, getCandidateProfileByUserId);

export default router;
