import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import * as documentController from '../controllers/documentController';

const router = express.Router();

router.use(authenticateToken); // Document operations are protected

// Basic CRUD
router.post('/', documentController.createDocument);
router.get('/', documentController.getDocuments);
router.get('/trash', documentController.getTrash);
router.get('/:id', documentController.getDocumentById);
router.patch('/:id', documentController.updateDocument);
router.delete('/:id', documentController.deleteDocument);
router.post('/:id/restore', documentController.restoreDocument);
router.delete('/:id/permanent', documentController.permanentlyDeleteDocument);

// Search
router.get('/search', documentController.searchDocuments);

// Versioning & Snapshots
router.post('/:id/snapshots', documentController.createSnapshot);
router.get('/:id/versions', documentController.getVersions);
router.post('/:id/versions/:versionId/restore', documentController.restoreVersion);

// Collaborators & Sharing
router.post('/:id/invite', documentController.inviteToDoc);
router.post('/invitation/accept/:token', documentController.acceptInvite);
router.get('/:id/collaborators', documentController.getCollaborators);

export default router;
