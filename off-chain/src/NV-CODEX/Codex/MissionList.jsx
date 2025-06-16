import React from 'react';
import './MissionList.css';

const MissionList = ({ missions, onMissionClick, loading }) => (
    <div className="center-buttons">
        {missions.map((mission, index) => (
            <button 
                key={index}
                className="action-btn" 
                onClick={() => onMissionClick(mission)}
                disabled={loading}
            >
                <div className="mission-info">
                    <div className="mission-name">{mission.name}</div>
                    <div className="mission-difficulty">Difficulty: {mission.difficulty}</div>
                    <div className="mission-description">{mission.description}</div>
                </div>
            </button>
        ))}
    </div>
);

export default MissionList; 