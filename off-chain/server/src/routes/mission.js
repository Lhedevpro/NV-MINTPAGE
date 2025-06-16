const express = require('express');
const router = express.Router();
const oracle = require('../services/oracle');
const missionsConfig = require('../config/missions.json');
const path = require('path');
const fs = require('fs').promises;

// Configuration CORS
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    // Gérer les requêtes OPTIONS pour le preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

// Route de test
router.get('/test', (req, res) => {
    res.json({
        status: 'online',
        message: 'API Mission Oracle is running',
        timestamp: Date.now()
    });
});

// Route pour obtenir toutes les missions
router.get('/missions', (req, res) => {
    try {
        res.json(missionsConfig);
    } catch (error) {
        console.error('Erreur lors de la récupération des missions:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des missions',
            message: error.message
        });
    }
});

// Obtenir la signature pour une mission
router.post('/signature', async (req, res) => {
    try {
        const { address, heroId, win, itemIds, missionId } = req.body;
        
        // Vérifier les paramètres
        if (!address || !heroId || win === undefined || !itemIds || !missionId) {
            return res.status(400).json({ error: 'Paramètres manquants' });
        }

        // Obtenir la signature
        const signature = await oracle.signMission(
            address,
            heroId,
            win,
            itemIds,
            missionId
        );

        res.json({ signature });
    } catch (error) {
        console.error('Erreur lors de la signature:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route pour résoudre une mission
router.post('/resolve', async (req, res) => {
    try {
        console.log('Requête de résolution de mission reçue:', req.body);
        
        const { address, heroId, missionId, heroStats } = req.body;
        
        // Validation des paramètres
        if (!address || !heroId || !missionId || heroStats === undefined) {
            console.error('Paramètres manquants:', { address, heroId, missionId, heroStats });
            return res.status(400).json({
                error: 'Paramètres manquants',
                required: ['address', 'heroId', 'missionId', 'heroStats'],
                received: { address, heroId, missionId, heroStats }
            });
        }

        console.log('Début de la résolution de la mission...');
        const result = await oracle.resolveMission(address, heroId, missionId, heroStats);
        console.log('Mission résolue avec succès:', result);
        
        res.json(result);
    } catch (error) {
        console.error('Erreur détaillée lors de la résolution de la mission:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        res.status(500).json({
            error: 'Erreur lors de la résolution de la mission',
            message: error.message,
            details: error.stack
        });
    }
});

// Route pour obtenir les résultats des missions
router.get('/results', async (req, res) => {
    try {
        console.log('Requête pour obtenir les résultats des missions');
        const resultsPath = path.join(__dirname, '../config/missionResults.json');
        console.log('Chemin du fichier:', resultsPath);
        
        let results = { results: [] };
        
        try {
            console.log('Tentative de lecture du fichier...');
            const data = await fs.readFile(resultsPath, 'utf8');
            console.log('Fichier lu avec succès');
            results = JSON.parse(data);
            console.log('Données parsées:', results);
        } catch (error) {
            console.log('Fichier non trouvé, création d\'un nouveau fichier');
            // Si le fichier n'existe pas, on le crée
            await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
            console.log('Nouveau fichier créé');
        }
        
        console.log('Envoi de la réponse avec les résultats');
        res.json(results);
    } catch (error) {
        console.error('Erreur détaillée lors de la récupération des résultats:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        res.status(500).json({
            error: 'Erreur lors de la récupération des résultats',
            message: error.message,
            details: error.stack
        });
    }
});

// Route pour mettre à jour le statut d'une mission
router.post('/update-status', async (req, res) => {
    try {
        const { missionId, status, transactionHash, error, retryCount } = req.body;
        
        const resultsPath = path.join(__dirname, '../config/missionResults.json');
        let results = { results: [] };
        
        try {
            const data = await fs.readFile(resultsPath, 'utf8');
            results = JSON.parse(data);
        } catch (error) {
            return res.status(404).json({
                error: 'Aucun résultat trouvé',
                message: error.message
            });
        }
        
        // Trouver la mission à mettre à jour
        const missionIndex = results.results.findIndex(r => r.missionId === missionId);
        if (missionIndex === -1) {
            return res.status(404).json({
                error: 'Mission non trouvée',
                message: `Aucune mission trouvée avec l'ID ${missionId}`
            });
        }
        
        // Mettre à jour le statut
        results.results[missionIndex] = {
            ...results.results[missionIndex],
            transactionStatus: status,
            lastAttempt: Date.now(),
            retryCount: retryCount || 0,
            error: error || null,
            transactionHash: transactionHash || null
        };
        
        // Sauvegarder les modifications
        await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
        
        res.json({
            success: true,
            message: 'Statut mis à jour avec succès',
            mission: results.results[missionIndex]
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        res.status(500).json({
            error: 'Erreur lors de la mise à jour du statut',
            message: error.message
        });
    }
});

// Route pour mettre à jour la signature d'une mission
router.post('/update-signature', async (req, res) => {
    try {
        const { missionId, signature, address } = req.body;
        console.log('Mise à jour de la signature pour la mission:', { missionId, address });

        const resultsPath = path.join(__dirname, '../config/missionResults.json');
        let results = { results: [] };
        
        try {
            const data = await fs.readFile(resultsPath, 'utf8');
            results = JSON.parse(data);
        } catch (error) {
            console.error('Erreur lors de la lecture du fichier:', error);
            return res.status(500).json({ success: false, error: 'Erreur lors de la lecture du fichier' });
        }

        // Filtrer les missions en attente pour cette adresse
        const pendingMissions = results.results.filter(
            mission => mission.address.toLowerCase() === address.toLowerCase() && 
                      mission.transactionStatus === 'pending'
        );

        console.log(`Nombre de missions en attente trouvées: ${pendingMissions.length}`);

        // Mettre à jour les missions en attente
        results.results = results.results.filter(
            mission => !(mission.address.toLowerCase() === address.toLowerCase() && 
                        mission.transactionStatus === 'pending')
        );

        // Sauvegarder les modifications
        await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
        console.log('Fichier mis à jour avec succès');

        res.json({ 
            success: true, 
            message: `${pendingMissions.length} mission(s) supprimée(s)`,
            deletedMissions: pendingMissions.length
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la signature:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Route pour récupérer le texte de la mission
router.get('/text/:missionId', (req, res) => {
    try {
        const missionId = parseInt(req.params.missionId);
        const mission = missionsConfig.missions.find(m => m.id === missionId);
        
        if (!mission) {
            return res.status(404).json({ error: 'Mission non trouvée' });
        }

        // Récupérer le contexte de la mission
        const context = mission.contexte || [];
        
        res.json({ context });
    } catch (error) {
        console.error('Erreur lors de la récupération du texte de la mission:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour supprimer un résultat de mission
router.delete('/results/:missionId', async (req, res) => {
    try {
        const { missionId } = req.params;
        console.log('Requête pour supprimer le résultat de la mission:', missionId);
        
        const resultsPath = path.join(__dirname, '../config/missionResults.json');
        let results = { results: [] };
        
        try {
            const data = await fs.readFile(resultsPath, 'utf8');
            results = JSON.parse(data);
        } catch (error) {
            return res.status(404).json({
                error: 'Aucun résultat trouvé',
                message: error.message
            });
        }
        
        // Filtrer les résultats pour exclure la mission spécifiée
        results.results = results.results.filter(r => r.missionId !== parseInt(missionId));
        
        // Sauvegarder les modifications
        await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
        
        res.json({
            success: true,
            message: 'Résultat supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression du résultat:', error);
        res.status(500).json({
            error: 'Erreur lors de la suppression du résultat',
            message: error.message
        });
    }
});

module.exports = router; 