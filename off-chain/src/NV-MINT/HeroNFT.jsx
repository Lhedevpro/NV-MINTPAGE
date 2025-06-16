import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import RewardHeroNFT from '../contracts/RewardHeroNFT.json';
import { getContract } from '../connect';
import './HeroNFT.css';
import ScenarioSlide from './ScenarioSlide';

function HeroNFT() {
    const [account, setAccount] = useState('');
    const [hasHero, setHasHero] = useState(false);
    const [heroStats, setHeroStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [heroName, setHeroName] = useState('');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1600);
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // appelle immédiatement pour setup initial

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    


    const switchToMegaeth = async () => {
        try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x18c6' }]
    });
    } catch (switchError) {
        // si MegaETH n'est pas encore ajouté, alors on le propose
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

            console.log("Connected account:", accounts[0]);
            setAccount(accounts[0]);
            checkHeroOwnership(accounts[0]);

            window.ethereum.on('accountsChanged', (newAccounts) => {
                console.log("Account changed:", newAccounts);
                if (newAccounts.length === 0) {
                    setAccount('');
                    setHasHero(false);
                    setHeroStats(null);
                } else {
                    setAccount(newAccounts[0]);
                    checkHeroOwnership(newAccounts[0]);
                }
            });

            window.ethereum.on('chainChanged', (chainId) => {
                console.log("Network changed:", chainId);
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
            console.log("Token ID found:", tokenId.toString());
            
            if (tokenId > 0) {
                setHasHero(true);
                fetchHeroStats(tokenId);
            } else {
                setHasHero(false);
                setHeroStats(null);
            }
        } catch (err) {
            console.error("Error checking hero ownership:", err);
            setError(err.message);
        }
    };

    const fetchHeroStats = async (tokenId) => {
        try {
            const contract = await getContract();
            const info = await contract.getHeroInfoById(tokenId, 0);
            const name = await contract.heroNames(tokenId);
            setHeroName(name);
            
            // Décodage des données retournées par getHeroInfo
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
                rarity: decoded[10]
            });
        } catch (err) {
            console.error("Error fetching hero stats:", err);
            setError(err.message);
        }
    };


    const mintHero = async () => {
        try {
            setLoading(true);
            const contract = await getContract();
            const tx = await contract.mintCommonHero();
            const receipt = await tx.wait();
            
            // Le lien est fait automatiquement dans _beforeTokenTransfer
            checkHeroOwnership(account);
        } catch (err) {
            console.error("Error minting:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getClass = (classId) => {
        console.log("Class value:", classId, "Type:", typeof classId);
        const classNum = Number(classId);
        console.log("Converted value:", classNum);
        
        switch(classNum) {
            case 1:
                return "Net Runner";
            case 2:
                return "Street Brawler";
            case 3:
                return "Slicer";
            case 4:
                return "Tech Nomad";
            default:
                return `Unknown class (${classNum})`;
        }
    };

    const changeHeroName = async (newName) => {
        try {
            const contract = await getContract();
            const tokenId = await contract.ownerToTokenId(account);
            const tx = await contract.changeHeroName(tokenId, newName);
            await tx.wait();
            setHeroName(newName);
        } catch (err) {
            console.error("Error changing hero name:", err);
            setError(err.message);
        }
    };

    
    const rarityClass = heroStats ? `rarity-${heroStats.rarity}` : '';

    return (
        <div className="app-container">
            <div
                className="background"
                style={{ backgroundImage: "url('/imgs/Fond.png')" }}
            ></div>

            {!account ? (
                <div className="mint-only-view">
                    <button onClick={connectWallet} className="explore-btn">
                        Connect Metamask
                    </button>
                </div>
            ) : !hasHero ? (
                // Vue simplifiée : seulement le bouton de mint
                <div className="mint-only-view">
                    <h2 className="mint-title">Mint Your First Hero</h2>
                    <p className="mint-description">
                        You need to mint a hero before accessing the full Neon Verge experience.
                    </p>
                    <button onClick={mintHero} disabled={loading} className="explore-btn">
                        {loading ? 'Minting...' : 'Mint a Hero'}
                    </button>
                    {error && <p className="error-message">{error}</p>}
                </div>
            ) : isMobile ? (
            // Version mobile ici (utilisateur a un héros)
            hasHero && heroStats ? (
            <div className="hero-mobile">
            <h2 className="hero-name-mobile">{heroName}</h2>

            <div className={`hero-image-wrapper-mobil ${rarityClass}`}>
                <img
                src={`/imgs/${heroStats.imgId}.png`}
                alt={`Hero ${heroStats.name}`}
                className="hero-image-mobil"
                />
            </div>

            <div className="hero-stats-mobile">
                <p>Class: {getClass(heroStats.class)}</p>
                <div className="stats-grid-mobile">
                <p>STR: {heroStats.STR}</p>
                <p>DEX: {heroStats.DEX}</p>
                <p>INT: {heroStats.INT}</p>
                <p>VIT: {heroStats.VIT}</p>
                <p>CHA: {heroStats.CHA}</p>
                <p>LCK: {heroStats.LCK}</p>
                </div>
            </div>

            <button disabled={loading} className="explore-btn">
                    {'Game comming soon'}
            </button>

            <div className="hero-info-mobile">
                        <h3>What is Neon Verge?</h3>
                        <p>
                            Neon Verge is a fully on-chain cyberpunk experiment.  
                            Each minted character is a unique NFT, randomly generated with individual stats, a class, and a digital soul.
                        </p>
                        <p>
                            Your character is more than just a picture. It's a key to a future on-chain RPG.  
                            Every hero will be able to take part in missions, explore Neon Verge, collect resources, and evolve over time.
                        </p>
                        <p>
                            Actions like exploring, fighting or upgrading will be stored forever on-chain.  
                            This is your story. Not just minted. Lived. Block by block.
                        </p>
                        <p>
                            In Neon Verge, your character is soulbound — a reflection of your choices, victories, and failures.  
                            You can't sell them. You must live with them. And only by taking care of them can you rise.
                        </p>
                            <h3>What is the future of Neon Verge?</h3>
                            <p>
                                Neon Verge isn't just a mint. It's the seed of a fully on-chain cyberpunk world.
                            </p>
                            <ul>
                                <li>🧭 Player-created missions with customizable risk and rewards</li>
                                <li>🎯 Contracts and bounties set by players to hunt or help others</li>
                                <li>⚰️ A public graveyard tracking lost characters and death records</li>
                                <li>🎒 Inventory system for collecting and equipping rare digital items</li>
                                <li>🛒 A decentralized black market to trade gear, chips, and enhancements</li>
                                <li>💀 PvE and PvP mechanics: explore, survive, or dominate</li>
                                <li>🌐 A growing ecosystem of on-chain minigames and side quests</li>
                                <li>💸 Quests with real stakes, real rewards, and real consequences</li>
                                <li>🧠 Dynamic reputation system tied to your actions, alliances and betrayals</li>
                                <li>🤖 Interactive NPCs that evolve based on your choices and achievements</li>
                            </ul>
                            <p>
                                Every mission has a real cost — and real gains.  
                                Success increases your earnings, access to better missions, and in-world influence.  
                                Failures may reduce your credibility or even make you a target.
                            </p>
                            <p>
                                Reputation is persistent and public. Build trust or infamy.  
                                Form connections with AI-driven NPCs who can grant access, deny entry, or betray you.
                            </p>
                            <p>
                                This is not a simple collection.  
                                This is a playground for the brave. A system for the ruthless. A world for the legendary.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="loading-view">Loading hero data...</div>
                )
            ) : (
                // Version desktop (ton layout actuel) - utilisateur a un héros
                <>
                    <div>
                        <ScenarioSlide />
                    </div>

                    <div className="project-explainer">
                        <h3>What is Neon Verge?</h3>
                        <p>
                            Neon Verge is a fully on-chain cyberpunk experiment.  
                            Each minted character is a unique NFT, randomly generated with individual stats, a class, and a digital soul.
                        </p>
                        <p>
                            Your character is more than just a picture. It's a key to a future on-chain RPG.  
                            Every hero will be able to take part in missions, explore Neon Verge, collect resources, and evolve over time.
                        </p>
                        <p>
                            Actions like exploring, fighting or upgrading will be stored forever on-chain.  
                            This is your story. Not just minted. Lived. Block by block.
                        </p>
                        <p>
                            In Neon Verge, your character is soulbound — a reflection of your choices, victories, and failures.  
                            You can't sell them. You must live with them. And only by taking care of them can you rise.
                        </p>
                        <div className="future-neonverge">
                            <h3>What is the future of Neon Verge?</h3>
                            <p>
                                Neon Verge isn't just a mint. It's the seed of a fully on-chain cyberpunk world.
                            </p>
                            <ul>
                                <li>🧭 Player-created missions with customizable risk and rewards</li>
                                <li>🎯 Contracts and bounties set by players to hunt or help others</li>
                                <li>⚰️ A public graveyard tracking lost characters and death records</li>
                                <li>🎒 Inventory system for collecting and equipping rare digital items</li>
                                <li>🛒 A decentralized black market to trade gear, chips, and enhancements</li>
                                <li>💀 PvE and PvP mechanics: explore, survive, or dominate</li>
                                <li>🌐 A growing ecosystem of on-chain minigames and side quests</li>
                                <li>💸 Quests with real stakes, real rewards, and real consequences</li>
                                <li>🧠 Dynamic reputation system tied to your actions, alliances and betrayals</li>
                                <li>🤖 Interactive NPCs that evolve based on your choices and achievements</li>
                            </ul>
                            <p>
                                Every mission has a real cost — and real gains.  
                                Success increases your earnings, access to better missions, and in-world influence.  
                                Failures may reduce your credibility or even make you a target.
                            </p>
                            <p>
                                Reputation is persistent and public. Build trust or infamy.  
                                Form connections with AI-driven NPCs who can grant access, deny entry, or betray you.
                            </p>
                            <p>
                                This is not a simple collection.  
                                This is a playground for the brave. A system for the ruthless. A world for the legendary.
                            </p>
                        </div>
                    </div>

                    {heroStats ? (
                        <div className="left-panel">
                            <div className="hero-left">
                                <div className="hero-name-container">
                                    <h2 className="hero-name">{heroName}</h2>
                                </div>
                                <div className={`hero-image-wrapper ${rarityClass}`}>
                                    <img
                                        src={`/imgs/${heroStats.imgId}.png`}
                                        alt={`Hero ${heroStats.name}`}
                                        className="hero-image"
                                    />
                                </div>
                                <div className="hero-stats">
                                    <p>Class: {getClass(heroStats.class)}</p>
                                    <div className="stats-grid">
                                        <p>STR: {heroStats.STR}</p>
                                        <p>DEX: {heroStats.DEX}</p>
                                        <p>INT: {heroStats.INT}</p>
                                        <p>VIT: {heroStats.VIT}</p>
                                        <p>CHA: {heroStats.CHA}</p>
                                        <p>LCK: {heroStats.LCK}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="left-panel">
                            <div className="hero-left">
                                <div className="loading-view">Loading hero data...</div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default HeroNFT; 