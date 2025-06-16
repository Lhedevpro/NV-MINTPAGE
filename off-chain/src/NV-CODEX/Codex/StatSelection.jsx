import React from 'react';
import { statNames } from '../../utils/statUtils';
import './StatSelection.css';

const StatSelection = ({ selectedMission, heroStats, onStatSelect, loading }) => (
    <div className="center-buttons">
        {selectedMission?.requiredStats.map((isAvailable, index) => (
            isAvailable && (
                <button
                    key={index}
                    className="action-btn"
                    onClick={() => onStatSelect(index)}
                    disabled={loading}
                >
                    <div className="mission-info">
                        <div className="mission-name">{statNames[index]}</div>
                        <div className="mission-difficulty">Value: {heroStats[['STR', 'DEX', 'INT', 'VIT', 'CHA', 'LCK'][index]]}</div>
                    </div>
                </button>
            )
        ))}
    </div>
);

export default StatSelection; 