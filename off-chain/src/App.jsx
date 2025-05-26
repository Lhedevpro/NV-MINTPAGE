
import React, { useState, useEffect } from 'react';
import HeroNFT from './components/HeroNFT';
import './App.css';

function App() {
  const [isMobile, setIsMobile] = useState(false);
  
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
    {isMobile ? (
      <header className="App-header2">
        <img src="/imgs/Logo.png" alt="Neon Verge Logo" className="App-logo2" />
      </header>
    ) : (
      <header className="App-header">
        <img src="/imgs/Logo.png" alt="Neon Verge Logo" className="App-logo" />
        <h1>Neon Verge Heroes</h1>
      </header>
    )}

    <div className="App" style={{ '--background-image': 'url(/imgs/Fond.jpg)' }}>
      <main>
        <HeroNFT />
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
  )
}

export default App;
