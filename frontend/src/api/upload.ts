import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export const uploadFile = async (file: File): Promise<{ url: string; filename: string; mimetype: string; size: number }> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');

    const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
        }
    });

    return response.data;
};
