import { useMetaMask } from '../context/MetaMaskContext';

export const useMetaMaskConnection = () => {
  const { isConnected, account, isLoading, connect, disconnect } = useMetaMask();

  const getShortAddress = () => {
    if (!account) return '';
    return `${account.slice(0, 6)}...${account.slice(-4)}`;
  };

  const isWalletConnected = () => {
    return isConnected && account;
  };

  return {
    isConnected,
    account,
    isLoading,
    connect,
    disconnect,
    getShortAddress,
    isWalletConnected
  };
}; 