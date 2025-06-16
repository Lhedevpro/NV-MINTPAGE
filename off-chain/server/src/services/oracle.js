const ethers = require('ethers');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();
const missionsConfig = require('../config/missions.json');

// ABI minimal pour la fonction ownerOf
const HERO_NFT_ABI = [
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function getHeroStatsRaw(uint256 tokenId) view returns (uint8, uint8, uint8, uint8, uint8, uint8, uint8, uint16, bool, uint8)"
];

// ABI pour le contrat Codex
const CODEX_ABI = [
    "function getHeroInventory(uint256 heroId) view returns (uint8[20])",
    "function tryMission(address) external",
    "function resolveMission(uint256 heroId, bool win, uint8[20] calldata itemIds, uint8 difficulty, uint256 timestamp, bytes calldata signature) external payable"
];

class OracleService {
    constructor() {
        // Vérifier la présence de la clé privée
        if (!process.env.ORACLE_PRIVATE_KEY) {
            throw new Error('ORACLE_PRIVATE_KEY missing in .env file');
        }

        // Vérifier le format de la clé privée
        if (!process.env.ORACLE_PRIVATE_KEY.startsWith('0x')) {
            throw new Error('ORACLE_PRIVATE_KEY must start with 0x');
        }

        try {
            this.privateKey = process.env.ORACLE_PRIVATE_KEY;
            this.wallet = new ethers.Wallet(this.privateKey);
            
            // Initialiser le provider avec l'URL RPC de MEGA Testnet
            const rpcUrl = process.env.RPC_URL || 'https://carrot.megaeth.com/rpc';
            console.log('Initializing provider with URL:', rpcUrl);
            
            this.provider = new ethers.JsonRpcProvider(rpcUrl);
            
            // Vérifier la connexion au provider
            this.provider.getNetwork().then(network => {
                console.log('Connected to network:', {
                    chainId: network.chainId,
                    name: network.name
                });
            }).catch(error => {
                console.error('Error connecting to network:', error);
                throw new Error('Unable to connect to Ethereum network');
            });

            this.heroNFT = new ethers.Contract(
                process.env.HERO_NFT_ADDRESS,
                HERO_NFT_ABI,
                this.provider
            );
            console.log('HeroNFT contract initialized with address:', process.env.HERO_NFT_ADDRESS);

            this.codexWrite = new ethers.Contract(
                process.env.CODEX_ADDRESS,
                CODEX_ABI,
                this.wallet.connect(this.provider)
            );
            
            this.codex = new ethers.Contract(
                process.env.CODEX_ADDRESS,
                CODEX_ABI,
                this.provider
            );
            console.log('Codex contract initialized with address:', process.env.CODEX_ADDRESS);
            
            // Vérifier que les contrats sont bien initialisés
            if (!this.codex || !this.heroNFT) {
                throw new Error('Error initializing contracts');
            }
            
            console.log('Oracle initialized successfully');
        } catch (error) {
            console.error('Error during oracle initialization:', error);
            throw new Error('Invalid private key');
        }
    }

    // Obtenir les détails d'une mission
    getMissionDetails(missionId) {
        const mission = missionsConfig.missions.find(m => m.id === missionId);
        if (!mission) {
            throw new Error(`Mission ${missionId} not found`);
        }
        return mission;
    }

    // Vérifier si l'adresse est propriétaire du token
    async verifyHeroOwnership(address, heroId) {
        try {
            const owner = await this.heroNFT.ownerOf(heroId);
            if (owner.toLowerCase() !== address.toLowerCase()) {
                throw new Error(`Address ${address} is not the owner of Hero #${heroId}`);
            }
            return true;
        } catch (error) {
            if (error.message.includes('ERC721: invalid token ID')) {
                throw new Error(`Hero #${heroId} does not exist`);
            }
            throw error;
        }
    }

    // Récupérer la stat du Hero
    async getHeroStat(heroId, statIndex) {
        try {
            const stats = await this.heroNFT.getHeroStatsRaw(heroId);
            return stats[statIndex + 1];
        } catch (error) {
            throw new Error(`Error retrieving Hero #${heroId} stats: ${error.message}`);
        }
    }

    // Vérifier si le pathStats est valide pour la mission
    verifyPathStats(pathStats, requiredStats) {
        if (pathStats < 0 || pathStats > 5) {
            throw new Error('Invalid stat. Must be between 0 (STR) and 5 (LCK)');
        }
        if (!requiredStats[pathStats]) {
            const statNames = ['STR', 'DEX', 'INT', 'VIT', 'CHA', 'LCK'];
            throw new Error(`Stat ${statNames[pathStats]} is not required for this mission`);
        }
        return true;
    }

    // Récupérer l'inventaire du Hero
    async getHeroInventory(heroId) {
        try {
            console.log('Attempting to retrieve inventory for Hero #', heroId);
            if (!this.codex) {
                throw new Error('Codex contract is not initialized');
            }
            const inventory = await this.codex.getHeroInventory(heroId);
            console.log('Inventory retrieved:', inventory);
            
            if (!Array.isArray(inventory) || inventory.length !== 20) {
                throw new Error(`Invalid inventory format: ${JSON.stringify(inventory)}`);
            }
            
            const formattedInventory = inventory.map(item => Number(item));
            console.log('Formatted inventory:', formattedInventory);
            
            return formattedInventory;
        } catch (error) {
            console.error('Detailed error during inventory retrieval:', error);
            throw new Error(`Error retrieving Hero #${heroId} inventory: ${error.message}`);
        }
    }

    // Calculer les bonus d'items
    calculateItemBonuses(inventory, statType, index, maxindex) {
        let bonus = 0;
        
        // Exemple de logique de bonus d'items
        // Items 0-2: Bonus de STR
        if (inventory[statType] > 0) { 
            bonus = bonus + 10;
            inventory[statType] = inventory[statType] - 1;
        }
        if (inventory[6] > 0 && index == 0) {    
            bonus = bonus + 10;
            inventory[6] = inventory[6] - 1;
        }
        if (inventory[7] > 0 && index == maxindex) {    
            bonus = bonus + 10;
            inventory[7] = inventory[7] - 1;
        }
        if (inventory[8] > 0 && index != 0 && index != maxindex) {    
            bonus = bonus + 15;
            inventory[8] = inventory[8] - 1;
        }
        if (inventory[9] > 0) {
            bonus = bonus + 20;
            inventory[9] = inventory[9] - 1;
        }
        return bonus;
    }

    // Calculer le résultat d'une mission
    calculateMissionResult(heroStat, statIndex, mission, inventory) {
        let winstep = [];
        let difficulty;
        let countwin = 0;
        
        // Convertir heroStat en nombre
        const heroStatNumber = Number(heroStat);
        
        for (let i = 0; i < mission.totalsteps; i++) {
            console.log('i:__________________', i, '__________________');
            difficulty = 40 + (mission.difficulty - 1) * 20;
            const random = Math.random() * 100;
            console.log('difficulty:', difficulty, 'random:', random);
            difficulty = difficulty - heroStatNumber / 2;
            console.log('difficulty:', difficulty, 'random:', random);
            difficulty = difficulty - this.calculateItemBonuses(inventory, statIndex, i, mission.totalsteps);
            console.log('difficulty:', difficulty, 'random:', random);
            if (heroStatNumber >= mission.test[i]) {
                difficulty = difficulty - mission.bonus[i];
                console.log('difficulty:', difficulty, 'bonus:', mission.bonus[i]);
            }
            console.log('difficulty:', difficulty, 'random:', random);
            if (random > difficulty) {
                winstep.push(true);
                countwin++;
            } else {
                winstep.push(false);
            }
        }
        console.log('countwin:', countwin, 'requireresult:', mission.requireresult);
        if (countwin > mission.requireresult) {
            console.log('win:', true);
            return {
                win: true,
                winstep: winstep,
            };
        } else {
            console.log('win:', false);
            return {
                win: false,
                winstep: winstep,
            };
        }
    }

    async updateInventory(resultwinstep, difficulty, win, inventory) {
        for (let i = 0; i < resultwinstep.length; i++) {
            if (resultwinstep[i]) {
            const randomIncrease = Math.floor(Math.random() * 11); // Générer un nombre aléatoire entre 0 et 10
            inventory[randomIncrease] = inventory[randomIncrease] + 1; // Augmenter l'inventaire à l'index i
            }
            if (win) {
                const randomIncrease = Math.floor(Math.random() * 11); // Générer un nombre aléatoire entre 0 et 10
                inventory[randomIncrease] = inventory[randomIncrease] + 1; // Augmenter l'inventaire à l'index i
                if (difficulty == 1) {
                    inventory[randomIncrease] = inventory[randomIncrease] + 1; // Augmenter l'inventaire à l'index i
                }
                if (difficulty == 2) {
                    inventory[randomIncrease] = inventory[randomIncrease] + 1; // Augmenter l'inventaire à l'index i
                }
                if (difficulty == 3) {
                    inventory[randomIncrease] = inventory[randomIncrease] + 1; // Augmenter l'inventaire à l'index i
                }
                if (difficulty == 4) {
                    inventory[randomIncrease] = inventory[randomIncrease] + 2; // Augmenter l'inventaire à l'index i
                }
                if (difficulty == 5) {
                    inventory[randomIncrease + 10] = inventory[randomIncrease + 10] + 1; // Augmenter l'inventaire à l'index i
                }
                if (difficulty == 6) {
                    inventory[randomIncrease + 10] = inventory[randomIncrease + 10] + 1; // Augmenter l'inventaire à l'index i
                }
                if (difficulty == 7) {
                    inventory[randomIncrease + 10] = inventory[randomIncrease + 10] + 1; // Augmenter l'inventaire à l'index i
                }
            }
        }
        return inventory;
    }


    // Sauvegarder le résultat d'une mission
    async saveMissionResult(result) {
        try {
            const resultsPath = path.join(__dirname, '../config/missionResults.json');
            let results = { results: [] };
            
            try {
                const data = await fs.readFile(resultsPath, 'utf8');
                results = JSON.parse(data);
            } catch (error) {
                // Si le fichier n'existe pas, on le crée
                await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
            }
            
            // Vérifier s'il existe déjà un enregistrement « pending » pour la même adresse/hero/mission
            const existingIndex = results.results.findIndex(r =>
                r.address.toLowerCase() === result.address.toLowerCase() &&
                r.heroId === result.heroId &&
                r.missionId === result.missionId &&
                r.transactionStatus === 'pending'
            );

            const newEntry = {
                address: result.address,
                heroId: result.heroId,
                missionId: result.missionId,
                timestamp: Date.now(),
                transactionStatus: 'pending',
                retryCount: 0,
                lastAttempt: null,
                error: null,
                statUsed: result.heroStats,
                stepResults: result.result.winstep,
                // Données pour la signature
                transactionData: {
                    heroId: result.heroId,
                    win: result.result.win,
                    itemIds: result.inventory,
                    difficulty: result.mission.difficulty,
                    timestamp: Math.floor(Date.now() / 1000),
                    signature: result.signature,
                    value: "0.0002" // TRIBUTE_FEE en ETH
                }
            };

            if (existingIndex !== -1) {
                // Remplacer l'enregistrement existant
                results.results[existingIndex] = newEntry;
            } else {
                // Ajouter un nouvel enregistrement
                results.results.push(newEntry);
            }

            // Sauvegarder le fichier
            await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du résultat:', error);
            throw error;
        }
    }

    // Résoudre une mission et générer la signature
    async resolveMission(address, heroId, missionId, heroStats) {
        try {
            console.log('Starting mission resolution with parameters:', { 
                address, 
                heroId, 
                missionId, 
                heroStats,
                timestamp: new Date().toISOString()
            });
            
            if (!ethers.isAddress(address)) {
                return {
                    success: false,
                    message: 'Invalid address'
                };
            }

            console.log('Verifying Hero ownership...');
            try {
                const ownershipVerified = await this.verifyHeroOwnership(address, heroId);
                if (!ownershipVerified) {
                    return {
                        success: false,
                        message: 'Hero ownership not verified'
                    };
                }
            } catch (error) {
                return {
                    success: false,
                    message: `Ownership verification error: ${error.message}`
                };
            }
            console.log('Hero ownership verified');

            console.log('Retrieving mission details...');
            let mission;
            try {
                mission = this.getMissionDetails(missionId);
            } catch (error) {
                return {
                    success: false,
                    message: `Error retrieving mission details: ${error.message}`
                };
            }
            console.log('Mission details retrieved:', mission);

            console.log('Verifying stats...');
            try {
                const isValid = this.verifyPathStats(heroStats, mission.requiredStats);
                if (!isValid) {
                    return {
                        success: false,
                        message: 'Stats path is not valid for this mission'
                    };
                }
            } catch (error) {
                return {
                    success: false,
                    message: `Stats verification error: ${error.message}`
                };
            }
            console.log('Stats verified');

            console.log('Retrieving Hero stat...');
            let heroStat;
            try {
                heroStat = await this.getHeroStat(heroId, heroStats);
            } catch (error) {
                return {
                    success: false,
                    message: `Error retrieving Hero stat: ${error.message}`
                };
            }
            console.log('Hero stat retrieved:', heroStat);

            console.log('Retrieving Hero inventory...');
            let inventory;
            try {
                inventory = await this.getHeroInventory(heroId);
            } catch (error) {
                return {
                    success: false,
                    message: `Error retrieving inventory: ${error.message}`
                };
            }
            console.log('Inventory initialized:', inventory);

            console.log('Calculating mission result...');
            let result;
            try {
                result = this.calculateMissionResult(heroStat, heroStats, mission, inventory);
            } catch (error) {
                return {
                    success: false,
                    message: `Error calculating result: ${error.message}`
                };
            }
            console.log('Mission result calculated:', result);

            console.log('updating inventory...');
            try {
                inventory = await this.updateInventory(result.winstep, mission.difficulty, result.win, inventory);
                console.log('inventory updated successfully');
            } catch (error) {
                return {
                    success: false,
                    message: `Error updating inventory: ${error.message}`
                };
            }

            // Générer le timestamp et signer APRÈS la mise à jour de l'inventaire
            const timestamp = Math.floor(Date.now() / 1000);
            console.log('Timestamp generated:', timestamp);

            console.log('Creating hash with UPDATED inventory...');
            let hash;
            try {
                // Log détaillé pour debug
                console.log('[DEBUG HASH] address:', address);
                console.log('[DEBUG HASH] heroId:', heroId);
                console.log('[DEBUG HASH] win:', result.win);
                console.log('[DEBUG HASH] inventory:', inventory);
                console.log('[DEBUG HASH] difficulty:', mission.difficulty);
                hash = ethers.keccak256(
                    ethers.solidityPacked(
                        ['address', 'uint256', 'bool', 'uint8[20]', 'uint8'],
                        [address, heroId, result.win, inventory, mission.difficulty]
                    )
                );
                console.log('[DEBUG HASH] JS hash:', hash);
            } catch (error) {
                return {
                    success: false,
                    message: `Error creating hash: ${error.message}`
                };
            }
            console.log('Hash generated:', hash);

            console.log('Signing hash...');
            let signature;
            try {
                signature = await this.wallet.signMessage(ethers.getBytes(hash));
                console.log('Signature generated:', signature);
            } catch (error) {
                return {
                    success: false,
                    message: `Error signing: ${error.message}`
                };
            }
            
            try {
                console.log('Calling tryMission on Codex contract...');
                await this.codexWrite.tryMission(address);
                console.log('tryMission function called successfully');
            } catch (error) {
                return {
                    success: false,
                    message: 'Error calling tryMission',
                    error: error.message
                };
            }

            console.log('Saving result...');
            try {
                await this.saveMissionResult({
                    signature,
                    result,
                    heroStats,
                    heroId,
                    missionId,
                    address,
                    inventory,
                    mission
                });
            } catch (error) {
                return {
                    success: false,
                    message: `Error saving result: ${error.message}`
                };
            }

            return {
                success: true,
                data: {
                    win: result.win,
                    itemIds: inventory,
                    timestamp,
                    signature,
                    mission: mission.name,
                    difficulty: mission.difficulty
                }
            };

        } catch (error) {
            console.error('Detailed error during mission resolution:', {
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            return {
                success: false,
                message: `Unexpected error: ${error.message}`
            };
        }
    }
}

module.exports = new OracleService(); 