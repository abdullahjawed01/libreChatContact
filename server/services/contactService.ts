import Contact from '../models/Contact.js';

export const getContacts = async (page: number, limit: number, filters: any) => {
    const query: any = {};

    if (filters.company) query.company = new RegExp(filters.company, 'i');
    if (filters.role) query.role = new RegExp(filters.role, 'i');
    if (filters.name) query.name = new RegExp(filters.name, 'i');

    if (filters.search) {
        query.$text = { $search: filters.search };
    }

    const contacts = await Contact.find(query)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    const total = await Contact.countDocuments(query);

    return { contacts, total, pages: Math.ceil(total / limit) };
};

export const getContactById = async (id: string) => {
    return await Contact.findById(id);
};

import crypto from 'crypto';

export const createContact = async (data: any) => {
    // Generate a unique ID if one wasn't provided (e.g., from manual frontend creation)
    const contactData = { ...data };
    if (!contactData.id) {
        contactData.id = crypto.randomUUID();
    }
    return await Contact.create(contactData);
};

export const updateContact = async (id: string, data: any) => {
    return await Contact.findByIdAndUpdate(id, data, { new: true });
};

export const deleteContact = async (id: string) => {
    return await Contact.findByIdAndDelete(id);
};
