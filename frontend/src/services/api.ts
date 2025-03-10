import axios from 'axios';
import { Game, ApiResponse } from '../types';

// Get the API URL from environment variables
const apiUrl = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: apiUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getResults = async (playerName: string, games: Game[], aliases: string[] = []): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>('/api/get_results', {
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
        if (error.code === 'ERR_NETWORK') {
            error.message = 'Unable to connect to server. Please check your internet connection.';
        }
        return Promise.reject(error);
    }
); 