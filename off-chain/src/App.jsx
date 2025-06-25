import React, { useState, useEffect } from 'react';
import Codex from './NV-CODEX/Codex';
import HeroNFT from './NV-MINT/HeroNFT';
import MetaMaskConnect from './components/MetaMaskConnect';
import { useMetaMask } from './context/MetaMaskContext';
import './App.css';

function App() {
  const [isMobile, setIsMobile] = useState(false);
  const [activePage, setActivePage] = useState('mint'); // 'codex' ou 'mint'
  const { isConnected, account, isLoading, disconnect } = useMetaMask();
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // appelle immédiatement pour setup initial

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Si en cours de chargement, afficher un loader
  if (isLoading) {
    return (
      <div className="App" style={{ '--background-image': 'url(/imgs/Fond.jpg)' }}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Si pas connecté, afficher la page de connexion
  if (!isConnected) {
    return (
      <div className="App" style={{ '--background-image': 'url(/imgs/Fond.jpg)' }}>
        <MetaMaskConnect />
      </div>
    );
  }

  return (
    <>
      <header className="App-header2">
        <div className="header-logo-center">
          <img src="/imgs/Logo.png" alt="Neon Verge Logo" className="App-logo2" />
        </div>
        <nav className="nav-menu">
          <button 
            className={`nav-button ${activePage === 'mint' ? 'active' : ''}`}
            onClick={() => setActivePage('mint')}
          >
            Mint
          </button>
          <button 
            className={`nav-button ${activePage === 'codex' ? 'active' : ''}`}
            onClick={() => setActivePage('codex')}
          >
            Codex
          </button>
        </nav>
        <div className="wallet-info">
          <span className="account-display">
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
          <button className="disconnect-button" onClick={disconnect}>
            Disconnect
          </button>
        </div>
      </header>

      <div className="App" style={{ '--background-image': 'url(/imgs/Fond.jpg)' }}>
        <main>
          {activePage === 'codex' ? <Codex /> : <HeroNFT />}
        </main>
        <footer className="App-header">
          <p>Neon Verge © 2025</p>
          <p>
            Available for freelance Web3 missions. Reach me on&nbsp;
            <a href="https://twitter.com/UnblinkingEyeNG" target="_blank" rel="noopener noreferrer">X</a>.
          </p>
        </footer>
      </div>
    </>
  );
}

export default App;
