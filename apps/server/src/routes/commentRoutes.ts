import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import * as commentController from '../controllers/commentController';

const router = express.Router();

router.use(authenticateToken); // Protect all comment endpoints

router.post('/', commentController.createComment);
router.get('/:documentId', commentController.getCommentsByDocument);
router.patch('/:commentId/resolve', commentController.resolveComment);
router.delete('/:commentId', commentController.deleteComment);

export default router;
