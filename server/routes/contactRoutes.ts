import express from 'express';
import * as contactController from '../controllers/contactController.js';

const router = express.Router();

router.get('/', contactController.getContacts);
router.get('/:id', contactController.getContactById);
router.post('/', contactController.createContact);
router.post('/import', contactController.importContacts);
router.put('/:id', contactController.updateContact);
router.delete('/:id', contactController.deleteContact);

export default router;
