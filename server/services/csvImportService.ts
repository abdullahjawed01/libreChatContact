import fs from 'fs';
import csv from 'csv-parser';
import Contact from '../models/Contact.js';
import mongoose from 'mongoose';
import axios from 'axios';
import stream from 'stream';

export const importCSV = async (filePathOrUrl: string) => {
    let readStream: stream.Readable;

    if (filePathOrUrl.startsWith('http://') || filePathOrUrl.startsWith('https://')) {
        // Fetch from URL securely
        console.log(`Downloading CSV from: ${filePathOrUrl}`);
        const response = await axios({
            method: 'get',
            url: filePathOrUrl,
            responseType: 'stream'
        });
        readStream = response.data;
    } else {
        // Read local file
        if (!fs.existsSync(filePathOrUrl)) {
            throw new Error('Local file not found');
        }
        readStream = fs.createReadStream(filePathOrUrl);
    }

    const results: any[] = [];
    const BATCH_SIZE = 1000;
    let totalSuccess = 0;
    let totalFailed = 0;

    return new Promise((resolve, reject) => {
        readStream
            .pipe(csv())
            .on('data', (data) => {
                // Ensure the exact assignment structure
                results.push({
                    id: data.id || new mongoose.Types.ObjectId().toString(),
                    name: `${data.first_name || ''} ${data.middle_name || ''} ${data.last_name || ''}`.trim().replace(/\s+/g, ' ') || 'Unknown Entity',
                    company: data.company_name || data.company || '',
                    role: data.designation || data.role || '',
                    email: data.email || `${data.id || 'contact'}@unknown.com`,
                    notes: data.notes || '',
                    attributes: new Map(Object.entries(data).filter(([key]) =>
                        !['id', 'first_name', 'middle_name', 'last_name', 'company_name', 'company', 'designation', 'role', 'email', 'notes', '_id'].includes(key)
                    ))
                });
            })
            .on('end', async () => {
                let currentBatch: any[] = [];
                for (let i = 0; i < results.length; i++) {
                    currentBatch.push(results[i]);
                    if (currentBatch.length === BATCH_SIZE || i === results.length - 1) {
                        try {
                            // Using unordered bulk insert to skip duplicates seamlessly
                            await Contact.insertMany(currentBatch, { ordered: false });
                            totalSuccess += currentBatch.length;
                        } catch (error: any) {
                            // If duplicates are found, it throws a BulkWriteError but inserts the rest
                            if (error.code === 11000) {
                                totalSuccess += error.insertedDocs?.length || 0;
                                totalFailed += currentBatch.length - (error.insertedDocs?.length || 0);
                            } else {
                                console.error('Batch insert error:', error.message);
                                totalFailed += currentBatch.length;
                            }
                        }
                        currentBatch = [];
                    }
                }
                resolve({ success: totalSuccess, failed: totalFailed });
            })
            .on('error', (error) => reject(error));
    });
};
