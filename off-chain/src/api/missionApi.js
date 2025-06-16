import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const missionApi = {
    // Test simple de l'API
    testConnection: async () => {
        try {
            const response = await axios.get(`${API_URL}/test`);
            return response.data;
        } catch (error) {
            console.error('Erreur lors du test de connexion:', error);
            throw error;
        }
    },

    // Obtenir la signature pour une mission
    getMissionSignature: async (address, heroId, win, itemIds, missionId) => {
        try {
            const response = await axios.post(`${API_URL}/mission/signature`, {
                address,
                heroId,
                win,
                itemIds,
                missionId
            });
            return response.data.signature;
        } catch (error) {
            console.error('Erreur lors de la récupération de la signature:', error);
            throw error;
        }
    },

    // Obtenir les détails d'une mission
    getMissionDetails: async (missionId) => {
        try {
            const response = await axios.get(`${API_URL}/mission/${missionId}`);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des détails de la mission:', error);
            throw error;
        }
    },

    // Obtenir la liste des missions disponibles
    getAvailableMissions: async () => {
        try {
            const response = await axios.get(`${API_URL}/missions`);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des missions:', error);
            throw error;
        }
    }
}; 