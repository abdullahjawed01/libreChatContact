import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5001/api',
});

export const getContacts = async (params: any) => {
    const response = await api.get('/contacts', { params });
    return response.data;
};

export const getContactById = async (id: string) => {
    const response = await api.get(`/contacts/${id}`);
    return response.data;
};

export const createContact = async (data: any) => {
    const response = await api.post('/contacts', data);
    return response.data;
};

export const importContacts = async (filePath: string) => {
    const response = await api.post('/contacts/import', { filePath });
    return response.data;
};
export const updateContact = async (id: string, data: any) => {
    const response = await api.put(`/contacts/${id}`, data);
    return response.data;
};

export const deleteContact = async (id: string) => {
    const response = await api.delete(`/contacts/${id}`);
    return response.data;
};
