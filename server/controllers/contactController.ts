import type { Request, Response } from 'express';
import * as contactService from '../services/contactService.js';
import { importCSV } from '../services/csvImportService.js';

export const getContacts = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const filters = {
        company: req.query.company as string,
        role: req.query.role as string,
        name: req.query.name as string,
        search: req.query.search as string
    };

    const result = await contactService.getContacts(page, limit, filters);
    res.json(result);
};

export const getContactById = async (req: Request, res: Response) => {
    const contact = await contactService.getContactById(req.params.id as string);
    if (contact) {
        res.json(contact);
    } else {
        res.status(404).json({ message: 'Contact not found' });
    }
};

export const createContact = async (req: Request, res: Response) => {
    const contact = await contactService.createContact(req.body);
    res.status(201).json(contact);
};

export const importContacts = async (req: Request, res: Response) => {
    // In a real app, use multer to handle upload
    // For this implementation, we assume file path is passed or handle simple local path
    const { filePath } = req.body as any;
    if (!filePath) return res.status(400).json({ message: 'File URL or path required' });

    try {
        const result = await importCSV(filePath as string);
        res.json(result);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: 'Error importing: ' + err.message });
    }
};

export const updateContact = async (req: Request, res: Response) => {
    const contact = await contactService.updateContact(req.params.id as string, req.body);
    if (contact) res.json(contact);
    else res.status(404).json({ message: 'Contact not found' });
};

export const deleteContact = async (req: Request, res: Response) => {
    const success = await contactService.deleteContact(req.params.id as string);
    if (success) res.json({ message: 'Deleted successfully' });
    else res.status(404).json({ message: 'Contact not found' });
};
