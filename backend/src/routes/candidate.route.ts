import { RequestHandler, Router } from 'express';
import path from 'path';
import { getCandidateProfileByUserId, getCandidateResume, getMyCandidateProfile, getMyResume, upsertMyCandidateProfile, uploadResume } from '../controllers/candidate.controller';
import { requireAuth, rolesAllowed } from '../middlewares/auth.middleware';
import multer from 'multer';
import { MAX_RESUME_FILE_SIZE } from '../services/resume-storage.service';

const router = Router();
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: MAX_RESUME_FILE_SIZE },
	fileFilter: (_req, file, callback) => {
		const extension = path.extname(file.originalname).toLowerCase();
		const isPdf = file.mimetype === 'application/pdf' && extension === '.pdf';
		const isDocx = file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
			&& extension === '.docx';

		if (isPdf || isDocx) {
			callback(null, true);
			return;
		}

		callback(new Error('Chỉ chấp nhận file PDF hoặc DOCX.'));
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
 *     summary: Upload and store the original CV
 *     description: Candidate-only endpoint. Accepts validated PDF or DOCX files up to 5 MB. The original file is stored privately and can be retrieved through the protected resume endpoints. This operation does not call an AI provider.
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
 *         description: Original CV stored and linked to the candidate profile
 *       400:
 *         description: Missing, oversized, unsupported, or invalid file
 *       422:
 *         description: PDF/DOCX content could not be read
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: User is not CANDIDATE
 *       500:
 *         description: File storage or database error
 */
router.post('/resume', requireAuth, rolesAllowed('CANDIDATE'), uploadResumeFile, uploadResume);

/**
 * @swagger
 * /api/v1/candidate/resume/file:
 *   get:
 *     tags:
 *       - Candidate
 *     summary: View or download my stored CV
 *     description: Candidate-only endpoint. Returns the original file associated with the authenticated candidate's own profile.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: download
 *         schema:
 *           type: boolean
 *         description: Set true to force a download instead of inline viewing.
 *     responses:
 *       200:
 *         description: Original CV file
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: User is not a candidate
 *       404:
 *         description: Candidate profile or stored CV not found
 *       500:
 *         description: Storage read error
 */
router.get('/resume/file', requireAuth, rolesAllowed('CANDIDATE'), getMyResume);

/**
 * @swagger
 * /api/v1/candidate/resume/{userId}/file:
 *   get:
 *     tags:
 *       - Candidate
 *     summary: View or download a candidate CV
 *     description: Recruiters can access CVs only for candidates who applied to jobs they own. ADMIN and MANAGER can access all candidate CVs.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: download
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Original CV file
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: User does not have access to this candidate
 *       404:
 *         description: Candidate profile or stored CV not found
 *       500:
 *         description: Storage read error
 */
router.get('/resume/:userId/file', requireAuth, rolesAllowed('RECRUITER', 'MANAGER', 'ADMIN'), getCandidateResume);

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
