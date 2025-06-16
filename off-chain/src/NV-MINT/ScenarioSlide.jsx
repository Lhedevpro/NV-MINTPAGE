import React, { useState, useEffect } from 'react';
import './ScenarioSlide.css';

const scenarios = {
  soulbound_active: {
    intro: "Bio-chip corrupted. Soulbound status: active.",
    messages: [
      "Bio-chip corrupted.",
      "Soulbound status: active.",
      "Override impossible."
    ],
    images: [
      "/scenes/soulbound/1.png",
      "/scenes/soulbound/2.png",
      "/scenes/soulbound/3.png"
    ]
  },
  zone_scan: {
    intro: "Scanning zone... Danger is not always visible.",
    messages: [
      "Environmental scan initiated.",
      "Toxicity level: 71%.",
      "Signal trace: anomalous structure detected."
    ],
    images: [
      "/scenes/scan/1.png",
      "/scenes/scan/2.png",
      "/scenes/scan/3.png"
    ]
  },

  wake_sequence: {
    intro: "You wake up with fragments of another life in your mind.",
    messages: [
      "Cortex reinitialization...",
      "Accessing fragment memory...",
      "Reactor pulse detected. You were not alone."
    ],
    images: [
      "/scenes/wake/1.png",
      "/scenes/wake/2.png",
      "/scenes/wake/3.png"
    ]
  }
};

export default function ScenarioSlide() {
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);

  const scenarioKeys = Object.keys(scenarios);
  const [currentScenarioKey, setCurrentScenarioKey] = useState(
    scenarioKeys[Math.floor(Math.random() * scenarioKeys.length)]
  );
  const scenario = scenarios[currentScenarioKey];


  useEffect(() => {
    let timeout;
    if (playing && step < scenario.images.length) {
      timeout = setTimeout(() => setStep(step + 1), 1800);
    } else if (step >= scenario.images.length) {
      setTimeout(() => setPlaying(false), 1000);
    }
    return () => clearTimeout(timeout);
  }, [playing, step]);

  const handleStart = () => {
    setStep(0);
    setPlaying(true);
  };

  return (
    <div className="scenario-slide-container">
        <div className="intro-lore">
            <p className="lore-main">
                Born in the ashes of Neon Verge, they all dream of engraving their names into the block of destiny.  
                But not all will make it.
            </p>

            <p className="lore-line">
              {scenario.intro}
            </p>

            {!playing && (
                <button onClick={handleStart} className="explore-btn">
                Launch Sequence
                </button>
            )}


            {step >= 0 && step < scenario.messages.length && (
            <div className="slide-message">
                {scenario.messages[step]}
            </div>
            )}
            {scenario.images.map((src, index) => (
                <img
                key={index}
                src={src}
                alt={`Scene ${index}`}
                className={`slide-image 
                    ${index === step ? 'visible' : 'hidden'}`}
                    />
                ))}


        </div>
    </div>
  );
}

/*<div className="intro-lore">
    <p className="lore-main">
        Born in the ashes of Neon Verge, they all dream of engraving their names into the block of destiny.  
        But not all will make it.
    </p>
    <p className="lore-line">
        {[
        "Protocol 7 initiated. Awaiting neural sync...",
        "Decryption complete. Combat routines online.",
        "Bio-chip corrupted. Soulbound status: active.",
        "Signal from District 9 confirmed. Hero is live.",
        "Memory shards fragmented. Ready for activation."
        ][Math.floor(Math.random() * 5)]}
    </p>
    <button className="explore-btn" onClick={() => alert("Comming soon...")}>
            Activate Protocol 💀
    </button>
</div>*/