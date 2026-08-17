import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller';
import { requireAuth, rolesAllowed } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new account
 *     description: Public self-registration only allows CANDIDATE or RECRUITER roles.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "candidate@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "Password123@"
 *               role:
 *                 type: string
 *                 enum: ["CANDIDATE", "RECRUITER"]
 *                 default: "CANDIDATE"
 *                 example: "CANDIDATE"
 *     responses:
 *       201:
 *         description: Account registered successfully
 *       400:
 *         description: Missing data, duplicate email, weak password, or invalid self-register role
 *       500:
 *         description: Server error
 */
router.post('/register', register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login and receive a JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "recruiter@fpt.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Password123@"
 *     responses:
 *       200:
 *         description: Login successful. Copy token and use Authorize with Bearer TOKEN.
 *       400:
 *         description: Invalid email or password
 *       500:
 *         description: Server error
 */
router.post('/login', login);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current logged-in user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *       401:
 *         description: Missing or invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/me', requireAuth, getMe);

/**
 * @swagger
 * /api/v1/auth/admin-only:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Test ADMIN-only permission
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: ADMIN token accepted
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: User is not ADMIN
 */
router.get('/admin-only', requireAuth, rolesAllowed('ADMIN'), (req, res) => {
  res.status(200).json({
    message: 'Admin access granted.',
    adminInfo: req.user,
  });
});

export default router;
