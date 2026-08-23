import { RequestHandler, Router } from 'express';
import { getCandidateProfileByUserId, getMyCandidateProfile, parseResume, upsertMyCandidateProfile, uploadResume } from '../controllers/candidate.controller';
import { requireAuth, rolesAllowed } from '../middlewares/auth.middleware';
import multer from 'multer';

const router = Router();
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (_req, file, callback) => {
		const acceptedTypes = [
			'application/pdf',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		];

		if (acceptedTypes.includes(file.mimetype)) {
			callback(null, true);
			return;
		}

		callback(new Error('Chi chap nhan file PDF hoac DOCX.'));
	},
});

const uploadResumeFile: RequestHandler = (req, res, next) => {
	upload.single('resume')(req, res, (error: unknown) => {
		if (error) {
			res.status(400).json({ message: error instanceof Error ? error.message : 'File CV không hợp lệ.' });
			return;
		}

		next();
	});
};

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
 * /api/v1/candidate/resume:
 *   post:
 *     tags:
 *       - Candidate
 *     summary: Upload and extract a CV
 *     description: Candidate-only endpoint. Accepts PDF or DOCX files up to 5 MB and stores extracted text.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - resume
 *             properties:
 *               resume:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: CV uploaded and parsed
 *       400:
 *         description: Missing, oversized, unsupported, or unreadable file
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: User is not CANDIDATE
 */
router.post('/resume', requireAuth, rolesAllowed('CANDIDATE'), uploadResumeFile, uploadResume);

/**
 * @swagger
 * /api/v1/candidate/resume/parse:
 *   post:
 *     tags:
 *       - Candidate
 *     summary: Parse an uploaded CV with AI
 *     description: Uses the configured OpenAI-compatible provider to extract structured resume data from stored resume text.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Structured resume data and updated candidate profile
 *       400:
 *         description: Candidate has no uploaded resume
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: User is not CANDIDATE
 *       502:
 *         description: AI provider error or invalid provider response
 *       503:
 *         description: AI provider is not configured
 */
router.post('/resume/parse', requireAuth, rolesAllowed('CANDIDATE'), parseResume);

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
