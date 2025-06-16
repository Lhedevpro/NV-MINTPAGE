import { ethers } from "ethers";
import RewardHeroNFT from "./contracts/RewardHeroNFT.json";

// Adresses des contrats sur MEGA Testnet
const HERO_NFT_ADDRESS = "0xb49dc7eD950520E397c8D97f82F27B50808FC2db";
const CODEX_ADDRESS = "0x99830c1bD1Ed759eE81dFa39412e2f730228feeC";

// ABI minimal pour le contrat Codex
const CODEX_ABI = [
    "function getHeroInventory(uint256 heroId) view returns (uint8[20])",
    "function getHeroRecord(uint256 heroId) view returns (uint16[7] memory victories, uint16 defeats)",
    "function resolveMission(uint256 heroId, bool win, uint8[20] calldata itemIds, uint8 difficulty, uint256 timestamp, bytes calldata signature) external payable"
];

export const getContract = async () => {
    if (typeof window.ethereum === 'undefined') {
        throw new Error("Please install MetaMask");
    }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
    const contract = new ethers.Contract(
        HERO_NFT_ADDRESS,
        RewardHeroNFT.abi,
        signer
    );
        return contract;
};

export const getCodexContract = async () => {
    if (typeof window.ethereum === 'undefined') {
        throw new Error("Please install MetaMask");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(
        CODEX_ADDRESS,
        CODEX_ABI,
        signer
    );
    return contract;
};
