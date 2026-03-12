import fs from 'fs';
import csv from 'csv-parser';
import Contact from '../models/Contact.js';
import mongoose from 'mongoose';
import axios from 'axios';
import stream from 'stream';
import { randomUUID } from 'crypto';

// ─── In-memory job registry ────────────────────────────────────────────────
export interface ImportJob {
    jobId: string;
    status: 'running' | 'done' | 'error';
    processed: number;
    total: number;
    success: number;
    failed: number;
    error?: string;
}

const jobs = new Map<string, ImportJob>();

export const getJob = (jobId: string): ImportJob | undefined => jobs.get(jobId);

// ─── Count rows in a URL or local file (fast, header-aware) ────────────────
async function countRows(source: string): Promise<number> {
    let readStream: stream.Readable;
    if (source.startsWith('http://') || source.startsWith('https://')) {
        const response = await axios({ method: 'get', url: source, responseType: 'stream' });
        readStream = response.data;
    } else {
        if (!fs.existsSync(source)) throw new Error('Local file not found');
        readStream = fs.createReadStream(source);
    }
    return new Promise((resolve, reject) => {
        let count = 0;
        let isFirstLine = true;
        readStream
            .on('data', (chunk: Buffer) => {
                const lines = chunk.toString().split('\n');
                for (const line of lines) {
                    if (isFirstLine) { isFirstLine = false; continue; } // skip header
                    if (line.trim()) count++;
                }
            })
            .on('end', () => resolve(count))
            .on('error', reject);
    });
}

// ─── Main: kick off background import, return jobId immediately ────────────
export const startImportJob = async (filePathOrUrl: string): Promise<string> => {
    const jobId = randomUUID();
    const job: ImportJob = {
        jobId,
        status: 'running',
        processed: 0,
        total: 0,
        success: 0,
        failed: 0,
    };
    jobs.set(jobId, job);

    // Kick off async — do NOT await
    runImport(filePathOrUrl, job).catch(err => {
        job.status = 'error';
        job.error = err.message;
    });

    return jobId;
};

async function runImport(filePathOrUrl: string, job: ImportJob): Promise<void> {
    // Step 1: Count total rows asynchronously for accurate progress
    try {
        job.total = await countRows(filePathOrUrl);
    } catch {
        job.total = 0; // Will show processed count only
    }

    // Step 2: Open a second read stream for actual data
    let readStream: stream.Readable;
    if (filePathOrUrl.startsWith('http://') || filePathOrUrl.startsWith('https://')) {
        const response = await axios({ method: 'get', url: filePathOrUrl, responseType: 'stream' });
        readStream = response.data;
    } else {
        readStream = fs.createReadStream(filePathOrUrl);
    }

    const BATCH_SIZE = 500;
    let batch: any[] = [];

    const flushBatch = async () => {
        if (batch.length === 0) return;
        const toInsert = [...batch];
        batch = [];
        try {
            await Contact.insertMany(toInsert, { ordered: false });
            job.success += toInsert.length;
        } catch (error: any) {
            if (error.code === 11000) {
                job.success += error.insertedDocs?.length || 0;
                job.failed += toInsert.length - (error.insertedDocs?.length || 0);
            } else {
                job.failed += toInsert.length;
                console.error('Batch insert error:', error.message);
            }
        }
    };

    return new Promise((resolve, reject) => {
        readStream
            .pipe(csv())
            .on('data', (data: any) => {
                batch.push({
                    id: data.id || new mongoose.Types.ObjectId().toString(),
                    name: `${data.first_name || ''} ${data.middle_name || ''} ${data.last_name || ''}`.trim().replace(/\s+/g, ' ') || 'Unknown Entity',
                    company: data.company_name || data.company || '',
                    role: data.designation || data.role || '',
                    email: data.email || `${data.id || 'contact'}@unknown.com`,
                    notes: data.notes || '',
                    attributes: new Map(
                        Object.entries(data).filter(([key]) =>
                            !['id', 'first_name', 'middle_name', 'last_name', 'company_name', 'company', 'designation', 'role', 'email', 'notes', '_id'].includes(key)
                        )
                    )
                });
                job.processed++;
            })
            .on('end', async () => {
                // Flush remaining items
                await flushBatch();
                job.status = 'done';
                resolve();
            })
            .on('error', (err) => {
                job.status = 'error';
                job.error = err.message;
                reject(err);
            });

        // Flush in fixed intervals to avoid accumulating huge batches
        const flusher = setInterval(async () => {
            if (batch.length >= BATCH_SIZE) {
                await flushBatch();
            }
        }, 300);

        // Clean up interval when stream ends
        readStream.on('close', () => clearInterval(flusher));
        readStream.on('end', () => clearInterval(flusher));
    });
}
