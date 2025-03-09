const config = {
    development: {
        apiUrl: '/api'  // Use relative path for development
    },
    production: {
        apiUrl: import.meta.env.VITE_API_URL || '/api'  // Use relative path as fallback
    }
};

const environment = import.meta.env.MODE || 'development';
export const apiUrl = config[environment as keyof typeof config].apiUrl; 