import express from 'express';
import * as contactController from '../controllers/contactController.js';

const router = express.Router();

// Progress polling MUST be before /:id to avoid shadowing
router.get('/import-progress/:jobId', contactController.getImportProgress);

router.get('/', contactController.getContacts);
router.post('/import', contactController.importContacts);
router.post('/', contactController.createContact);
router.get('/:id', contactController.getContactById);
router.put('/:id', contactController.updateContact);
router.delete('/:id', contactController.deleteContact);

export default router;
