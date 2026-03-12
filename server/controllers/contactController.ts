import type { Request, Response } from 'express';
import * as contactService from '../services/contactService.js';
import { startImportJob, getJob } from '../services/csvImportService.js';

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
    if (contact) res.json(contact);
    else res.status(404).json({ message: 'Contact not found' });
};

export const createContact = async (req: Request, res: Response) => {
    const contact = await contactService.createContact(req.body);
    res.status(201).json(contact);
};

// ─── Start import as a background job, return jobId immediately ────────────
export const importContacts = async (req: Request, res: Response) => {
    const { filePath } = req.body as any;
    if (!filePath) return res.status(400).json({ message: 'File URL or path required' });

    try {
        const jobId = await startImportJob(filePath as string);
        // Respond immediately — don't block HTTP
        res.json({ jobId, message: 'Import started in background' });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: 'Error starting import: ' + err.message });
    }
};

// ─── Poll endpoint: GET /api/contacts/import-progress/:jobId ───────────────
export const getImportProgress = (req: Request, res: Response) => {
    const { jobId } = req.params;
    const job = getJob(jobId as string);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const percent = job.total > 0
        ? Math.min(100, Math.round((job.processed / job.total) * 100))
        : job.status === 'done' ? 100 : -1; // -1 = unknown total

    res.json({
        jobId: job.jobId,
        status: job.status,
        processed: job.processed,
        total: job.total,
        percent,
        success: job.success,
        failed: job.failed,
        error: job.error,
    });
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
