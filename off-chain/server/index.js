const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Configuration CORS
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Route pour récupérer les missions
app.get('/mission/missions', async (req, res) => {
    try {
        console.log('Requête reçue pour /mission/missions');
        const missionsPath = path.join(__dirname, 'src/config/missions.json');
        const missionsData = await fs.readFile(missionsPath, 'utf8');
        const missions = JSON.parse(missionsData);
        console.log('Missions lues avec succès:', missions);
        res.json(missions);
    } catch (error) {
        console.error('Erreur lors de la lecture des missions:', error);
        res.status(500).json({ error: 'Erreur lors de la lecture des missions' });
    }
});

// Routes
const missionRoutes = require('./src/routes/mission');
app.use('/mission', missionRoutes);

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Une erreur est survenue',
        message: err.message
    });
});

// Démarrer le serveur
app.listen(port, () => {
    console.log(`Serveur API démarré sur le port ${port}`);
}); 