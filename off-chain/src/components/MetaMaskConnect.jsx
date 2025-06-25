import React, { useState } from 'react';
import { useMetaMask } from '../context/MetaMaskContext';

const MetaMaskConnect = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const { isConnected, account, connect } = useMetaMask();

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');

    try {
      await connect();
    } catch (error) {
      console.error('Connection error:', error);
      if (error.code === 4001) {
        setError('Connection cancelled by the user.');
      } else if (error.message.includes('MetaMask is not installed')) {
        setError('MetaMask is not installed. Please install MetaMask to continue.');
      } else {
        setError('Error connecting to MetaMask. Please try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="metamask-connect">
      <div className="connect-container">
        <div className="connect-header">
          <img src="/imgs/Logo.png" alt="Neon Verge Logo" className="connect-logo" />
          <h1>Welcome to Neon Verge</h1>
          <p>Connect with MetaMask to access the universe</p>
        </div>

        <div className="connect-content">
          {!isConnected ? (
            <div className="connect-actions">
              <button 
                className="connect-button"
                onClick={handleConnect}
                disabled={isConnecting}
              >
                {isConnecting ? 'Connecting...' : 'Connect with MetaMask'}
              </button>
              
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
              
              <div className="metamask-info">
                <p>Don't have MetaMask?</p>
                <a 
                  href="https://metamask.io/download/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="metamask-link"
                >
                  Download MetaMask
                </a>
              </div>
            </div>
          ) : (
            <div className="connected-status">
              <div className="success-message">
                <p>✅ Successfully connected!</p>
                <p className="account-address">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetaMaskConnect; 