import React from 'react';
import { getClass } from '../../utils/heroUtils';
import './HeroInfo.css';

const HeroInfo = ({ heroStats, heroName, rarityClass, isMobile = false }) => {
    // Version mobile
    if (isMobile) {
        return (
            <div className="hero-mobile">
                <h2 className="hero-name-mobile">{heroName}</h2>

                <div className={`hero-image-wrapper-mobil ${rarityClass}`}>
                    <img
                        src={`/imgs/${heroStats.imgId}.png`}
                        alt={`Hero ${heroName}`}
                        className="hero-image-mobil"
                    />
                </div>

                <div className="hero-stats-mobile">
                    <p>Class: {getClass(heroStats.class)}</p>
                    <div className="stats-grid-mobile">
                        <p>STR: {heroStats.STR}</p>
                        <p>DEX: {heroStats.DEX}</p>
                        <p>INT: {heroStats.INT}</p>
                        <p>VIT: {heroStats.VIT}</p>
                        <p>CHA: {heroStats.CHA}</p>
                        <p>LCK: {heroStats.LCK}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Version desktop
    return (
        <div className="hero-left">
            <div className="hero-name-container">
                <h2 className="hero-name">{heroName}</h2>
            </div>
            <div className={`hero-image-wrapper ${rarityClass}`}>
                <img
                    src={`/imgs/${heroStats.imgId}.png`}
                    alt={`Hero ${heroName}`}
                    className="hero-image"
                />
            </div>
            <div className="hero-stats">
                <p>Class: {getClass(heroStats.class)}</p>
                <div className="stats-grid">
                    <p>STR: {heroStats.STR}</p>
                    <p>DEX: {heroStats.DEX}</p>
                    <p>INT: {heroStats.INT}</p>
                    <p>VIT: {heroStats.VIT}</p>
                    <p>CHA: {heroStats.CHA}</p>
                    <p>LCK: {heroStats.LCK}</p>
                </div>
            </div>
        </div>
    );
};

export default HeroInfo; 