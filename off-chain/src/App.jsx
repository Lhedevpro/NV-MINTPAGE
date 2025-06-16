import React, { useState, useEffect } from 'react';
import Codex from './NV-CODEX/Codex';
import HeroNFT from './NV-MINT/HeroNFT';
import './App.css';

function App() {
  const [isMobile, setIsMobile] = useState(false);
  const [activePage, setActivePage] = useState('codex'); // 'codex' ou 'mint'
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // appelle immédiatement pour setup initial

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <header className="App-header2">
        <img src="/imgs/Logo.png" alt="Neon Verge Logo" className="App-logo2" />
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
