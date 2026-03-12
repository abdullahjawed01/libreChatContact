import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5001/api',
});

export const sendMessage = async (query: string) => {
    const response = await api.post('/chat/chat', { query });
    return response.data;
};
