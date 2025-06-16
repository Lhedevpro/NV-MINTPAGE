import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import RewardHeroNFT from '../contracts/RewardHeroNFT.json';
import { getContract, getCodexContract } from '../connect';
import axios from 'axios';
import './Codex.css';
import Terminal from './Codex/Terminal';
import TerminalMobile from './Codex/TerminalMobile';
import HeroInfo from './Codex/HeroInfo';
import Inventory from './Codex/Inventory';
import MissionList from './Codex/MissionList';
import StatSelection from './Codex/StatSelection';
import { getClass } from '../utils/heroUtils';
import { getItemName, getItemValue, calculatePoints } from '../utils/inventoryUtils';
import { statNames } from '../utils/statUtils';

const STRINGS = {
    LOADING: 'Loading...',
    CONNECT_METAMASK: 'Connect Metamask',
    HERO_LOADING: 'Loading hero information...',
    MISSION_LAUNCH: 'Launching mission',
    SIGNATURE_PENDING: 'Signature pending - Mission',
    NO_MISSION: 'No mission selected',
    STAT_NOT_ALLOWED: 'This stat is not allowed for this mission',
    MISSION_NOT_FOUND: 'Mission not found',
    ERROR_MISSION: 'Error while resolving the mission:',
    ERROR_CONTEXT: 'No context scenes found',
    ERROR_SUCCESS: 'No success scenes found',
    ERROR_FAILURE: 'No failure scenes found',
    ERROR_MISSION_DATA: 'No mission data found',
    TERMINAL_CLOSE: 'Closing terminal...',
    MISSION_END: 'End of mission, returning to list',
    TYPING_IGNORED: 'Typing in progress, action ignored',
    CONTEXT_INITIAL: 'Click on Continue, displaying initial context',
    CONTEXT_PHASE: 'Context phase, displaying scene',
    PENDING_MISSION: 'Pending missions found',
    MISSION_SELECTED: 'Mission selected'
};

// Composant pour les points de suspension animés
const LoadingDots = ({ message = "Loading" }) => (
    <div className="loading-dots-centered">
        <img src="/imgs/Logo.png" alt="Neon Verge Logo" className="App-logo" style={{ height: '160px', marginBottom: '2rem', marginTop: 0 }} />
        <div>
            {message}
            <span className="dot">.</span>
            <span className="dot">.</span>
            <span className="dot">.</span>
        </div>
    </div>
);

function Codex() {
    const [account, setAccount] = useState(null);
    const [hasHero, setHasHero] = useState(false);
    const [heroStats, setHeroStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [heroName, setHeroName] = useState('');
    const [isMobile, setIsMobile] = useState(false);
    const [slots, setSlots] = useState(Array(10).fill(null));
    const [codexContract, setCodexContract] = useState(null);
    const [selectedMission, setSelectedMission] = useState(null);
    const [missionResult, setMissionResult] = useState(null);
    const [heroRecords, setHeroRecords] = useState({ victories: [0, 0, 0, 0, 0, 0, 0], defeats: 0 });
    const [availableMissions, setAvailableMissions] = useState([]);
    const [randomMissions, setRandomMissions] = useState([]);
    const [showStats, setShowStats] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState(null);
    const [apiTestResult, setApiTestResult] = useState(null);
    const [missionText, setMissionText] = useState([]);
    const [currentTextIndex, setCurrentTextIndex] = useState(-1);
    const [missionScenes, setMissionScenes] = useState([]);
    const [goodScenes, setGoodScenes] = useState([]);
    const [badScenes, setBadScenes] = useState([]);
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
    const [isContextPhase, setIsContextPhase] = useState(true);
    const [stepResults, setStepResults] = useState([]);
    const [pendingMissions, setPendingMissions] = useState([]);
    const [showTerminal, setShowTerminal] = useState(false);
    const [terminalContent, setTerminalContent] = useState('');
    const [savedMissionResults, setSavedMissionResults] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isReadingContext, setIsReadingContext] = useState(false);
    const [missionData, setMissionData] = useState(null);
    const [indexScene, setIndexScene] = useState(-1);
    const [indexPhrase, setIndexPhrase] = useState(0);
    const [isSceneComplete, setIsSceneComplete] = useState(false);
    const [selectedStat, setSelectedStat] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [missionScreens, setMissionScreens] = useState([]);
    const [currentSceneImage, setCurrentSceneImage] = useState(null);

    // Ajout d'un intervalle pour vérifier les signatures en attente
    useEffect(() => {
        const checkPendingSignatures = async () => {
            if (account) {
                try {
                    const response = await axios.get('http://localhost:3001/mission/results');
                    if (response.data && response.data.results) {
                        const userAddress = account.toLowerCase();
                        const pendingMissionsForUser = response.data.results
                            .filter(mission => 
                                mission.address.toLowerCase() === userAddress && 
                                mission.transactionStatus === 'pending'
                            )
                            .sort((a, b) => b.timestamp - a.timestamp);
                        
                        setPendingMissions(pendingMissionsForUser);
                    }
                } catch (error) {
                    console.error('Erreur lors de la vérification des signatures:', error);
                }
            }
        };

        // Vérifier immédiatement
        checkPendingSignatures();

        // Configurer l'intervalle de vérification (toutes les 5 secondes)
        const intervalId = setInterval(checkPendingSignatures, 5000);

        // Nettoyer l'intervalle lors du démontage du composant
        return () => clearInterval(intervalId);
    }, [account]); // Dépendance à account pour reconfigurer l'intervalle si l'adresse change

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1600);
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const switchToMegaeth = async () => {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x18c6' }]
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x18c6',
                        chainName: 'MEGA Testnet',
                        nativeCurrency: {
                            name: 'MEGA Testnet Ether',
                            symbol: 'ETH',
                            decimals: 18
                        },
                        rpcUrls: ['https://carrot.megaeth.com/rpc'],
                        blockExplorerUrls: ['https://megaexplorer.xyz']
                    }]
                });
            } else {
                throw switchError;
            }
        }
    };

    const checkNetwork = async () => {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        if (network.chainId !== 31337n) {
            await switchToMegaeth();
        }
    };

    const connectWallet = async () => {
        try {
            if (!window.ethereum) {
                throw new Error("Please install Metamask");
            }
            if (typeof window.ethereum === 'undefined') {
                alert("Please open this page in MetaMask mobile browser.");
            }

            await checkNetwork();

            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            if (accounts.length === 0) {
                throw new Error("No account found");
            }

            setAccount(accounts[0]);
            await checkHeroOwnership(accounts[0]);

            window.ethereum.on('accountsChanged', (newAccounts) => {
                if (newAccounts.length === 0) {
                    setAccount('');
                    setHasHero(false);
                    setHeroStats(null);
                    setSlots(Array(10).fill(0));
                } else {
                    setAccount(newAccounts[0]);
                    checkHeroOwnership(newAccounts[0]);
                }
            });

            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });

        } catch (err) {
            console.error("Connection error:", err);
            setError(err.message);
        }
    };

    const checkHeroOwnership = async (userAddress) => {
        try {
            const contract = await getContract();
            const tokenId = await contract.ownerToTokenId(userAddress);
            
            if (tokenId > 0) {
                setHasHero(true);
                await fetchHeroStats(tokenId);
            } else {
                setHasHero(false);
                setHeroStats(null);
                setSlots(Array(10).fill(0));
            }
        } catch (err) {
            console.error("Error checking hero ownership:", err);
            setError(err.message);
        }
    };

    const fetchHeroRecords = async (tokenId) => {
        try {
            const codexContract = await getCodexContract();
            const [victories, defeats] = await codexContract.getHeroRecord(tokenId);
            // Convertir les BigInt en nombres
            const victoriesArray = victories.map(v => Number(v));
            const defeatsNumber = Number(defeats);
            setHeroRecords({ victories: victoriesArray, defeats: defeatsNumber });
        } catch (err) {
            console.error("Erreur lors de la récupération des records:", err);
        }
    };

    const fetchHeroStats = async (tokenId) => {
        try {
            const contract = await getContract();
            const info = await contract.getHeroInfoById(tokenId, 0);
            const name = await contract.heroNames(tokenId);
            setHeroName(name);
            
            const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
                ['uint8', 'uint8', 'uint8', 'uint8', 'uint8', 'uint8', 'uint8', 'uint16', 'bool', 'string', 'uint8', 'uint256', 'address'],
                info
            );
            
            setHeroStats({
                class: decoded[0],
                STR: decoded[1],
                DEX: decoded[2],
                INT: decoded[3],
                VIT: decoded[4],
                CHA: decoded[5],
                LCK: decoded[6],
                imgId: decoded[7],
                isNotsoulbound: decoded[8],
                rarity: decoded[10],
                tokenId: tokenId
            });

            // Récupérer l'inventaire du héros
            try {
                const codexContract = await getCodexContract();
                const inventory = await codexContract.getHeroInventory(tokenId);
                // Convertir l'inventaire en tableau de nombres
                const inventoryArray = inventory.map(item => Number(item));
                setSlots(inventoryArray);
                // Récupérer les records du héros
                await fetchHeroRecords(tokenId);
            } catch (err) {
                console.error("Erreur lors de la récupération de l'inventaire:", err);
                setSlots(Array(10).fill(0));
            }
        } catch (err) {
            console.error("Error fetching hero stats:", err);
            setError(err.message);
        }
    };

    const rarityClass = heroStats ? `rarity-${heroStats.rarity}` : '';

    const startMission = async (missionId, abilityStyle) => {
        try {
            if (!codexContract || !heroStats) return;
            
            setLoading(true);
            const result = await codexContract.startMission(
                missionId,
                abilityStyle,
                heroStats.tokenId,
                { value: ethers.parseEther("0.01") } // Tribute à ajuster selon le contrat
            );
            
            setMissionResult(result);
            // Mettre à jour l'inventaire après la mission
            const inventory = await codexContract.getHeroInventory(heroStats.tokenId);
            setSlots(inventory);
            
        } catch (err) {
            console.error("Erreur lors de la mission:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Nouvelle fonction de chargement avec retry
    const fetchMissionsWithRetry = async (maxRetries = 3, delay = 2000) => {
        let attempt = 1;
        while (attempt <= maxRetries) {
            try {
                setIsLoading(true);
                setLoadingMessage(`Loading missions (Attempt ${attempt}/${maxRetries})`);
                const response = await axios.get('http://localhost:3001/mission/missions', {
                    timeout: 10000,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                if (!response.data || !response.data.missions) {
                    throw new Error('Format de réponse invalide');
                }
                const missions = response.data.missions;
                setAvailableMissions(missions);
                const shuffled = [...missions].sort(() => 0.5 - Math.random());
                setRandomMissions(shuffled.slice(0, 3));
                setIsLoading(false);
                setLoadingMessage('');
                setError(null);
                return;
            } catch (error) {
                console.error(`Error loading missions (attempt ${attempt}):`, error);
                if (attempt === maxRetries) {
                    setIsLoading(false);
                    setLoadingMessage('');
                    setError("Impossible de charger les missions après plusieurs tentatives. Veuillez réessayer plus tard.");
                    // Missions par défaut si tout échoue
                    const defaultMissions = [
                        {
                            id: 1,
                            name: "Western Wall Breakthrough",
                            description: "Break through a secondary checkpoint in a swift and desperate assault.",
                            difficulty: 3,
                            requiredStats: [true, false, false, false, false, false],
                            requireresult: 3,
                            totalsteps: 5,
                            test: [5, 10, 15, 10, 5],
                            bonus: [15, 20, 5, 10, 20]
                        }
                    ];
                    setAvailableMissions(defaultMissions);
                    setRandomMissions(defaultMissions);
                    return;
                }
                // Attendre avant de réessayer
                await new Promise(resolve => setTimeout(resolve, delay));
                attempt++;
            }
        }
    };

    // Remplace l'ancien selectRandomMissions
    const selectRandomMissions = () => {
        fetchMissionsWithRetry();
    };

    const handleMissionClick = async (mission) => {
        console.log('Mission sélectionnée:', mission);
        setSelectedMission(mission);
        setShowStats(true);
        setError(null);

        try {
            // Vérifier les missions en attente
            const pendingResponse = await axios.get('http://localhost:3001/mission/results');
            const pendingMissions = pendingResponse.data.results.filter(
                m => m.address.toLowerCase() === account.toLowerCase() && 
                     m.transactionStatus === 'pending'
            );

            if (pendingMissions.length > 0) {
                console.log('Missions en attente trouvées:', pendingMissions);
                setPendingMissions(pendingMissions);
                setShowTerminal(true);
                setTerminalContent(STRINGS.PENDING_MISSION);
                return;
            }

            // Charger les données de la mission pour affichage (pas de résolution ici)
            const missionResponse = await axios.get('http://localhost:3001/mission/missions');
            const completeMissionData = missionResponse.data.missions.find(m => m.id === mission.id);
            
            if (!completeMissionData) {
                throw new Error('Mission non trouvée');
            }

            setMissionData(completeMissionData);
            // NE PAS afficher le terminal ici
            // setShowTerminal(true);
            // setTerminalContent(STRINGS.MISSION_SELECTED);

        } catch (error) {
            console.error('Erreur lors de la sélection de la mission:', error);
            setError(error.message);
            setShowTerminal(false);
            setTerminalContent('');
            setSelectedMission(null);
            setShowStats(false);
        }
    };

    const checkPendingMission = async () => {
        try {
            console.log('Vérification des missions en attente...');
            const response = await axios.get('http://localhost:3001/mission/results');
            console.log('Réponse du serveur:', response.data);
            
            if (!response.data || !response.data.results) {
                console.log('Aucun résultat trouvé');
                setPendingMissions([]);
                return;
            }

            const userAddress = account?.toLowerCase();
            console.log('Adresse de l\'utilisateur:', userAddress);

            // Filtrer les missions en attente pour l'adresse de l'utilisateur
            const pendingMissionsForUser = response.data.results
                .filter(mission => 
                    mission.address.toLowerCase() === userAddress && 
                    mission.transactionStatus === 'pending'
                )
                .sort((a, b) => b.timestamp - a.timestamp); // Trier par timestamp décroissant

            // Ne garder que la dernière mission en attente
            const lastPendingMission = pendingMissionsForUser[0];
            
            console.log('Dernière mission en attente:', lastPendingMission);
            
            if (lastPendingMission) {
                setPendingMissions([lastPendingMission]);
            } else {
                setPendingMissions([]);
            }
        } catch (error) {
            console.error('Erreur détaillée lors de la vérification des missions en attente:', {
                error: error.message,
                response: error.response?.data,
                status: error.response?.status,
                stack: error.stack
            });
            setPendingMissions([]);
        }
    };

    const handlePendingMission = async (mission) => {
        try {
            setLoadingMessage(STRINGS.MISSION_LAUNCH);
            setIsLoading(true);

            // Utiliser directement l'enregistrement pending existant
            const results = mission; // contient stepResults, transactionData, etc.

            if (!results.stepResults || !Array.isArray(results.stepResults)) {
                throw new Error('Format de résultats invalide');
            }

            const missionResponse = await axios.get('http://localhost:3001/mission/missions');
            const completeMissionData = missionResponse.data.missions.find(m => m.id === mission.missionId);
            
            if (!completeMissionData) {
                throw new Error('Mission non trouvée');
            }

            // Extraire les données de transaction
            const { win, itemIds, difficulty, timestamp, signature } = results.transactionData || {};
            if (typeof win === 'undefined' || !itemIds) {
                throw new Error('Données de transaction manquantes');
            }

            try {
                // Appeler resolveMission sur le contrat
                const codexContract = await getCodexContract();
                const tx = await codexContract.resolveMission(
                    heroStats.tokenId,
                    win,
                    itemIds,
                    difficulty,
                    timestamp,
                    signature,
                    { value: ethers.parseEther("0.0002") } // TRIBUTE_FEE
                );

                await tx.wait();

                // Supprimer l'enregistrement de la mission
                try {
                    await axios.delete(`http://localhost:3001/mission/results/${mission.missionId}`);
                    console.log('Enregistrement de la mission supprimé');
                } catch (error) {
                    console.error('Erreur lors de la suppression de l\'enregistrement:', error);
                }

                const missionResults = {
                    ...results,
                    missionData: completeMissionData,
                    statUsed: statNames[mission.statUsed],
                    stepResults: results.stepResults,
                    win: win,
                    timestamp: timestamp * 1000,
                    missionName: completeMissionData.name
                };

                displayTerminalResults(missionResults);
                setIsLoading(false);
                setLoadingMessage('');
                setShowStats(false);
                setMissionData(null);
                setError(null);
                selectRandomMissions();

                setSelectedMission(prev => ({
                    ...completeMissionData,
                    statUsed: statNames[mission.statUsed]
                }));

            } catch (error) {
                console.error('Erreur lors de la transaction:', error);
                setIsLoading(false);
                setLoadingMessage('');
                setError('Erreur lors de la transaction: ' + error.message);
            }
        } catch (error) {
            console.error('Erreur lors de la résolution de la mission:', error);
            setIsLoading(false);
            setLoadingMessage('');
            setError('Erreur lors de la résolution de la mission: ' + error.message);
        }
    };

    const typeWriter = (text, index = 0) => {
        if (!text) {
            console.error('Texte manquant pour typeWriter');
            setIsTyping(false);
            return;
        }

        if (index < text.length) {
            setTerminalContent(prev => prev + text.charAt(index));
            setTimeout(() => typeWriter(text, index + 1), 10);
        } else {
            setIsTyping(false);
        }
    };

    const handleContinue = async () => {
        if (isTyping) {
            return;
        }

        if (indexScene === -1 || (missionScreens[indexScene + 1] && indexPhrase === 0)) {
            setCurrentSceneImage(`/Codex/${missionScreens[indexScene + 1]}`);
        }

        // Si c'est la première fois qu'on clique sur Continue
        if (indexScene == -1 && indexPhrase <= missionText.length) {
            console.log(STRINGS.CONTEXT_INITIAL);
            if (missionText[indexPhrase]) {
                setIsTyping(true);
                typeWriter(missionText[indexPhrase]);
                setIndexPhrase(indexPhrase + 1);
            }
            if (indexPhrase == missionText.length) {
                setIndexPhrase(0);
                setIndexScene(indexScene + 1);
                return;
            }
            return;
        } else if (indexScene > -1 && indexScene <= missionScenes.length) {
            console.log("la scene resultante est :", indexScene);
            if (!isSceneComplete) {
                // Afficher la scène
                console.log("la scene est en cours");
                setIsTyping(true);
                console.log("la c'est sense envoyer");
                typeWriter(missionScenes[indexScene][indexPhrase]);
                // Définir l'image de la scène actuelle
                if (missionScreens[indexScene + 1] && indexPhrase === 0) {
                    const imagePath = `/Codex/${missionScreens[indexScene + 1]}`;
                    console.log('Tentative de chargement de l\'image:', imagePath);
                    setCurrentSceneImage(imagePath);
                }
                setIndexPhrase(indexPhrase + 1);
                if (indexPhrase == missionScenes[indexScene].length - 1) {
                    setIndexPhrase(0);
                    setIsSceneComplete(true);
                    return;
                }
                return;
            } else {
                console.log("le resultat est en cours");
                if (!selectedMission) {
                    console.error('Mission non trouvée');
                    setError('Mission non trouvée');
                    return;
                }

                // Vérifier si stepResults existe et contient l'index actuel
                if (!stepResults || !Array.isArray(stepResults) || indexScene >= stepResults.length) {
                    console.error('stepResults invalide ou index hors limites');
                    setError('Erreur dans les résultats de la mission');
                    return;
                }

                // Choisir la scène en fonction du résultat de l'étape
                const isStepSuccess = stepResults[indexScene];
                console.log(`Étape ${indexScene}: ${isStepSuccess ? 'Succès' : 'Échec'}`);
                
                // Déterminer la stat utilisée (statKey)
                const statAbbreviations = {
                    'Strength': 'STR',
                    'Dexterity': 'DEX',
                    'Intelligence': 'INT',
                    'Vitality': 'VIT',
                    'Charisma': 'CHA',
                    'Luck': 'LCK'
                };
                let statKey = null;
                if (selectedMission && selectedMission.statUsed) {
                    statKey = statAbbreviations[selectedMission.statUsed] || selectedMission.statUsed;
                } else if (missionData && missionData.statUsed) {
                    statKey = statAbbreviations[missionData.statUsed] || missionData.statUsed;
                } else {
                    statKey = 'STR'; // fallback
                }
                const goodKey = `${statKey}goodscene`;
                const badKey = `${statKey}badscene`;
                let resultScene;
                if (isStepSuccess) {
                    resultScene = selectedMission[goodKey]?.[indexScene];
                } else {
                    resultScene = selectedMission[badKey]?.[indexScene];
                }
                
                if (resultScene && resultScene[indexPhrase]) {
                    // Afficher le résultat
                    setIsTyping(true);
                    typeWriter(resultScene[indexPhrase]);
                    // Définir l'image de la scène actuelle
                    
                    setIndexPhrase(indexPhrase + 1);
                    if (indexPhrase == resultScene.length - 1) {
                        setIndexPhrase(0);
                        setIndexScene(indexScene + 1);
                        setIsSceneComplete(false);
                        if (indexScene == missionScenes.length - 1) {
                            // Fin de la mission
                            setShowTerminal(false);
                            setTerminalContent('');
                            setMissionText([]);
                            setMissionScenes([]);
                            setStepResults([]);
                            setIndexScene(-1);
                            setIndexPhrase(0);
                            setIsSceneComplete(false);
                            setShowStats(false);
                            setCurrentSceneImage(null);
                            selectRandomMissions();
                            // On met selectedMission à null seulement après avoir tout nettoyé
                            setSelectedMission(null);
                        }
                        return;
                    }
                }
            }
        } else {
            // Fin de la mission
            setShowTerminal(false);
            setTerminalContent('');
            setMissionText([]);
            setMissionScenes([]);
            setStepResults([]);
            setIndexScene(-1);
            setIndexPhrase(0);
            setIsSceneComplete(false);
            setShowStats(false);
            setCurrentSceneImage(null);
            selectRandomMissions();
            // On met selectedMission à null seulement après avoir tout nettoyé
            setSelectedMission(null);
        }
    };

    const handleNextStep = () => {
        setCurrentStepIndex(prev => prev + 1);
        setCurrentPhraseIndex(0);
        setIsReadingContext(true);

        if (currentStepIndex + 1 < stepResults.length) {
            // Préparer la prochaine étape
            setTimeout(() => {
                setTerminalContent('');
                const nextScene = missionScenes[currentStepIndex + 1];
                if (nextScene && Array.isArray(nextScene) && nextScene.length > 0) {
                    setIsTyping(true);
                    typeWriter(nextScene[0]);
                }
            }, 1000);
        } else {
            // C'est la dernière étape, on attend un peu avant de fermer
            setTimeout(() => {
                setShowTerminal(false);
                setTerminalContent('');
                setSavedMissionResults(null);
                setSelectedMission(null);
                setShowStats(false);
                setConfirmationMessage(null);
                setMissionText([]);
                setMissionScenes([]);
                setGoodScenes([]);
                setBadScenes([]);
                setStepResults([]);
                setCurrentTextIndex(0);
                setCurrentSceneIndex(0);
                setIsContextPhase(true);
                setCurrentStepIndex(0);
                setCurrentPhraseIndex(0);
                setIsReadingContext(true);
                selectRandomMissions();
            }, 3000);
        }
    };

    const requestMissionSignature = async ({
        signer,
        missionId,
        missionName,
        win = null,
        onSigned,
        onRejected,
    }) => {
        try {
            const message = win !== null
                ? `Mission ${missionId} - ${win ? 'Victoire' : 'Défaite'}`
                : `Mission ${missionId} - ${missionName}`;

            setLoadingMessage(STRINGS.SIGNATURE_PENDING);
            setIsLoading(true);

            const signature = await signer.signMessage(message);
            await onSigned(signature);
        } catch (err) {
            console.warn("Signature refusée :", err);
            setIsLoading(false);
            setLoadingMessage('');
            if (onRejected) onRejected(err);
        }
    };

    const handleSignature = async () => {
        if (!savedMissionResults) {
            console.error('Aucun résultat de mission sauvegardé');
            return;
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            setLoadingMessage(STRINGS.SIGNATURE_PENDING);
            setIsLoading(true);

            const message = `Mission ${savedMissionResults.missionId} - ${savedMissionResults.win ? 'Victoire' : 'Défaite'}`;
            const signature = await signer.signMessage(message);

            try {
                const response = await axios.post('http://localhost:3001/mission/commit', {
                    address: account,
                    heroId: Number(heroStats.tokenId),
                    missionId: savedMissionResults.missionId,
                    signature: signature
                });

                if (response.data.success) {
                    setLoadingMessage(STRINGS.MISSION_LAUNCH);
                    const results = await waitForMissionResults(savedMissionResults.missionId);
                    
                    if (results) {
                        // Supprimer l'enregistrement de la mission
                        try {
                            await axios.delete(`http://localhost:3001/mission/results/${savedMissionResults.missionId}`);
                            console.log('Enregistrement de la mission supprimé');
                        } catch (error) {
                            console.error('Erreur lors de la suppression de l\'enregistrement:', error);
                        }

                        // Afficher les résultats
                        displayTerminalResults(results);
                        setIsLoading(false);
                        setLoadingMessage('');
                    } else {
                        throw new Error('Aucun résultat reçu de la mission');
                    }
                }
            } catch (err) {
                console.error("Erreur lors de la validation:", err);
                setIsLoading(false);
                setLoadingMessage('');
                setError(err.message);
            }
        } catch (err) {
            console.error("Erreur lors de la signature:", err);
            setIsLoading(false);
            setLoadingMessage('');
            setShowTerminal(false);
            setTerminalContent('');
            setSavedMissionResults(null);
            setError(err.message);
            setPendingMissions([]);
        }
    };

    const handleStatSelection = async (statIndex) => {
        console.log('Stat sélectionnée:', statIndex);
        
        if (!selectedMission) {
            console.error('Aucune mission sélectionnée');
            setError('Aucune mission sélectionnée');
            return;
        }
        
        if (!selectedMission.requiredStats[statIndex]) {
            console.error('Cette stat n\'est pas autorisée pour cette mission');
            setError('Cette stat n\'est pas autorisée pour cette mission');
            return;
        }

        try {
            setLoadingMessage(STRINGS.SIGNATURE_PENDING);
            setIsLoading(true);

            // D'abord résoudre la mission
            const response = await axios.post('http://localhost:3001/mission/resolve', {
                address: account,
                heroId: Number(heroStats.tokenId),
                missionId: selectedMission.id,
                heroStats: statIndex
            });

            console.log('Résultat de la mission:', response.data);

            // Attendre les résultats
            const results = await waitForMissionResults(selectedMission.id);
            console.log('Résultats finaux:', results);

            if (!results) {
                throw new Error('Aucun résultat reçu de la mission');
            }

            if (!results.stepResults || !Array.isArray(results.stepResults)) {
                throw new Error('Format de résultats invalide');
            }

            const missionResponse = await axios.get('http://localhost:3001/mission/missions');
            const completeMissionData = missionResponse.data.missions.find(m => m.id === selectedMission.id);
            
            if (!completeMissionData) {
                throw new Error('Mission non trouvée');
            }

            // Extraire les données de transaction
            const { win, itemIds, difficulty, timestamp, signature } = results.transactionData || {};

            if (typeof win === 'undefined' || !itemIds) {
                throw new Error('Données de transaction manquantes');
            }

            try {
                // Appeler resolveMission sur le contrat
                const codexContract = await getCodexContract();
                const tx = await codexContract.resolveMission(
                    heroStats.tokenId,
                    win,
                    itemIds,
                    difficulty,
                    timestamp,
                    signature,
                    { value: ethers.parseEther("0.0002") } // TRIBUTE_FEE
                );

                // Attendre la confirmation de la transaction
                await tx.wait();

                // Supprimer l'enregistrement de la mission
                try {
                    await axios.delete(`http://localhost:3001/mission/results/${selectedMission.id}`);
                    console.log('Enregistrement de la mission supprimé');
                } catch (error) {
                    console.error('Erreur lors de la suppression de l\'enregistrement:', error);
                }

                const missionResults = {
                    ...results,
                    missionData: completeMissionData,
                    statUsed: statNames[statIndex],
                    stepResults: results.stepResults,
                    win: win,
                    timestamp: timestamp * 1000, // convertir en ms pour Date()
                    missionName: selectedMission.name
                };

                displayTerminalResults(missionResults);
                setIsLoading(false);
                setLoadingMessage('');
                setShowStats(false);
                setMissionData(null);
                setError(null);
                selectRandomMissions();

                // Ajout : stocker la stat utilisée dans selectedMission pour l'affichage dynamique
                setSelectedMission(prev => ({
                    ...completeMissionData,
                    statUsed: statNames[statIndex]
                }));

            } catch (error) {
                console.error('Erreur lors de la transaction:', error);
                setIsLoading(false);
                setLoadingMessage('');
                setError('Erreur lors de la transaction: ' + error.message);
                // NE PAS reset l'UI, laisser la mission sélectionnée pour réessayer
            }
        } catch (error) {
            console.error('Erreur lors de la résolution de la mission:', error);
            setIsLoading(false);
            setLoadingMessage('');
            setError('Erreur lors de la résolution de la mission: ' + error.message);
            // NE PAS reset l'UI, laisser la mission sélectionnée pour réessayer
        }
    };

    useEffect(() => {
        const checkMissions = async () => {
            if (hasHero && account) {
                console.log('Hero trouvé, vérification des missions en attente...');
                const hasPending = await checkPendingMission();
                console.log('Résultat de la vérification:', hasPending);
                if (!hasPending) {
                    console.log('Pas de missions en attente, chargement des nouvelles missions');
                    selectRandomMissions();
                }
            }
        };
        
        checkMissions();
    }, [hasHero, account]);

    const displayTerminalResults = (results) => {
        if (!results || !results.missionData) {
            console.error('Résultats invalides:', results);
            setError('Résultats de mission invalides');
            return;
        }

        console.log('Début displayTerminalResults avec:', results);
        
        // Initialisation des états pour le terminal
        setShowTerminal(true);
        setTerminalContent('');
        setIsTyping(true);
        setCurrentTextIndex(-1);
        setIsContextPhase(true);
        setCurrentSceneIndex(0);
        setCurrentStepIndex(0);
        setCurrentPhraseIndex(0);
        setIsReadingContext(true);
        setIndexScene(-1);
        setIndexPhrase(0);
        setIsSceneComplete(false);

        // Définir les résultats des étapes
        if (results.stepResults && Array.isArray(results.stepResults)) {
            console.log('Définition des résultats des étapes:', results.stepResults);
            setStepResults(results.stepResults);
        } else {
            console.error('Résultats des étapes invalides:', results.stepResults);
            setError('Résultats des étapes invalides');
            return;
        }

        // Détermination de la stat utilisée (STR, DEX, etc.) à partir des résultats
        const statUsed = results.statUsed;
        if (!statUsed) {
            console.error('Stat utilisée non trouvée dans les résultats');
            setError('Stat utilisée non trouvée');
            return;
        }

        console.log('Stat utilisée:', statUsed);

        // Conversion du nom français en abréviation anglaise
        const statAbbreviations = {
            'Strength': 'STR',
            'Dexterity': 'DEX',
            'Intelligence': 'INT',
            'Vitality': 'VIT',
            'Charisma': 'CHA',
            'Luck': 'LCK'
        };
        const statKey = statAbbreviations[statUsed] || statUsed;
        console.log('Clé de stat convertie:', statKey);

        // Affichage des informations de base de la mission
        const winValue = typeof results.win !== 'undefined' ? results.win : (results.transactionData ? results.transactionData.win : false);
        const missionInfo = [
            `Mission: ${results.missionName}`,
            `Difficulty: ${results.missionData.difficulty}`,
            `Stat used: ${statUsed}`,
            `Result: ${winValue ? 'Victory' : 'Defeat'}`,
            `Steps succeeded: ${results.stepResults.filter(r => r).length}/${results.stepResults.length}`,
            `Timestamp: ${new Date(results.timestamp).toLocaleString()}`,
            '\nPress Continue to start the mission...'
        ].join('\n');

        typeWriter(missionInfo);

        // Utilisation directe des données de la mission déjà récupérées
        const mission = results.missionData;
        if (mission) {
            // Définition du contexte initial
            if (mission.contexte && Array.isArray(mission.contexte)) {
                console.log('Contexte trouvé:', mission.contexte);
                setMissionText(mission.contexte);
            } else {
                console.error('Pas de contexte trouvé dans la mission');
                setMissionText([]);
            }

            // Préparation des clés pour les scènes
            const contextKey = `${statKey}contextescene`;
            const goodKey = `${statKey}goodscene`;
            const badKey = `${statKey}badscene`;
            const screenKey = `${statKey}screenscene`;

            console.log('Clés des scènes:', { contextKey, goodKey, badKey, screenKey });
            console.log('Données de la mission:', mission);

            // Récupération des scènes d'écran
            if (mission[screenKey] && Array.isArray(mission[screenKey])) {
                console.log('Scènes d\'écran trouvées:', mission[screenKey]);
                setMissionScreens(mission[screenKey]);
                // Vérifier si les images existent
                mission[screenKey].forEach((image, index) => {
                    const img = new Image();
                    img.onload = () => console.log(`Image ${image} chargée avec succès`);
                    img.onerror = () => console.error(`Erreur de chargement de l'image ${image}`);
                    img.src = `/Codex/${image}`;
                });
            } else {
                console.error('Pas de scènes d\'écran trouvées');
                setMissionScreens([]);
            }

            // Traitement des scènes de contexte
            if (mission[contextKey] && Array.isArray(mission[contextKey])) {
                console.log('Scènes de contexte trouvées:', mission[contextKey]);
                const formattedScenes = mission[contextKey].map(scene => {
                    if (Array.isArray(scene)) {
                        return scene;
                    }
                    return [scene];
                });
                console.log('Scènes de contexte formatées:', formattedScenes);
                setMissionScenes(formattedScenes);
            } else {
                console.error('Pas de scènes de contexte trouvées');
                setMissionScenes([]);
            }
        }
    };

    const closeTerminal = () => {
        console.log(STRINGS.TERMINAL_CLOSE);
        setShowTerminal(false);
        setTerminalContent('');
        setSelectedMission(null);
        setShowStats(false);
        setMissionText([]);
        setMissionScenes([]);
        setStepResults([]);
        setIndexScene(-1);
        setIndexPhrase(0);
        setIsSceneComplete(false);
        selectRandomMissions();
    };

    const waitForMissionResults = async (missionId, maxAttempts = 5) => {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                console.log(`Tentative ${attempt + 1}/${maxAttempts} de récupération des résultats...`);
                const response = await axios.get('http://localhost:3001/mission/results');
                
                if (response.data && response.data.results) {
                    const missionResult = response.data.results.find(
                        r => r.missionId === missionId && 
                        r.address.toLowerCase() === account.toLowerCase()
                    );
                    
                    if (missionResult) {
                        console.log('Résultats trouvés:', missionResult);
                        return missionResult;
                    }
                }
                
                // Attendre 2 secondes avant la prochaine tentative
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.error(`Erreur lors de la tentative ${attempt + 1}:`, error);
                if (attempt === maxAttempts - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        throw new Error('Impossible de récupérer les résultats après plusieurs tentatives');
    };

    return (
        <div className="app-container">
            <div className="background" style={{ backgroundImage: "url('/imgs/Fond.png')" }}></div>

            {isLoading ? (
                <LoadingDots message={loadingMessage || "Loading"} />
            ) : account && hasHero && (
                <>
                    <Inventory slots={slots} heroRecords={heroRecords} />

                    {confirmationMessage && (
                        <div className="confirmation-message">
                            <h3>Mission: {confirmationMessage.missionName}</h3>
                            <p>Stat choisie : {confirmationMessage.statName} ({confirmationMessage.statValue})</p>
                            {confirmationMessage.status === 'loading' && (
                                <div className="loading-dots">{STRINGS.MISSION_LAUNCH}<span>.</span><span>.</span><span>.</span></div>
                            )}
                        </div>
                    )}

                    <div className="right-panel">
                        {showTerminal ? (
                            isMobile ? (
                                <TerminalMobile
                                    content={terminalContent}
                                    isTyping={isTyping}
                                    onContinue={handleContinue}
                                    disabled={loading || isTyping}
                                    currentSceneImage={currentSceneImage}
                                />
                            ) : (
                                <Terminal
                                    content={terminalContent}
                                    isTyping={isTyping}
                                    onContinue={handleContinue}
                                    disabled={loading || isTyping}
                                    currentSceneImage={currentSceneImage}
                                />
                            )
                        ) : (
                            pendingMissions.length > 0 ? (
                                <div className="pending-mission">
                                    <button 
                                        onClick={() => handlePendingMission(pendingMissions[0])}
                                        disabled={loading}
                                        className="action-btn"
                                    >
                                        {loading ? (
                                            <span>{STRINGS.LOADING}</span>
                                        ) : (
                                            <span>
                                                {STRINGS.SIGNATURE_PENDING} {pendingMissions[0].missionId}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            ) : !showStats ? (
                                <MissionList 
                                    missions={randomMissions}
                                    onMissionClick={handleMissionClick}
                                    loading={loading}
                                />
                            ) : (
                                <StatSelection 
                                    selectedMission={selectedMission}
                                    heroStats={heroStats}
                                    onStatSelect={handleStatSelection}
                                    loading={loading}
                                />
                            )
                        )}
                    </div>

                    {/* Héros affiché en dernier, responsive */}
                    {heroStats ? (
                        isMobile ? (
                            <HeroInfo 
                                heroStats={heroStats}
                                heroName={heroName}
                                rarityClass={rarityClass}
                                isMobile={true}
                            />
                        ) : (
                            <div className="left-panel">
                                <HeroInfo 
                                    heroStats={heroStats}
                                    heroName={heroName}
                                    rarityClass={rarityClass}
                                    isMobile={false}
                                />
                            </div>
                        )
                    ) : (
                        <div className="loading-message">
                            <p>{STRINGS.HERO_LOADING}</p>
                        </div>
                    )}
                </>
            )}

            {!account && !isLoading && (
                <button onClick={connectWallet} className="explore-btn">
                    {STRINGS.CONNECT_METAMASK}
                </button>
            )}
        </div>
    );
}

export default Codex;