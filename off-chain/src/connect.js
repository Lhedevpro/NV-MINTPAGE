import { ethers } from "ethers";
import contractJson from "./contracts/RewardHeroNFT.json";

const CONTRACT_ADDRESS = "0xA55cD301A354Fdffcfa494eFD8A218440bbf227E";
const CONTRACT_ABI = contractJson.abi;

export async function getContract() {
    if (!window.ethereum) {
        throw new Error("Metamask non détecté");
    }

    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        return contract;
    } catch (error) {
        console.error("Erreur lors de la création du contrat:", error);
        throw error;
    }
}
