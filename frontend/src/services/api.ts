import axios from 'axios';
import { apiUrl } from '../config';
import { Game, ApiResponse } from '../types';

const api = axios.create({
    baseURL: apiUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getResults = async (playerName: string, games: Game[], aliases: string[] = []): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>('/get_results', {
        playerName,
        games,
        aliases
    });
    return response.data;
};

// Add interceptor to handle connection errors
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error);
        return Promise.reject(error);
    }
); 